'use client';

import { useState, useEffect } from 'react';

export type CampaignPriceInfo = {
  hasCampaign: boolean;
  campaignPrice?: number; // Price in SEK
  originalPrice: number; // Price in SEK
  discountPercent?: number;
  campaignName?: string;
  priceId?: string;
};

/**
 * Hook to fetch campaign price for a product
 * @param productId - Stripe Product ID (prod_...)
 * @param defaultPrice - Original price in SEK
 * @param variantPriceId - Optional variant Stripe Price ID for variant-specific campaigns
 */
export function useCampaignPrice(
  productId: string,
  defaultPrice: number,
  variantPriceId?: string
): CampaignPriceInfo {
  const [campaignInfo, setCampaignInfo] = useState<CampaignPriceInfo>({
    hasCampaign: false,
    originalPrice: defaultPrice,
  });

  useEffect(() => {
    // Legacy hook disabled: campaign prices are now resolved server-side.
    // Always return the original price and no active campaign.
    setCampaignInfo({
      hasCampaign: false,
      originalPrice: defaultPrice,
    });
  }, [productId, defaultPrice, variantPriceId]);

  return campaignInfo;
}

