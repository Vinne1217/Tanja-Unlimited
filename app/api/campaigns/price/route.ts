import { NextRequest, NextResponse } from 'next/server';
import { sourceFetch } from '@/lib/source';
import { mapProductId } from '@/lib/inventory-mapping';
import { STRIPE_PRODUCT_MAPPING } from '@/lib/stripe-products';
import { findCampaignByStripePriceId, getActiveCampaignForProduct } from '@/lib/campaigns';

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
    // Check if productId is already a Stripe Product ID (starts with "prod_")
    const isStripeProductId = productId.startsWith('prod_');
    
    let apiProductId: string;
    if (isStripeProductId) {
      // Already a Stripe Product ID, use directly
      apiProductId = productId;
      console.log(`✅ Campaign API: Using Stripe Product ID directly: ${productId}`);
    } else {
      // Convert customer portal product ID (e.g., "VALJ", "NJCilW") to Stripe Product ID
      // Source Portal campaign API expects Stripe Product IDs
      const tanjaProductId = mapProductId(productId);
      const stripeProductId = STRIPE_PRODUCT_MAPPING[tanjaProductId];
      
      // Use Stripe Product ID if available, otherwise try customer portal ID
      apiProductId = stripeProductId || productId;
      
      console.log(`🔍 Campaign API: Product ID conversion:`, {
        customerPortalId: productId,
        tanjaProductId,
        stripeProductId: stripeProductId || 'not found',
        usingProductId: apiProductId
      });
    }

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

    // Log response in smaller chunks to avoid truncation
    console.log(`📊 Campaign API: Source Portal response keys:`, Object.keys(data));
    console.log(`📊 Campaign API: hasCampaignPrice =`, data.hasCampaignPrice);
    console.log(`📊 Campaign API: success =`, data.success);
    console.log(`📊 Campaign API: priceId =`, data.priceId);
    console.log(`📊 Campaign API: campaignId =`, data.campaignId);
    console.log(`📊 Campaign API: campaignName =`, data.campaignName);
    console.log(`📊 Campaign API: originalPriceId =`, data.originalPriceId);
    
    // Log full response as string (might be truncated but better than object)
    try {
      const responseStr = JSON.stringify(data);
      console.log(`📊 Campaign API: Full response (first 500 chars):`, responseStr.substring(0, 500));
    } catch (e) {
      console.log(`📊 Campaign API: Could not stringify response`);
    }

    if (!data.hasCampaignPrice) {
      console.log(`ℹ️ Campaign API: No campaign found in Source Portal for ${productId}`);
      
      // Fallback: Check local campaign storage (synced via /api/campaigns/sync)
      // Note: originalPriceId is the regular price, we need to find campaigns that have campaign prices
      // for this product/variant
      const productCampaign = getActiveCampaignForProduct(productId, originalPriceId || undefined);
      if (productCampaign && productCampaign.stripePriceIds && productCampaign.stripePriceIds.length > 0) {
        console.log(`✅ Campaign API: Found campaign in local storage for ${productId}:`, {
          campaignId: productCampaign.id,
          campaignName: productCampaign.name,
          stripePriceIdsCount: productCampaign.stripePriceIds.length,
          stripePriceIds: productCampaign.stripePriceIds.slice(0, 3) // Log first 3
        });
        
        // Use first campaign price ID (campaign prices are in stripePriceIds array)
        // The backend will match the correct campaign price to the original price
        const campaignPriceId = productCampaign.stripePriceIds[0];
        
        return NextResponse.json({
          success: true,
          hasCampaignPrice: true,
          priceId: campaignPriceId,
          campaignId: productCampaign.id,
          campaignName: productCampaign.name,
          originalPriceId: originalPriceId,
          source: 'local_storage', // Indicate this came from local storage
          productId
        });
      }
      
      console.log(`ℹ️ Campaign API: No campaign found in Source Portal or local storage for ${productId}`);
      return NextResponse.json({
        success: true,
        hasCampaignPrice: false,
        productId
      });
    }

    console.log(`🎯 Campaign API: Campaign price found in Source Portal for ${productId}:`, {
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
      source: 'source_portal', // Indicate this came from Source Portal
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

