import { NextRequest, NextResponse } from 'next/server';
import { getLatestActivePriceForProduct, STRIPE_PRODUCT_MAPPING } from '@/lib/stripe-products';
import { mapProductId } from '@/lib/inventory-mapping';
import { getTenantConfig, SOURCE_BASE, TENANT } from '@/lib/source';
import { maskGiftCardCode } from '@/lib/gift-cards';

const TENANT_ID = process.env.SOURCE_TENANT_ID ?? TENANT;

type CartItem = {
  quantity: number;
  stripePriceId: string; // fallback price ID
  productId?: string; // To query Stripe for latest price
  variantKey?: string; // Variant key/ID (article number/SKU)
  // Gift card fields (only when type === 'gift_card')
  type?: 'gift_card' | 'product';
  giftCardAmount?: number; // Amount in cents (e.g., 50000 = 500 SEK)
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

  // Get latest prices from Stripe (campaigns are newer prices on same product)
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

      let priceId = item.stripePriceId; // fallback to provided price
      let isCampaign = false;

      // If productId and variant price ID provided, check Source Portal for campaign price
      if (item.productId && item.stripePriceId) {
        try {
          // ✅ IMPROVED: Fetch Stripe Product ID from Storefront API instead of using mapping
          // This ensures we always use the correct Stripe Product ID
          let apiProductId: string;
          
          // Check if productId is already a Stripe Product ID
          if (item.productId.startsWith('prod_')) {
            apiProductId = item.productId;
            console.log(`✅ Using Stripe Product ID directly: ${apiProductId}`);
          } else {
            // Fetch product from Storefront API to get stripeProductId
            const product = await getProductFromStorefront(item.productId, { revalidate: 0 });
            
            if (product?.stripeProductId) {
              apiProductId = product.stripeProductId;
              console.log(`✅ Fetched Stripe Product ID from Storefront API: ${item.productId} → ${apiProductId}`);
            } else {
              // Fallback to mapping if Storefront API doesn't have stripeProductId
              console.warn(`⚠️ No stripeProductId in Storefront API for ${item.productId}, using mapping fallback`);
              const tanjaProductId = mapProductId(item.productId);
              apiProductId = STRIPE_PRODUCT_MAPPING[tanjaProductId] || item.productId;
            }
          }
          
          // Check Source Portal API for variant-specific campaign price
          const SOURCE_BASE = process.env.SOURCE_DATABASE_URL ?? 'https://source-database-809785351172.europe-north1.run.app';
          const TENANT_ID = process.env.SOURCE_TENANT_ID ?? 'tanjaunlimited';
          
          const campaignUrl = `${SOURCE_BASE}/api/campaigns/price/${apiProductId}?originalPriceId=${encodeURIComponent(item.stripePriceId)}&tenant=${TENANT_ID}`;
          
          console.log(`🔍 Checking campaign price for ${item.productId} → ${apiProductId} (variant: ${item.stripePriceId})`);
          
          const campaignResponse = await fetch(campaignUrl, {
            headers: {
              'X-Tenant': TENANT_ID,
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          });

          if (campaignResponse.ok) {
            const campaignData_response = await campaignResponse.json();
            
            if (campaignData_response.hasCampaignPrice && campaignData_response.priceId) {
              // Use campaign price
              priceId = campaignData_response.priceId;
              isCampaign = true;
              
              console.log(`🎯 Using campaign price for ${item.productId}:`);
              console.log(`   Campaign: ${campaignData_response.campaignName || 'Unknown'}`);
              console.log(`   Price ID: ${priceId}`);
              
              campaignData[`product_${index}_campaign`] = 'active';
              campaignData[`product_${index}_campaign_id`] = campaignData_response.campaignId || '';
              campaignData[`product_${index}_campaign_name`] = campaignData_response.campaignName || '';
            } else {
              // No campaign, use regular variant price
              console.log(`💰 Using standard price for ${item.productId} (variant: ${item.stripePriceId})`);
            }
          } else {
            // API call failed, fall back to regular price
            console.warn(`⚠️ Campaign API returned ${campaignResponse.status}, using regular price`);
          }
        } catch (error) {
          // Campaign API failed - use fallback price
          console.warn(`⚠️ Campaign price lookup failed for ${item.productId}, using regular price:`, error instanceof Error ? error.message : 'Unknown error');
        }
      } else if (item.productId) {
        // No variant price ID, check Source Portal for campaign price (for products without variants)
        // Also check if stripePriceId is provided - use it as originalPriceId
        try {
          // ✅ IMPROVED: Fetch Stripe Product ID from Storefront API instead of using mapping
          let apiProductId: string;
          
          // Check if productId is already a Stripe Product ID
          if (item.productId.startsWith('prod_')) {
            apiProductId = item.productId;
            console.log(`✅ Using Stripe Product ID directly: ${apiProductId}`);
          } else {
            // Fetch product from Storefront API to get stripeProductId
            const product = await getProductFromStorefront(item.productId, { revalidate: 0 });
            
            if (product?.stripeProductId) {
              apiProductId = product.stripeProductId;
              console.log(`✅ Fetched Stripe Product ID from Storefront API: ${item.productId} → ${apiProductId}`);
            } else {
              // Fallback to mapping if Storefront API doesn't have stripeProductId
              console.warn(`⚠️ No stripeProductId in Storefront API for ${item.productId}, using mapping fallback`);
              const tanjaProductId = mapProductId(item.productId);
              apiProductId = STRIPE_PRODUCT_MAPPING[tanjaProductId] || item.productId;
            }
          }
          
          // Check Source Portal API for campaign price
          const SOURCE_BASE = process.env.SOURCE_DATABASE_URL ?? 'https://source-database-809785351172.europe-north1.run.app';
          
          let campaignUrl = `${SOURCE_BASE}/api/campaigns/price/${apiProductId}?tenant=${TENANT_ID}`;
          // If stripePriceId is provided, use it as originalPriceId (for products without variants)
          if (item.stripePriceId) {
            campaignUrl += `&originalPriceId=${encodeURIComponent(item.stripePriceId)}`;
          }
          
          console.log(`🔍 Checking campaign price for ${item.productId} → ${apiProductId} (no variant)`);
          
          const campaignResponse = await fetch(campaignUrl, {
            headers: {
              'X-Tenant': TENANT_ID,
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          });

          if (campaignResponse.ok) {
            const campaignData_response = await campaignResponse.json();
            
            if (campaignData_response.hasCampaignPrice && campaignData_response.priceId) {
              // Use campaign price
              priceId = campaignData_response.priceId;
              isCampaign = true;
              
              console.log(`🎯 Using campaign price for ${item.productId}:`);
              console.log(`   Campaign: ${campaignData_response.campaignName || 'Unknown'}`);
              console.log(`   Price ID: ${priceId}`);
              
              campaignData[`product_${index}_campaign`] = 'active';
              campaignData[`product_${index}_campaign_id`] = campaignData_response.campaignId || '';
              campaignData[`product_${index}_campaign_name`] = campaignData_response.campaignName || '';
            } else {
              // No campaign found, use provided stripePriceId or fallback
              console.log(`💰 Using standard price for ${item.productId} (no campaign)`);
            }
          } else {
            // API call failed, fall back to provided price
            console.warn(`⚠️ Campaign API returned ${campaignResponse.status}, using provided price`);
          }
        } catch (error) {
          // Campaign API failed - use fallback price
          console.warn(`⚠️ Campaign price lookup failed for ${item.productId}, using provided price:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }

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
        stripePriceId: priceId // Use campaign price if found, otherwise original price
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
      itemsCount: backendItems.length
    });
    
    // Prepare request body for backend
    // ✅ CRITICAL: Include giftCardCode as direct property using spread operator
    // This ensures it's explicitly included in the JSON (not filtered out)
    const backendRequestBody = {
      items: backendItems,
      customerEmail: customerEmail || undefined,
      successUrl: successUrl,
      cancelUrl: cancelUrl,
      ...(giftCardCode && { giftCardCode: giftCardCode }), // Explicitly include if present
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


