'use client';

import { useEffect, useState } from 'react';
import { Tag, Sparkles } from 'lucide-react';

type CampaignBadgeProps = {
  productId: string;
  defaultPrice: number; // Original price in SEK
  currency?: string;
  onCampaignFound?: (campaignPrice: number) => void;
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
  onCampaignFound
}: CampaignBadgeProps) {
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrice() {
      try {
        // Query Stripe directly for latest price (Kraftverk approach)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`/api/products/price?productId=${productId}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data: PriceInfo = await res.json();

        if (data.found && data.isCampaign && data.amount) {
          setPriceInfo(data);
          const campaignPrice = data.amount / 100; // Convert cents to SEK
          
          // Notify parent component
          if (onCampaignFound) {
            onCampaignFound(campaignPrice);
          }
        }
      } catch (error) {
        // Silently fail - just don't show campaign badge
        console.warn('Campaign lookup skipped:', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchPrice();
  }, [productId, onCampaignFound]);

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

