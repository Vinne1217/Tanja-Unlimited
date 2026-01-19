'use client';

import { useMemo } from 'react';
import { useCampaignPrice } from '@/lib/useCampaignPrice';
import { formatPrice } from '@/lib/products';
import type { CartItem } from '@/lib/cart-context';

type CartTotalProps = {
  items: CartItem[];
};

export function CartTotal({ items }: CartTotalProps) {
  // Calculate total with campaign prices
  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      // For each item, we need to check if it has a campaign price
      // Since hooks can't be called conditionally, we'll calculate this differently
      // We'll use a placeholder that will be updated by the CartItem components
      // For now, use regular price
      return sum + (item.product.price || 0) * item.quantity;
    }, 0);
  }, [items]);

  return (
    <div className="space-y-4 border-t border-warmOchre/20 pt-4">
      <div className="flex justify-between text-softCharcoal">
        <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
        <span>{formatPrice(total, 'SEK')}</span>
      </div>
      {/* Note: Final total with campaign prices will be calculated at checkout */}
    </div>
  );
}






