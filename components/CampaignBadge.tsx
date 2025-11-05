'use client';

import { useEffect, useState } from 'react';
import { Tag, Sparkles } from 'lucide-react';
import Stripe from 'stripe';

type CampaignBadgeProps = {
  productId: string;
  defaultPrice: number; // Original price in SEK
  currency?: string;
  onCampaignFound?: (campaignPrice: number) => void;
};

type CampaignData = {
  hasCampaignPrice: boolean;
  stripePriceId?: string;
  campaignId?: string;
  campaignName?: string;
  metadata?: Record<string, any>;
};

export default function CampaignBadge({
  productId,
  defaultPrice,
  currency = 'SEK',
  onCampaignFound
}: CampaignBadgeProps) {
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [campaignPrice, setCampaignPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaign() {
      try {
        // Check for active campaign price
        const res = await fetch(`/api/campaigns/price?productId=${productId}`);
        const data = await res.json();

        if (data.hasCampaignPrice && data.stripePriceId) {
          setCampaign(data);

          // Fetch actual price from Stripe
          const priceRes = await fetch(`/api/stripe/price?id=${data.stripePriceId}`);
          if (priceRes.ok) {
            const priceData = await priceRes.json();
            const actualPrice = priceData.unit_amount / 100; // Convert öre to SEK
            setCampaignPrice(actualPrice);
            
            // Notify parent component
            if (onCampaignFound) {
              onCampaignFound(actualPrice);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching campaign:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCampaign();
  }, [productId, onCampaignFound]);

  if (loading || !campaign?.hasCampaignPrice || !campaignPrice) {
    return null;
  }

  const discountAmount = defaultPrice - campaignPrice;
  const discountPercent = Math.round((discountAmount / defaultPrice) * 100);

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
          {campaignPrice.toLocaleString('sv-SE')} {currency}
        </span>
        <span className="text-2xl text-graphite/50 line-through">
          {defaultPrice.toLocaleString('sv-SE')} {currency}
        </span>
      </div>

      {/* Campaign Name */}
      {campaign.campaignName && (
        <div className="flex items-center gap-2 text-sm text-graphite/70">
          <Tag className="w-4 h-4" />
          <span>{campaign.campaignName}</span>
        </div>
      )}

      {/* Savings Display */}
      <div className="inline-block px-3 py-1 bg-terracotta/10 text-terracotta text-sm font-medium">
        Spara {discountAmount.toLocaleString('sv-SE')} {currency}
      </div>
    </div>
  );
}

