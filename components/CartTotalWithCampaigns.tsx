'use client';

import { useState, useEffect } from 'react';
import { useCampaignPrice } from '@/lib/useCampaignPrice';
import { formatPrice } from '@/lib/products';
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
    setItemPrices(prev => {
      const updated = {
        ...prev,
        [itemKey]: price
      };
      
      // Calculate total and notify parent
      const total = Object.values(updated).reduce((sum, p) => sum + p, 0);
      if (onTotalCalculated) {
        onTotalCalculated(total);
      }
      
      return updated;
    });
  };

  const total = Object.values(itemPrices).reduce((sum, price) => sum + price, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Fallback to regular price calculation if campaign prices haven't loaded yet
  const fallbackTotal = items.reduce((sum, item) => {
    return sum + (item.product.price || 0) * item.quantity;
  }, 0);

  const displayTotal = Object.keys(itemPrices).length === items.length ? total : fallbackTotal;

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
          <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span>{formatPrice(displayTotal, 'SEK')}</span>
        </div>
      </div>
    </>
  );
}
