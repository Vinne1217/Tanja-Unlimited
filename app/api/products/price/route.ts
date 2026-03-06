import { NextRequest, NextResponse } from 'next/server';
import { getLatestActivePriceForProduct } from '@/lib/stripe-products';
import { getProductById } from '@/lib/products';
import { getTenantStripeConnectAccountId } from '@/lib/tenant-connect';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  const stripePriceId = searchParams.get('stripePriceId'); // Optional: fetch specific price ID

  if (!productId && !stripePriceId) {
    return NextResponse.json(
      { error: 'productId or stripePriceId is required' },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    // If stripePriceId is provided, fetch that specific price
    if (stripePriceId) {
      const stripe = new (await import('stripe')).default(process.env.STRIPE_SECRET_KEY, { 
        apiVersion: '2025-02-24.acacia' 
      });

      // Multi‑tenant Stripe Connect:
      // Resolve tenant from request, then map tenant → connected account ID.
      // If no mapping is found yet, fall back to platform account (no stripeAccount).
      const tenantIdHeader = req.headers.get('x-tenant');
      const tenantIdEnv = process.env.SOURCE_TENANT_ID;
      const tenantId = tenantIdHeader || tenantIdEnv || 'tanjaunlimited';

      const connectedAccountId = await getTenantStripeConnectAccountId(tenantId);

      const retrieveOptions = connectedAccountId
        ? { stripeAccount: connectedAccountId }
        : undefined;

      console.log('📦 Stripe price lookup:', {
        stripePriceId,
        tenantId,
        stripeAccount: connectedAccountId || 'PLATFORM_ACCOUNT'
      });

      const price = await stripe.prices.retrieve(
        stripePriceId,
        retrieveOptions as any // TS: options typing is strict; cast is safe here.
      );
      
      return NextResponse.json({
        found: true,
        productId: productId || undefined,
        priceId: price.id,
        amount: price.unit_amount || 0,
        currency: price.currency,
        isCampaign: false, // Can't determine if campaign without comparing to other prices
        campaignInfo: undefined
      });
    }

    // Otherwise, use the existing logic to get latest active price
    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required when stripePriceId is not provided' },
        { status: 400 }
      );
    }

    console.log(`📊 Campaign price lookup requested for product: ${productId}`);
    
    const priceInfo = await getLatestActivePriceForProduct(
      productId,
      process.env.STRIPE_SECRET_KEY
    );

    if (!priceInfo) {
      console.log(`ℹ️  No price info found for product: ${productId}`);
      return NextResponse.json({
        found: false,
        productId
      });
    }

    console.log(`✅ Price info found for ${productId}:`, {
      priceId: priceInfo.priceId,
      amount: priceInfo.amount,
      isCampaign: priceInfo.isCampaign,
      discountPercent: priceInfo.campaignInfo?.discountPercent
    });

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

