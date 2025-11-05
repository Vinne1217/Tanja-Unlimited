import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCampaignPriceForProduct } from '@/lib/campaign-price-service';

const TENANT_ID = 'tanjaunlimited';

type CartItem = {
  quantity: number;
  stripePriceId: string; // from Source: variant price or product price
  productId?: string; // To check for campaign prices
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

  // Check for campaign prices and use them if available
  const line_items = await Promise.all(
    items.map(async (item) => {
      let priceId = item.stripePriceId;
      let campaignId: string | undefined;

      // If productId provided, check for campaign price
      if (item.productId) {
        const campaignPrice = await getCampaignPriceForProduct(TENANT_ID, item.productId);
        
        if (campaignPrice?.hasCampaignPrice && campaignPrice.stripePriceId) {
          priceId = campaignPrice.stripePriceId;
          campaignId = campaignPrice.campaignId;
          console.log(`🎯 Using campaign price: ${priceId} for product: ${item.productId}`);
          console.log(`   Campaign: ${campaignPrice.campaignName} (${campaignId})`);
        } else {
          console.log(`📝 Using default price: ${priceId} for product: ${item.productId}`);
        }
      }

      return { 
        price: priceId, 
        quantity: item.quantity || 1 
      };
    })
  );

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail,
    line_items,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { 
      tenant: process.env.SOURCE_TENANT_ID ?? TENANT_ID
    }
  });

  console.log(`✅ Checkout session created: ${session.id}`);

  return NextResponse.json({ url: session.url, id: session.id });
}


