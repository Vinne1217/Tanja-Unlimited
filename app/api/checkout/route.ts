import { NextRequest, NextResponse } from 'next/server';
import { getLatestActivePriceForProduct, STRIPE_PRODUCT_MAPPING } from '@/lib/stripe-products';
import { mapProductId } from '@/lib/inventory-mapping';
import { getTenantConfig, SOURCE_BASE, TENANT } from '@/lib/source';
import { maskGiftCardCode } from '@/lib/gift-cards';

const TENANT_ID = process.env.SOURCE_TENANT_ID ?? TENANT;

type CartItem = {
  quantity: number;
  stripePriceId: string; // Stripe Price ID (required)
  productId?: string; // Product ID (optional, for logging only)
  variantKey?: string; // Variant key/ID (article number/SKU)
  // Optional price hints from storefront (in SEK). Backend/Source Portal must verify using price index.
  campaignPrice?: number | null;
  finalPrice?: number | null;
  // Gift card fields (only when type === 'gift_card')
  type?: 'gift_card' | 'product';
  giftCardAmount?: number; // Amount in cents (e.g., 50000 = 500 SEK)
  // NOTE: price and campaignPrice removed for security - backend resolves prices server-side
};

export async function POST(req: NextRequest) {
  const tenantId = process.env.SOURCE_TENANT_ID ?? TENANT_ID;

  const requestBody = await req.json() as {
    items: CartItem[];
    customerEmail?: string;
    successUrl: string;
    cancelUrl: string;
    giftCardCode?: string; // Optional gift card code (direct property - preferred)
    metadata?: {
      giftCardCode?: string; // Optional gift card code in metadata (fallback)
      [key: string]: any;
    };
  };

  const { items, customerEmail, successUrl, cancelUrl } = requestBody;
  
  // Extract gift card code from direct property or metadata (as per documentation)
  // Direct property is preferred, but metadata is checked as fallback
  const giftCardCode = requestBody.giftCardCode || requestBody.metadata?.giftCardCode;

  // Validate: Only one gift card code allowed
  if (giftCardCode && typeof giftCardCode !== 'string') {
    return NextResponse.json(
      { error: 'Invalid gift card code format' },
      { status: 400 }
    );
  }

  // Block combination with promotions (per requirements)
  if (giftCardCode) {
    // Note: Stripe promotion codes are handled by Stripe Checkout
    // We'll disable allow_promotion_codes when gift card is used
    console.log(`🎁 [API CHECKOUT] Gift card code found: ${maskGiftCardCode(giftCardCode)}`);
  } else {
    console.log(`⚠️ [API CHECKOUT] No gift card code found`);
  }

  // Check if any items are gift cards
  const hasGiftCard = items.some(item => item.type === 'gift_card');
  
  if (hasGiftCard) {
    // Check tenant configuration for gift card feature flag
    const tenantConfig = await getTenantConfig(tenantId);
    if (!tenantConfig.giftCardsEnabled) {
      console.error(`❌ Gift card purchase blocked: giftCardsEnabled is false for tenant ${tenantId}`);
      return NextResponse.json(
        { error: 'Gift cards are not enabled for this tenant' },
        { status: 403 }
      );
    }

    console.log(`✅ Gift card purchase allowed for tenant ${tenantId}`);
  }

  // Campaign metadata for tracking (no longer fetching prices - using storefront prices)
  const campaignData: Record<string, string> = {};
  
  // Check inventory using Storefront API - simpler and more reliable
  const { getVariantByPriceId, getProductFromStorefront } = await import('@/lib/inventory-storefront');
  
  // Check inventory for all items before processing
  // CRITICAL: Block checkout if inventory is missing or out of stock
  // SKIP inventory check for gift cards (they don't have inventory)
  for (const item of items) {
    // Skip inventory check for gift cards
    if (item.type === 'gift_card') {
      console.log(`✅ Skipping inventory check for gift card`);
      continue;
    }

    // Check by stripePriceId (for variants) - this is the most reliable check
    if (item.stripePriceId) {
      const variant = await getVariantByPriceId(item.stripePriceId, item.productId);
      
      if (!variant) {
        console.error(`❌ Checkout blocked: Variant not found for price ${item.stripePriceId}`);
        return NextResponse.json(
          { error: `This item is not available` },
          { status: 400 }
        );
      }
      
      // Check stock
      if (variant.stock <= 0 || variant.outOfStock) {
        console.error(`❌ Checkout blocked: Variant ${variant.size || 'N/A'} ${variant.color || 'N/A'} is out of stock (stock: ${variant.stock})`);
        return NextResponse.json(
          { error: `${variant.size || 'This size'} ${variant.color || ''} is out of stock`.trim() },
          { status: 400 }
        );
      }
      
      console.log(`✅ Stock check passed for ${item.stripePriceId}: ${variant.stock} in stock`);
    } else if (item.productId) {
      // Fallback: Check product-level inventory if no variant price ID
      const product = await getProductFromStorefront(item.productId, { revalidate: 0 });
      
      if (!product || !product.inStock) {
        console.error(`❌ Checkout blocked: Product ${item.productId} is out of stock`);
        return NextResponse.json(
          { error: `Product ${item.productId} is out of stock` },
          { status: 400 }
        );
      }
    }
  }

  // Transform items for backend API
  // Backend handles campaign prices automatically, but we can optionally check them first
  const backendItems = await Promise.all(
    items.map(async (item, index) => {
      // Handle gift cards - use provided stripePriceId directly
      if (item.type === 'gift_card') {
        if (!item.stripePriceId) {
          throw new Error('Gift card items must include stripePriceId');
        }
        if (!item.giftCardAmount || item.giftCardAmount <= 0) {
          throw new Error('Gift card items must include valid giftCardAmount');
        }
        console.log(`🎁 Processing gift card: amount=${item.giftCardAmount}, priceId=${item.stripePriceId}`);
        return {
          variantId: item.variantKey || item.productId || 'gift-card', // Fallback for gift cards
          quantity: item.quantity || 1,
          stripePriceId: item.stripePriceId
        };
      }

      // SECURITY: Backend must resolve prices server-side - never trust frontend prices
      // Resolve campaign price using stripePriceId → campaign lookup
      let originalPrice: number | undefined;
      let campaignPrice: number | undefined;
      let finalPrice: number | undefined;
      let isCampaign = false;
      let priceId = item.stripePriceId; // Default to original price ID
      
      try {
        // Step 1: Get original price from Stripe using stripePriceId
        // Use internal API route (server-side)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : 'http://localhost:3000';
        const priceRes = await fetch(`${baseUrl}/api/products/price?stripePriceId=${encodeURIComponent(item.stripePriceId)}`, {
          headers: {
            'X-Tenant': TENANT_ID
          },
          cache: 'no-store'
        });
        
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          if (priceData.found && priceData.amount) {
            // Convert from cents to SEK
            originalPrice = priceData.amount / 100;
          }
        }
        
        // Step 2: Check for campaign price using batch endpoint
        const campaignApiUrl = `${SOURCE_BASE}/api/campaigns/prices?priceIds=${encodeURIComponent(item.stripePriceId)}`;
        
        const campaignResponse = await fetch(campaignApiUrl, {
          headers: {
            'X-Tenant': TENANT_ID,
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        });
        
        if (campaignResponse.ok) {
          const campaignData_response = await campaignResponse.json();
          
          // Parse batch response: { "prices": { "price_abc": { "discountPercent": 20 }, "price_xyz": null } }
          if (campaignData_response.prices && campaignData_response.prices[item.stripePriceId]) {
            const campaignInfo = campaignData_response.prices[item.stripePriceId];
            
            if (campaignInfo && campaignInfo.discountPercent && originalPrice) {
              // Campaign exists - calculate campaign price from original price
              campaignPrice = Math.round(originalPrice * (1 - campaignInfo.discountPercent / 100) * 100) / 100;
              finalPrice = campaignPrice;
              isCampaign = true;
              
              campaignData[`product_${index}_campaign`] = 'active';
              campaignData[`product_${index}_discount_percent`] = campaignInfo.discountPercent.toString();
              
              console.log(`🎯 Campaign found for ${item.stripePriceId}: ${campaignInfo.discountPercent}% discount`);
            } else {
              // No campaign or missing original price
              finalPrice = originalPrice;
            }
          } else {
            // No campaign found
            finalPrice = originalPrice;
          }
        } else {
          // Campaign API failed - use original price
          finalPrice = originalPrice;
        }
      } catch (error) {
        console.warn(`⚠️ Price resolution failed for ${item.stripePriceId}:`, error instanceof Error ? error.message : 'Unknown error');
        // Fallback: use original price if available
        finalPrice = originalPrice;
      }
      
      // Log backend price resolution
      console.log("Checkout backend price resolution", {
        stripePriceId: item.stripePriceId,
        originalPrice: originalPrice,
        campaignPrice: campaignPrice,
        finalPrice: finalPrice,
        isCampaign,
        productId: item.productId
      });
      
      // Note: Final price resolution happens in Source Portal backend
      // We send stripePriceId and let the backend determine the correct Stripe Price ID
      // The backend is the source of truth for payment amounts

      // Validate that we have a price ID
      if (!priceId) {
        console.error(`❌ No price ID found for item:`, {
          productId: item.productId,
          stripePriceId: item.stripePriceId
        });
        throw new Error(`No price ID available for product ${item.productId || 'unknown'}`);
      }

      // Return backend format: variantId, quantity, stripePriceId
      return {
        variantId: item.variantKey || item.productId || `item-${index}`, // Use variantKey or productId as variantId
        quantity: item.quantity || 1,
        stripePriceId: priceId, // Use campaign price if found, otherwise original price
        // Forward storefront price hints unchanged so Source Portal can decide how to use them
        campaignPrice: item.campaignPrice ?? null,
        finalPrice: item.finalPrice ?? null
      };
    })
  );

  // Validate all items have required fields
  const invalidItems = backendItems.filter(item => !item.stripePriceId || !item.variantId);
  if (invalidItems.length > 0) {
    console.error('❌ Some items are missing required fields:', {
      invalidItems,
      allItems: backendItems,
      originalItems: items
    });
    return NextResponse.json(
      { error: 'Some products are missing required information. Please try again or contact support.' },
      { status: 400 }
    );
  }

  // Gift card code forwarding (NO redemption - handled by customer portal)
  // We only forward the code to Stripe metadata
  // Customer portal backend handles all redemption logic server-side
  if (giftCardCode) {
    console.log(`🎁 Forwarding gift card code to checkout: ${maskGiftCardCode(giftCardCode)}`);
    // Note: Verification happens in frontend, redemption happens in customer portal backend
  }

  // Build comprehensive metadata for Source portal
  const websiteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tanja-unlimited-809785351172.europe-north1.run.app';
  const websiteDomain = websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // Check if this checkout contains gift cards
  const giftCardItem = items.find(item => item.type === 'gift_card');
  const isGiftCardPurchase = !!giftCardItem;
  
  const sessionMetadata: Record<string, string> = {
    tenant: tenantId,
    source: 'tanja_website',
    website: websiteDomain,
    ...campaignData
  };

  // Add gift card code to metadata (forward only - no redemption)
  // Customer portal backend will handle redemption server-side
  if (giftCardCode) {
    sessionMetadata.giftCardCode = giftCardCode;
    console.log(`🎁 Forwarding gift card code in metadata: ${maskGiftCardCode(giftCardCode)}`);
  }

  // Add gift card metadata if this is a gift card purchase
  // Mandatory metadata fields per requirements:
  // - product_type: "giftcard"
  // - giftcard_amount: numeric value in major currency units (e.g. "500")
  // - giftcard_currency: ISO code (e.g. "SEK")
  // - tenant: tenant identifier (already exists)
  // - source: "tenant_webshop"
  if (isGiftCardPurchase && giftCardItem) {
    // Convert amount from cents to major currency units
    const giftCardAmountInMajorUnits = giftCardItem.giftCardAmount 
      ? Math.round(giftCardItem.giftCardAmount / 100).toString() 
      : '0';
    
    sessionMetadata.product_type = 'giftcard';
    sessionMetadata.giftcard_amount = giftCardAmountInMajorUnits;
    sessionMetadata.giftcard_currency = 'SEK'; // Default currency, could be made configurable
    sessionMetadata.source = 'tenant_webshop'; // Override source for gift cards per requirements
    
    console.log(`🎁 Adding gift card metadata to checkout session:`, {
      product_type: 'giftcard',
      giftcard_amount: giftCardAmountInMajorUnits,
      giftcard_currency: 'SEK',
      tenant: tenantId,
      source: 'tenant_webshop'
    });
  }

  console.log('📦 Creating checkout via backend endpoint:', {
    items: backendItems.length,
    metadata: sessionMetadata
  });

  // Call Source Portal backend endpoint (proxy pattern)
  // ✅ CRITICAL: We forward to Source Portal, NOT creating Stripe checkout directly
  // Source Portal handles gift card discounts and all checkout logic
  try {
    const backendUrl = `${SOURCE_BASE}/storefront/${tenantId}/checkout`;
    
    console.log(`🔄 [TENANT BACKEND] Forwarding checkout request to Source Portal:`, {
      url: backendUrl,
      tenantId,
      hasGiftCardCode: !!giftCardCode,
      isGiftCardPurchase,
      disableShipping: isGiftCardPurchase,
      itemsCount: backendItems.length
    });
    
    // Prepare request body for backend
    // ✅ CRITICAL: Include giftCardCode as direct property using spread operator
    // This ensures it's explicitly included in the JSON (not filtered out)
    // For gift card purchases, disable shipping to avoid Stripe API errors
    const backendRequestBody = {
      items: backendItems,
      customerEmail: customerEmail || undefined,
      successUrl: successUrl,
      cancelUrl: cancelUrl,
      ...(giftCardCode && { giftCardCode: giftCardCode }), // Explicitly include if present
      ...(isGiftCardPurchase && { disableShipping: true }), // Disable shipping for gift cards
      metadata: sessionMetadata
    };

    // Log detailed request body for debugging
    if (giftCardCode) {
      console.log(`🎁 [API CHECKOUT] Including giftCardCode in backend request body: ${maskGiftCardCode(giftCardCode)}`);
    } else {
      console.log(`⚠️ [API CHECKOUT] No giftCardCode to include in backend request`);
    }

    // Log request body structure
    console.log('📦 Backend request body structure:', {
      items: backendItems.length,
      hasGiftCardCode: !!backendRequestBody.giftCardCode,
      giftCardCodeValue: backendRequestBody.giftCardCode ? maskGiftCardCode(backendRequestBody.giftCardCode) : 'NOT SET',
      giftCardCodeInMetadata: !!sessionMetadata.giftCardCode,
      requestBodyKeys: Object.keys(backendRequestBody),
      itemsDetail: backendItems.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity,
        stripePriceId: item.stripePriceId
      }))
    });
    
    // Log full request body (for debugging - sanitize gift card code)
    console.log('📦 Full backend request body (sanitized):', JSON.stringify({
      ...backendRequestBody,
      giftCardCode: backendRequestBody.giftCardCode ? maskGiftCardCode(backendRequestBody.giftCardCode) : undefined
    }, null, 2));

    console.log(`📤 [TENANT BACKEND] Sending request to Source Portal...`);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenantId
      },
      body: JSON.stringify(backendRequestBody)
    });

    console.log(`📥 [TENANT BACKEND] Source Portal response status: ${backendResponse.status}`);

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ message: 'Unknown error' }));
      console.error(`❌ [TENANT BACKEND] Source Portal checkout failed: ${backendResponse.status}`, errorData);
      return NextResponse.json(
        { error: errorData.message || errorData.error || 'Checkout failed. Please try again.' },
        { status: backendResponse.status }
      );
    }

    const backendData = await backendResponse.json();
    
    console.log(`✅ [TENANT BACKEND] Source Portal response received:`, {
      success: backendData.success,
      hasCheckoutUrl: !!backendData.checkoutUrl,
      sessionId: backendData.sessionId || 'N/A'
    });

    if (!backendData.success || !backendData.checkoutUrl) {
      console.error('❌ [TENANT BACKEND] Source Portal response invalid:', backendData);
      return NextResponse.json(
        { error: backendData.message || 'Checkout failed. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`✅ [TENANT BACKEND] Checkout session created via Source Portal: ${backendData.sessionId || 'N/A'}`);

    // ✅ Return Source Portal's checkout URL to frontend
    return NextResponse.json({
      url: backendData.checkoutUrl,
      id: backendData.sessionId,
      orderId: backendData.orderId
    });
  } catch (error) {
    console.error('❌ [TENANT BACKEND] Error calling Source Portal checkout:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
}


