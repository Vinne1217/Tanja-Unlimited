import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const priceId = searchParams.get('id');

  if (!priceId) {
    return NextResponse.json(
      { error: 'Price ID is required' },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
      apiVersion: '2025-02-24.acacia' 
    });

    const price = await stripe.prices.retrieve(priceId);

    return NextResponse.json({
      id: price.id,
      unit_amount: price.unit_amount,
      currency: price.currency,
      type: price.type,
      recurring: price.recurring,
      product: price.product
    });
  } catch (error) {
    console.error('Error fetching Stripe price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price details' },
      { status: 500 }
    );
  }
}

