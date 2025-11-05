'use client';

import { useState } from 'react';
import { ShoppingCart, Loader2 } from 'lucide-react';
import type { Product } from '@/lib/products';

type BuyNowButtonProps = {
  product: Product;
};

export default function BuyNowButton({ product }: BuyNowButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!product.stripePriceId) {
      alert('This product is not available for online purchase. Please contact us.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              quantity: 1,
              stripePriceId: product.stripePriceId,
              productId: product.id // Pass productId to check for campaign prices
            }
          ],
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.href
        })
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('There was an error processing your request. Please try again or contact us.');
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="flex items-center justify-center gap-3 w-full px-8 py-4 bg-indigo text-ivory hover:bg-indigoDeep transition-all duration-300 font-medium tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5" />
          <span>Buy Now</span>
        </>
      )}
    </button>
  );
}

