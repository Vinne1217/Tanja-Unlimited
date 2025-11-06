import { NextRequest, NextResponse } from 'next/server';
import { getLatestActivePriceForProduct } from '@/lib/stripe-products';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json(
      { error: 'productId is required' },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    const priceInfo = await getLatestActivePriceForProduct(
      productId,
      process.env.STRIPE_SECRET_KEY
    );

    if (!priceInfo) {
      return NextResponse.json({
        found: false,
        productId
      });
    }

    return NextResponse.json({
      found: true,
      productId,
      priceId: priceInfo.priceId,
      amount: priceInfo.amount,
      currency: priceInfo.currency,
      isCampaign: priceInfo.isCampaign,
      campaignInfo: priceInfo.campaignInfo
    });
  } catch (error) {
    console.error('Error fetching product price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price', found: false },
      { status: 500 }
    );
  }
}

