'use client';

import { useMemo } from 'react';
import { formatPrice } from '@/lib/products';
import type { CartItem } from '@/lib/cart-context';

type CartTotalProps = {
  items: CartItem[];
};

export function CartTotal({ items }: CartTotalProps) {
  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const unitPrice =
        item.product.finalPrice ??
        item.product.campaignPrice ??
        item.product.originalPrice ??
        item.product.price ??
        0;

      return sum + unitPrice * item.quantity;
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






