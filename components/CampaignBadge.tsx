'use client';

import { useEffect, useState } from 'react';
import { Tag, Sparkles } from 'lucide-react';

type CampaignBadgeProps = {
  productId: string;
  defaultPrice: number; // Original price in SEK
  currency?: string;
  onCampaignFound?: (campaignPrice: number) => void;
  hasVariants?: boolean; // Deprecated: API now handles variant detection automatically
  variantPriceId?: string; // For variant-specific campaign prices (original Stripe price ID)
};

type PriceInfo = {
  found: boolean;
  priceId?: string;
  amount?: number;
  currency?: string;
  isCampaign?: boolean;
  campaignInfo?: {
    originalAmount?: number;
    discountPercent?: number;
    description?: string;
  };
};

export default function CampaignBadge({
  productId,
  defaultPrice,
  currency = 'SEK',
  onCampaignFound,
  hasVariants = false,
  variantPriceId
}: CampaignBadgeProps) {
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaignPrice() {
      console.log(`🔍 CampaignBadge: Checking campaign price for product: ${productId}${variantPriceId ? ` (variant: ${variantPriceId})` : ' (no variant)'}`);
      
      try {
        // Use Source Portal API for campaign prices (supports variant-specific prices)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        // Build URL with optional originalPriceId for variant-specific campaigns
        let url = `/api/campaigns/price?productId=${encodeURIComponent(productId)}`;
        if (variantPriceId) {
          url += `&originalPriceId=${encodeURIComponent(variantPriceId)}`;
        }

        console.log(`📡 CampaignBadge: Fetching from: ${url}`);

        const res = await fetch(url, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) {
          console.warn(`⚠️ CampaignBadge: API returned ${res.status} for ${productId}`);
          setLoading(false);
          return;
        }

        const data = await res.json();
        console.log(`📦 CampaignBadge: API response for ${productId}:`, {
          hasCampaignPrice: data.hasCampaignPrice,
          priceId: data.priceId,
          campaignName: data.campaignName,
          success: data.success
        });

        // If campaign price found, fetch the actual price amount from Stripe
        if (data.hasCampaignPrice && data.priceId) {
          console.log(`✅ CampaignBadge: Campaign found! Fetching price details for ${data.priceId}`);
          try {
            // Fetch campaign price details from Stripe to get amount
            const priceRes = await fetch(`/api/products/price?productId=${productId}&stripePriceId=${encodeURIComponent(data.priceId)}`);
            if (priceRes.ok) {
              const priceData = await priceRes.json();
              console.log(`💰 CampaignBadge: Stripe price data:`, {
                found: priceData.found,
                amount: priceData.amount,
                currency: priceData.currency
              });
              
              if (priceData.found && priceData.amount) {
                // Calculate discount percentage
                const campaignAmount = priceData.amount;
                const originalAmount = defaultPrice * 100; // Convert SEK to cents
                const discountPercent = Math.round(((originalAmount - campaignAmount) / originalAmount) * 100);

                console.log(`📊 CampaignBadge: Price calculation:`, {
                  campaignAmount,
                  originalAmount,
                  discountPercent,
                  defaultPrice
                });

                if (discountPercent > 0) {
                  const campaignInfo: PriceInfo = {
                    found: true,
                    priceId: data.priceId,
                    amount: campaignAmount,
                    currency: priceData.currency || currency,
                    isCampaign: true,
                    campaignInfo: {
                      originalAmount,
                      discountPercent,
                      description: data.campaignName
                    }
                  };

                  setPriceInfo(campaignInfo);
                  const campaignPrice = campaignAmount / 100; // Convert cents to SEK
                  
                  console.log(`🎯 CampaignBadge: Campaign price set! ${campaignPrice} SEK (${discountPercent}% off)`);
                  
                  // Notify parent component
                  if (onCampaignFound) {
                    onCampaignFound(campaignPrice);
                  }
                } else {
                  console.warn(`⚠️ CampaignBadge: Discount percent is ${discountPercent}, not showing campaign`);
                }
              } else {
                console.warn(`⚠️ CampaignBadge: Stripe price data not found or missing amount`);
              }
            } else {
              console.warn(`⚠️ CampaignBadge: Failed to fetch Stripe price: ${priceRes.status}`);
            }
          } catch (error) {
            console.error('❌ CampaignBadge: Failed to fetch campaign price details from Stripe:', error);
          }
        } else {
          console.log(`ℹ️ CampaignBadge: No campaign found for ${productId}${variantPriceId ? ` (variant: ${variantPriceId})` : ''}`);
        }
      } catch (error) {
        // Silently fail - just don't show campaign badge
        console.warn('Campaign lookup skipped:', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchCampaignPrice();
  }, [productId, variantPriceId, defaultPrice, currency, onCampaignFound]);

  if (loading || !priceInfo?.isCampaign || !priceInfo.campaignInfo) {
    return null;
  }

  const campaignPrice = priceInfo.amount! / 100; // Convert cents to SEK
  const originalPrice = priceInfo.campaignInfo.originalAmount! / 100;
  const discountAmount = originalPrice - campaignPrice;
  const discountPercent = priceInfo.campaignInfo.discountPercent || 0;

  return (
    <div className="space-y-3">
      {/* Campaign Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta text-ivory text-sm font-medium tracking-wider">
        <Sparkles className="w-4 h-4" />
        <span>{discountPercent}% rabatt</span>
      </div>

      {/* Price Display with Strikethrough */}
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-serif text-terracotta">
          {campaignPrice.toLocaleString('sv-SE')} {currency.toUpperCase()}
        </span>
        <span className="text-2xl text-graphite/50 line-through">
          {originalPrice.toLocaleString('sv-SE')} {currency.toUpperCase()}
        </span>
      </div>

      {/* Campaign Description */}
      {priceInfo.campaignInfo.description && (
        <div className="flex items-center gap-2 text-sm text-graphite/70">
          <Tag className="w-4 h-4" />
          <span>{priceInfo.campaignInfo.description}</span>
        </div>
      )}

      {/* Savings Display */}
      <div className="inline-block px-3 py-1 bg-terracotta/10 text-terracotta text-sm font-medium">
        Spara {discountAmount.toLocaleString('sv-SE')} {currency.toUpperCase()}
      </div>
    </div>
  );
}

