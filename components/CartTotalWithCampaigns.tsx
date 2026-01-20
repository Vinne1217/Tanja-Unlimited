'use client';

import { useState, useEffect } from 'react';
import { useCampaignPrice } from '@/lib/useCampaignPrice';
import { formatPrice } from '@/lib/products';
import { getSubscriptionIntervalLabel } from '@/lib/subscription';
import type { CartItem } from '@/lib/cart-context';

type CartTotalWithCampaignsProps = {
  items: CartItem[];
  onTotalCalculated?: (total: number) => void;
};

// Component to calculate and expose price for a single cart item
function CartItemPriceCalculator({ 
  item, 
  onPriceCalculated 
}: { 
  item: CartItem;
  onPriceCalculated: (itemKey: string, price: number) => void;
}) {
  const productIdForCampaign = item.product.stripeProductId || item.product.id;
  const itemKey = `${item.product.id}${item.product.variantKey ? `:${item.product.variantKey}` : ''}`;
  
  const campaignPrice = useCampaignPrice(
    productIdForCampaign,
    item.product.price || 0,
    item.product.variantPriceId
  );

  const displayPrice = campaignPrice.hasCampaign && campaignPrice.campaignPrice 
    ? campaignPrice.campaignPrice 
    : item.product.price || 0;

  const totalPrice = displayPrice * item.quantity;

  useEffect(() => {
    onPriceCalculated(itemKey, totalPrice);
  }, [itemKey, totalPrice, onPriceCalculated]);

  return null; // This component doesn't render anything
}

export function CartTotalWithCampaigns({ items, onTotalCalculated }: CartTotalWithCampaignsProps) {
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});

  const handlePriceCalculated = (itemKey: string, price: number) => {
    setItemPrices(prev => ({
      ...prev,
      [itemKey]: price
    }));
  };

  const total = Object.values(itemPrices).reduce((sum, price) => sum + price, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Detect if cart contains subscription products
  const subscriptionItems = items.filter(
    (item) => item.product.type === 'subscription' && item.product.subscription
  );
  const hasSubscription = subscriptionItems.length > 0;
  const hasOnlySubscriptions =
    hasSubscription && items.every((item) => item.product.type === 'subscription');

  // If all subscription items share the same interval, use it for label
  const subscriptionInterval =
    subscriptionItems.length > 0
      ? subscriptionItems[0].product.subscription!.interval
      : null;
  const subscriptionIntervalCount =
    subscriptionItems.length > 0
      ? subscriptionItems[0].product.subscription!.intervalCount
      : 1;

  // Fallback to regular price calculation if campaign prices haven't loaded yet
  const fallbackTotal = items.reduce((sum, item) => {
    return sum + (item.product.price || 0) * item.quantity;
  }, 0);

  // Use campaign price total if all prices are loaded, otherwise use fallback
  // But prefer campaign prices even if not all loaded (to show correct price as items load)
  const allPricesLoaded = Object.keys(itemPrices).length === items.length;
  const displayTotal = allPricesLoaded ? total : (Object.keys(itemPrices).length > 0 ? total : fallbackTotal);

  // Notify parent when total changes
  useEffect(() => {
    if (onTotalCalculated) {
      if (allPricesLoaded) {
        console.log(`💰 CartTotalWithCampaigns: Notifying parent of calculated total: ${total} SEK (all ${items.length} items loaded)`);
        onTotalCalculated(total);
      } else if (Object.keys(itemPrices).length > 0) {
        // Use campaign prices if available, even if not all loaded
        console.log(`💰 CartTotalWithCampaigns: Notifying parent of partial total: ${total} SEK (${Object.keys(itemPrices).length}/${items.length} items loaded)`);
        onTotalCalculated(total);
      } else {
        // Fallback to original prices if no campaign prices loaded yet
        console.log(`💰 CartTotalWithCampaigns: Using fallback total: ${fallbackTotal} SEK (no campaign prices loaded yet)`);
        onTotalCalculated(fallbackTotal);
      }
    }
  }, [total, itemPrices, items.length, onTotalCalculated, allPricesLoaded, fallbackTotal]);

  return (
    <>
      {/* Hidden components to calculate campaign prices */}
      {items.map((item) => (
        <CartItemPriceCalculator
          key={`${item.product.id}${item.product.variantKey ? `:${item.product.variantKey}` : ''}`}
          item={item}
          onPriceCalculated={handlePriceCalculated}
        />
      ))}
      
      <div className="space-y-4 border-t border-warmOchre/20 pt-4">
        <div className="flex justify-between text-softCharcoal">
          <span>
            {hasOnlySubscriptions
              ? `Subtotal (${itemCount} ${itemCount === 1 ? 'prenumeration' : 'prenumerationer'})`
              : `Subtotal (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}
          </span>
          <span>
            {hasOnlySubscriptions && subscriptionInterval
              ? `${formatPrice(displayTotal, 'SEK')} /${getSubscriptionIntervalLabel(
                  subscriptionInterval,
                  subscriptionIntervalCount
                )}`
              : formatPrice(displayTotal, 'SEK')}
          </span>
        </div>
      </div>
    </>
  );
}
