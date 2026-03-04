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
    async function fetchCampaignPrice() {
      // Normalize variantPriceId: convert 'none' string to undefined
      const normalizedVariantPriceId =
        variantPriceId && variantPriceId !== 'none' ? variantPriceId : undefined;

      try {
        // Bygg URL mot kampanj-API:t (ingen direkt Stripe-anrop här)
        let url = `/api/campaigns/price?productId=${encodeURIComponent(productId)}`;
        if (normalizedVariantPriceId) {
          url += `&originalPriceId=${encodeURIComponent(normalizedVariantPriceId)}`;
        }

        const res = await fetch(url, {
          signal: AbortSignal.timeout(3000),
        });

        if (!res.ok) {
          setCampaignInfo({
            hasCampaign: false,
            originalPrice: defaultPrice,
          });
          return;
        }

        const data = await res.json();

        console.log(`🔍 useCampaignPrice: API response for ${productId}:`, {
          hasCampaignPrice: data.hasCampaignPrice,
          priceId: data.priceId,
          amount: data.amount,
          metadata: data.metadata,
          discountPercent:
            data.metadata?.discount_percent || data.metadata?.discountPercent,
          originalUnitAmount: data.metadata?.original_unit_amount,
          campaignName: data.campaignName,
        });

        if (!data.hasCampaignPrice) {
          setCampaignInfo({
            hasCampaign: false,
            originalPrice: defaultPrice,
          });
          return;
        }

        // Tolka data från kampanj-API:t (alla belopp i öre)
        const rawDiscountPercent =
          data.metadata?.discount_percent || data.metadata?.discountPercent;

        let originalAmountCents: number =
          data.metadata?.original_unit_amount ?? Math.round(defaultPrice * 100);

        let campaignAmountCents: number | undefined = data.amount;

        // Om amount saknas men vi har rabattprocent, räkna ut kampanjbelopp från originalAmountCents
        if (!campaignAmountCents && rawDiscountPercent && typeof rawDiscountPercent === 'number') {
          campaignAmountCents = Math.round(
            originalAmountCents * (1 - rawDiscountPercent / 100)
          );
        }

        if (!campaignAmountCents) {
          // Kampanj utan giltig amount – visa bara ordinarie pris
          setCampaignInfo({
            hasCampaign: false,
            originalPrice: defaultPrice,
          });
          return;
        }

        const originalPrice = originalAmountCents / 100;
        const campaignPrice = campaignAmountCents / 100;

        const discountPercent =
          typeof rawDiscountPercent === 'number' && rawDiscountPercent > 0
            ? rawDiscountPercent
            : Math.round(((originalPrice - campaignPrice) / originalPrice) * 100);

        console.log(
          `💰 useCampaignPrice: Campaign price from API: ${campaignPrice} SEK (${discountPercent}% off from ${originalPrice} SEK)`
        );

        setCampaignInfo({
          hasCampaign: true,
          campaignPrice,
          originalPrice,
          discountPercent,
          campaignName: data.campaignName,
          priceId: data.priceId,
        });
      } catch (error) {
        console.warn(
          `⚠️ useCampaignPrice: Error fetching campaign price for ${productId}:`,
          error
        );
        setCampaignInfo({
          hasCampaign: false,
          originalPrice: defaultPrice,
        });
      }
    }

    fetchCampaignPrice();
  }, [productId, defaultPrice, variantPriceId]);

  return campaignInfo;
}

