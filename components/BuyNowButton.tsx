'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Loader2, XCircle } from 'lucide-react';
import type { Product } from '@/lib/products';

type BuyNowButtonProps = {
  product: Product;
};

type InventoryData = {
  stock: number | null;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lowStock: boolean;
  outOfStock: boolean;
  hasData: boolean;
};

export default function BuyNowButton({ product }: BuyNowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [checkingStock, setCheckingStock] = useState(true);

  useEffect(() => {
    async function fetchStockStatus() {
      try {
        const res = await fetch(`/api/inventory/status?productId=${encodeURIComponent(product.id)}`, {
          cache: 'no-store'
        });
        
        if (res.ok) {
          const data = await res.json();
          setInventory(data);
        }
      } catch (error) {
        console.warn('Failed to fetch stock status:', error);
      } finally {
        setCheckingStock(false);
      }
    }

    fetchStockStatus();
  }, [product.id]);

  async function handleCheckout() {
    if (!product.stripePriceId) {
      alert('This product is not available for online purchase. Please contact us.');
      return;
    }

    // Check if out of stock
    if (inventory?.outOfStock) {
      alert('Detta produkt är tyvärr slutsåld. Vänligen kontakta oss för mer information.');
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

  const isOutOfStock = inventory?.outOfStock ?? false;
  const isDisabled = loading || checkingStock || isOutOfStock;

  return (
    <button
      onClick={handleCheckout}
      disabled={isDisabled}
      className="flex items-center justify-center gap-3 w-full px-8 py-4 bg-indigo text-ivory hover:bg-indigoDeep transition-all duration-300 font-medium tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : isOutOfStock ? (
        <>
          <XCircle className="w-5 h-5" />
          <span>Slutsåld</span>
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

