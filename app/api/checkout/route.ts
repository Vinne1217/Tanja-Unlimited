import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getLatestActivePriceForProduct, STRIPE_PRODUCT_MAPPING } from '@/lib/stripe-products';
import { mapProductId } from '@/lib/inventory-mapping';
import { getTenantConfig } from '@/lib/source';

const TENANT_ID = 'tanjaunlimited';

type CartItem = {
  quantity: number;
  stripePriceId: string; // fallback price ID
  productId?: string; // To query Stripe for latest price
  // Gift card fields (only when type === 'gift_card')
  type?: 'gift_card' | 'product';
  giftCardAmount?: number; // Amount in cents (e.g., 50000 = 500 SEK)
};

export async function POST(req: NextRequest) {
  // Initialize Stripe at runtime to avoid build-time errors
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe configuration missing' }, { status: 500 });
  }
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });

  // SAFETY CHECK: Ensure Stripe test mode only for gift cards
  const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
  const tenantId = process.env.SOURCE_TENANT_ID ?? TENANT_ID;

  const { items, customerEmail, successUrl, cancelUrl } = (await req.json()) as {
    items: CartItem[];
    customerEmail?: string;
    successUrl: string;
    cancelUrl: string;
  };

  // Check if any items are gift cards
  const hasGiftCard = items.some(item => item.type === 'gift_card');
  
  if (hasGiftCard) {
    // SAFETY: Gift cards only work in test mode
    if (!isTestMode) {
      console.error('❌ Gift card purchase blocked: Stripe is not in test mode');
      return NextResponse.json(
        { error: 'Gift cards are only available in test mode' },
        { status: 403 }
      );
    }

    // Check tenant configuration for gift card feature flag
    const tenantConfig = await getTenantConfig(tenantId);
    if (!tenantConfig.giftCardsEnabled) {
      console.error(`❌ Gift card purchase blocked: giftCardsEnabled is false for tenant ${tenantId}`);
      return NextResponse.json(
        { error: 'Gift cards are not enabled for this tenant' },
        { status: 403 }
      );
    }

    console.log(`✅ Gift card purchase allowed for tenant ${tenantId} (test mode)`);
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

  const line_items = await Promise.all(
    items.map(async (item, index) => {
      // Handle gift cards differently - they use the provided stripePriceId directly
      if (item.type === 'gift_card') {
        if (!item.stripePriceId) {
          throw new Error('Gift card items must include stripePriceId');
        }
        if (!item.giftCardAmount || item.giftCardAmount <= 0) {
          throw new Error('Gift card items must include valid giftCardAmount');
        }
        console.log(`🎁 Processing gift card: amount=${item.giftCardAmount}, priceId=${item.stripePriceId}`);
        return {
          price: item.stripePriceId,
          quantity: item.quantity || 1
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
        console.error(`❌ No price ID found for item ${index}:`, {
          productId: item.productId,
          stripePriceId: item.stripePriceId
        });
        throw new Error(`No price ID available for product ${item.productId || 'unknown'}`);
      }

      return { 
        price: priceId, 
        quantity: item.quantity || 1 
      };
    })
  );

  // Validate all line items have prices
  const invalidItems = line_items.filter(item => !item.price);
  if (invalidItems.length > 0) {
    console.error('❌ Some line items are missing prices:', {
      invalidItems,
      allItems: line_items,
      originalItems: items
    });
    return NextResponse.json(
      { error: 'Some products are missing price information. Please try again or contact support.' },
      { status: 400 }
    );
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

  // Add gift card metadata if this is a gift card purchase
  if (isGiftCardPurchase && giftCardItem) {
    sessionMetadata.type = 'gift_card';
    sessionMetadata.tenantId = tenantId; // Explicit tenant ID for webhook
    sessionMetadata.giftCardAmount = String(giftCardItem.giftCardAmount || 0);
    console.log(`🎁 Adding gift card metadata to checkout session:`, {
      type: 'gift_card',
      tenantId,
      giftCardAmount: giftCardItem.giftCardAmount
    });
  }

  console.log('📦 Creating checkout session with metadata:', sessionMetadata);

  // Gift cards don't require shipping (they're digital)
  const checkoutSessionConfig: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    customer_email: customerEmail,
    line_items,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: sessionMetadata,
    // Set locale to Swedish for proper translations
    locale: 'sv',
    // Enable shipping address collection (skip for gift cards)
    ...(isGiftCardPurchase ? {} : {
      shipping_address_collection: {
        allowed_countries: ['SE', 'NO', 'DK', 'FI', 'DE', 'GB', 'US', 'CA', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'PL', 'CZ'],
      },
    }),
    // Enable phone number collection
    phone_number_collection: {
      enabled: true,
    },
    // Allow customers to enter promotion codes in Stripe Checkout
    allow_promotion_codes: true,
  };

  const session = await stripe.checkout.sessions.create(checkoutSessionConfig);

  console.log(`✅ Checkout session created: ${session.id}`);

  return NextResponse.json({ url: session.url, id: session.id });
}


