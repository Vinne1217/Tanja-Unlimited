import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getLatestActivePriceForProduct } from '@/lib/stripe-products';

const TENANT_ID = 'tanjaunlimited';

type CartItem = {
  quantity: number;
  stripePriceId: string; // fallback price ID
  productId?: string; // To query Stripe for latest price
};

export async function POST(req: NextRequest) {
  // Initialize Stripe at runtime to avoid build-time errors
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe configuration missing' }, { status: 500 });
  }
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });

  const { items, customerEmail, successUrl, cancelUrl } = (await req.json()) as {
    items: CartItem[];
    customerEmail?: string;
    successUrl: string;
    cancelUrl: string;
  };

  // Get latest prices from Stripe (campaigns are newer prices on same product)
  const campaignData: Record<string, string> = {};
  
  // Guide: Check inventory before allowing checkout
  // "Products are not available for purchase when outOfStock: true"
  const { getInventoryStatus, isStripePriceOutOfStock } = await import('@/lib/inventory');
  
  // Check inventory for all items before processing
  for (const item of items) {
    // Check by productId first
    if (item.productId) {
      const inventory = getInventoryStatus(item.productId);
      if (inventory?.outOfStock) {
        console.error(`❌ Checkout blocked: Product ${item.productId} is out of stock`, {
          inventory: {
            stock: inventory.stock,
            status: inventory.status,
            outOfStock: inventory.outOfStock
          }
        });
        return NextResponse.json(
          { error: `Product ${item.productId} is out of stock` },
          { status: 400 }
        );
      }
    }
    
    // Also check by stripePriceId if provided (for campaign prices)
    // Guide: "Match products by stripePriceId to update campaign price inventory"
    if (item.stripePriceId && isStripePriceOutOfStock(item.stripePriceId)) {
      console.error(`❌ Checkout blocked: Price ${item.stripePriceId} is out of stock`);
      return NextResponse.json(
        { error: `Price ${item.stripePriceId} is out of stock` },
        { status: 400 }
      );
    }
  }

  const line_items = await Promise.all(
    items.map(async (item, index) => {
      let priceId = item.stripePriceId; // fallback to provided price
      let isCampaign = false;

      // If productId and variant price ID provided, check Source Portal for campaign price
      if (item.productId && item.stripePriceId) {
        try {
          // Check Source Portal API for variant-specific campaign price
          const SOURCE_BASE = process.env.SOURCE_DATABASE_URL ?? 'https://source-database-809785351172.europe-north1.run.app';
          const TENANT_ID = process.env.SOURCE_TENANT_ID ?? 'tanjaunlimited';
          
          const campaignUrl = `${SOURCE_BASE}/api/campaigns/price/${item.productId}?originalPriceId=${encodeURIComponent(item.stripePriceId)}&tenant=${TENANT_ID}`;
          
          console.log(`🔍 Checking campaign price for ${item.productId} (variant: ${item.stripePriceId})`);
          
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
        // No variant price ID, try product-level campaign check (for products without variants)
        try {
          const priceInfo = await getLatestActivePriceForProduct(
            item.productId,
            process.env.STRIPE_SECRET_KEY!
          );
          
          if (priceInfo) {
            priceId = priceInfo.priceId;
            isCampaign = priceInfo.isCampaign;
            
            if (isCampaign && priceInfo.campaignInfo) {
              console.log(`🎯 Using campaign price for ${item.productId}:`);
              console.log(`   ${priceInfo.amount / 100} ${priceInfo.currency.toUpperCase()} (${priceInfo.campaignInfo.discountPercent}% off)`);
              campaignData[`product_${index}_campaign`] = 'active';
              campaignData[`product_${index}_discount`] = `${priceInfo.campaignInfo.discountPercent}%`;
            } else {
              console.log(`💰 Using standard price for ${item.productId}: ${priceInfo.amount / 100} ${priceInfo.currency.toUpperCase()}`);
            }
            
            campaignData[`product_${index}_id`] = item.productId;
            campaignData[`product_${index}_price`] = priceInfo.priceId;
          } else {
            console.log(`📝 Using fallback price for ${item.productId}: ${priceId}`);
            if (item.productId) {
              campaignData[`product_${index}_id`] = item.productId;
            }
          }
        } catch (error) {
          // Stripe API failed - use fallback price
          console.warn(`⚠️ Stripe price lookup failed for ${item.productId}, using fallback:`, error instanceof Error ? error.message : 'Unknown error');
          if (item.productId) {
            campaignData[`product_${index}_id`] = item.productId;
          }
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
  
  const sessionMetadata = {
    tenant: process.env.SOURCE_TENANT_ID ?? TENANT_ID,
    source: 'tanja_website',
    website: websiteDomain,
    ...campaignData
  };

  console.log('📦 Creating checkout session with metadata:', sessionMetadata);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail,
    line_items,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: sessionMetadata,
    // Enable shipping address collection
    shipping_address_collection: {
      allowed_countries: ['SE', 'NO', 'DK', 'FI', 'DE', 'GB', 'US', 'CA', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'PL', 'CZ'],
    },
    // Enable phone number collection
    phone_number_collection: {
      enabled: true,
    },
  });

  console.log(`✅ Checkout session created: ${session.id}`);

  return NextResponse.json({ url: session.url, id: session.id });
}


