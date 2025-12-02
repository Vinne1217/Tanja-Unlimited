import { NextRequest, NextResponse } from 'next/server';
import { sourceFetch } from '@/lib/source';
import { mapProductId } from '@/lib/inventory-mapping';
import { STRIPE_PRODUCT_MAPPING } from '@/lib/stripe-products';

const TENANT_ID = 'tanjaunlimited';
const SOURCE_BASE = process.env.SOURCE_DATABASE_URL ?? 'https://source-database-809785351172.europe-north1.run.app';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  const originalPriceId = searchParams.get('originalPriceId'); // For variant-specific campaign prices

  if (!productId) {
    return NextResponse.json(
      { error: 'productId is required' },
      { status: 400 }
    );
  }

  try {
    // Convert customer portal product ID (e.g., "VALJ", "NJCilW") to Stripe Product ID
    // Source Portal campaign API expects Stripe Product IDs
    const tanjaProductId = mapProductId(productId);
    const stripeProductId = STRIPE_PRODUCT_MAPPING[tanjaProductId];
    
    // Use Stripe Product ID if available, otherwise try customer portal ID
    const apiProductId = stripeProductId || productId;
    
    console.log(`🔍 Campaign API: Product ID conversion:`, {
      customerPortalId: productId,
      tanjaProductId,
      stripeProductId: stripeProductId || 'not found',
      usingProductId: apiProductId
    });

    // Build URL with optional originalPriceId for variant-specific campaigns
    let url = `${SOURCE_BASE}/api/campaigns/price/${apiProductId}?tenant=${TENANT_ID}`;
    if (originalPriceId) {
      url += `&originalPriceId=${encodeURIComponent(originalPriceId)}`;
    }

    console.log(`🔍 Campaign API: Checking campaign price for product: ${productId} → ${apiProductId}${originalPriceId ? ` (variant: ${originalPriceId})` : ''}`);
    console.log(`📡 Campaign API: Calling Source Portal: ${url}`);

    const response = await fetch(url, {
      headers: {
        'X-Tenant': TENANT_ID,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    console.log(`📦 Campaign API: Source Portal response status: ${response.status}`);

    if (!response.ok) {
      // 404 or other error = no campaign found
      if (response.status === 404) {
        console.log(`ℹ️  No campaign found for product: ${productId}`);
        return NextResponse.json({
          success: true,
          hasCampaignPrice: false,
          productId
        });
      }
      
      console.warn(`⚠️ Campaign API returned ${response.status} for product: ${productId}`);
      return NextResponse.json({
        success: true,
        hasCampaignPrice: false,
        productId
      });
    }

    const data = await response.json();

    // Log full response for debugging
    console.log(`📊 Campaign API: Source Portal full response:`, JSON.stringify(data, null, 2));
    console.log(`📊 Campaign API: Source Portal response summary:`, {
      hasCampaignPrice: data.hasCampaignPrice,
      priceId: data.priceId,
      campaignId: data.campaignId,
      campaignName: data.campaignName,
      success: data.success,
      responseKeys: Object.keys(data)
    });

    if (!data.hasCampaignPrice) {
      console.log(`ℹ️ Campaign API: No campaign found for ${productId}`);
      return NextResponse.json({
        success: true,
        hasCampaignPrice: false,
        productId
      });
    }

    console.log(`🎯 Campaign API: Campaign price found for ${productId}:`, {
      priceId: data.priceId,
      campaignName: data.campaignName,
      originalPriceId: data.originalPriceId
    });

    return NextResponse.json({
      success: true,
      hasCampaignPrice: true,
      priceId: data.priceId,
      campaignId: data.campaignId,
      campaignName: data.campaignName,
      originalPriceId: data.originalPriceId,
      metadata: data.metadata,
      productId
    });
  } catch (error) {
    console.error('Error fetching campaign price:', error);
    // Fail gracefully - return no campaign if API is down
    return NextResponse.json({
      success: false,
      hasCampaignPrice: false,
      productId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

