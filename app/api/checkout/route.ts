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
        return NextResponse.json(
          { error: `Product ${item.productId} is out of stock` },
          { status: 400 }
        );
      }
    }
    
    // Also check by stripePriceId if provided (for campaign prices)
    // Guide: "Match products by stripePriceId to update campaign price inventory"
    if (item.stripePriceId && isStripePriceOutOfStock(item.stripePriceId)) {
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

      // If productId provided, query Stripe for latest active price
      if (item.productId) {
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

      return { 
        price: priceId, 
        quantity: item.quantity || 1 
      };
    })
  );

  // Build comprehensive metadata for Source portal
  const sessionMetadata = {
    tenant: process.env.SOURCE_TENANT_ID ?? TENANT_ID,
    source: 'tanja_website',
    website: 'tanja-unlimited.onrender.com',
    ...campaignData
  };

  console.log('📦 Creating checkout session with metadata:', sessionMetadata);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail,
    line_items,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: sessionMetadata
  });

  console.log(`✅ Checkout session created: ${session.id}`);

  return NextResponse.json({ url: session.url, id: session.id });
}


