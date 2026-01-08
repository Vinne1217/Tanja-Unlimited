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
      const normalizedVariantPriceId = variantPriceId && variantPriceId !== 'none' ? variantPriceId : undefined;

      try {
        // Build URL with optional originalPriceId for variant-specific campaigns
        let url = `/api/campaigns/price?productId=${encodeURIComponent(productId)}`;
        if (normalizedVariantPriceId) {
          url += `&originalPriceId=${encodeURIComponent(normalizedVariantPriceId)}`;
        }

        const res = await fetch(url, {
          signal: AbortSignal.timeout(3000),
        });

        if (!res.ok) {
          // No campaign found or error - use default price
          setCampaignInfo({
            hasCampaign: false,
            originalPrice: defaultPrice,
          });
          return;
        }

        const data = await res.json();

        // If campaign price found, use API-provided data
        if (data.hasCampaignPrice && data.priceId) {
          // PRIORITY 1: Use amount and metadata from API response
          if (data.amount && data.metadata?.discount_percent) {
            const campaignAmount = data.amount; // Already in cents
            const discountPercent = data.metadata.discount_percent;
            const originalAmount = data.metadata.original_unit_amount || (defaultPrice * 100);
            const campaignPrice = campaignAmount / 100; // Convert cents to SEK
            const originalPrice = originalAmount / 100; // Convert cents to SEK

            if (discountPercent > 0) {
              setCampaignInfo({
                hasCampaign: true,
                campaignPrice,
                originalPrice,
                discountPercent,
                campaignName: data.campaignName,
                priceId: data.priceId,
              });
              return;
            }
          }

          // PRIORITY 2: Fallback - try to fetch from Stripe (for backward compatibility)
          // This is less reliable with Stripe Connect, but we'll try
          try {
            const priceRes = await fetch(`/api/products/price?productId=${encodeURIComponent(productId)}&stripePriceId=${encodeURIComponent(data.priceId)}`);
            if (priceRes.ok) {
              const priceData = await priceRes.json();
              if (priceData.found && priceData.amount) {
                const campaignAmount = priceData.amount / 100; // Convert cents to SEK
                const discountPercent = Math.round(((defaultPrice - campaignAmount) / defaultPrice) * 100);

                if (discountPercent > 0) {
                  setCampaignInfo({
                    hasCampaign: true,
                    campaignPrice: campaignAmount,
                    originalPrice: defaultPrice,
                    discountPercent,
                    campaignName: data.campaignName,
                    priceId: data.priceId,
                  });
                  return;
                }
              }
            }
          } catch (error) {
            console.warn(`⚠️ useCampaignPrice: Failed to fetch Stripe price for ${productId}:`, error);
          }
        }

        // No campaign found or invalid data
        setCampaignInfo({
          hasCampaign: false,
          originalPrice: defaultPrice,
        });
      } catch (error) {
        console.warn(`⚠️ useCampaignPrice: Error fetching campaign price for ${productId}:`, error);
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

