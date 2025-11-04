import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

type CartItem = {
  quantity: number;
  stripePriceId: string; // from Source: variant price or product price
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

  const line_items = items.map((i) => ({ price: i.stripePriceId, quantity: i.quantity || 1 }));

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail,
    line_items,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { tenant: process.env.SOURCE_TENANT_ID ?? 'tanja' }
  });

  return NextResponse.json({ url: session.url, id: session.id });
}


