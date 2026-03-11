'use client';

import { useMemo } from 'react';
import { formatPrice } from '@/lib/products';
import type { CartItem } from '@/lib/cart-context';

type CartTotalDisplayProps = {
  items: CartItem[];
};

export function CartTotalDisplay({ items }: CartTotalDisplayProps) {
  const displayTotal = useMemo(() => {
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
    <>
      <div className="flex justify-between text-xl font-serif text-deepIndigo">
        <span>Total</span>
        <span>{formatPrice(displayTotal, 'SEK')}</span>
      </div>
    </>
  );
}

