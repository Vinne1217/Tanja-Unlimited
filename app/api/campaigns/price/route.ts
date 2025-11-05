import { NextRequest, NextResponse } from 'next/server';
import { getCampaignPriceForProduct } from '@/lib/campaign-price-service';

const TENANT_ID = 'tanjaunlimited';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json(
      { error: 'productId is required' },
      { status: 400 }
    );
  }

  try {
    const campaignPrice = await getCampaignPriceForProduct(TENANT_ID, productId);

    if (!campaignPrice || !campaignPrice.hasCampaignPrice) {
      return NextResponse.json({
        hasCampaignPrice: false,
        productId
      });
    }

    return NextResponse.json({
      hasCampaignPrice: true,
      stripePriceId: campaignPrice.stripePriceId,
      campaignId: campaignPrice.campaignId,
      campaignName: campaignPrice.campaignName,
      metadata: campaignPrice.metadata,
      productId
    });
  } catch (error) {
    console.error('Error fetching campaign price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign price', hasCampaignPrice: false },
      { status: 500 }
    );
  }
}

