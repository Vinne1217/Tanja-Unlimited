'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import StockStatus from '@/components/StockStatus';
import { formatPrice } from '@/lib/products';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);

  async function handleCheckout() {
    if (items.length === 0) return;

    // Check for out of stock items
    for (const item of items) {
      try {
        const res = await fetch(`/api/inventory/status?productId=${encodeURIComponent(item.product.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.outOfStock) {
            alert(`${item.product.name} är tyvärr slutsåld. Vänligen ta bort den från varukorgen.`);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to check stock:', error);
      }
    }

    setCheckingOut(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            quantity: item.quantity,
            stripePriceId: item.product.variantPriceId || item.product.stripePriceId,
            productId: item.product.id,
            variantKey: item.product.variantKey, // Include variant key if present
          })),
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('There was an error processing your request. Please try again or contact us.');
      setCheckingOut(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-ivory py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <Link
            href="/webshop"
            className="inline-flex items-center gap-2 text-sm text-warmOchre hover:text-deepIndigo transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>

          <div className="text-center py-16">
            <ShoppingCart className="w-24 h-24 text-ochre/20 mx-auto mb-6" />
            <h1 className="text-3xl font-serif text-deepIndigo mb-4">Your cart is empty</h1>
            <p className="text-softCharcoal mb-8">Add some beautiful pieces to get started!</p>
            <Link
              href="/webshop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo text-ivory hover:bg-indigoDeep transition-all duration-300 font-medium"
            >
              <span>Browse Products</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const total = getTotalPrice();

  return (
    <div className="min-h-screen bg-ivory py-16">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <Link
          href="/webshop"
          className="inline-flex items-center gap-2 text-sm text-warmOchre hover:text-deepIndigo transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>

        <h1 className="text-4xl font-serif text-deepIndigo mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const price = item.product.price || 0;
              const image = item.product.image || item.product.images?.[0];
              return (
                <motion.div
                  key={`${item.product.id}${item.product.variantKey ? `:${item.product.variantKey}` : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-warmIvory border border-warmOchre/20 p-6 flex gap-6"
                >
                  {image && (
                    <img
                      src={image}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover border border-ochre/20"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-serif text-deepIndigo mb-2">{item.product.name}</h3>
                    {item.product.variantKey && (
                      <p className="text-sm text-softCharcoal mb-2">Variant: {item.product.variantKey}</p>
                    )}
                    <StockStatus productId={item.product.id} />
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.product.variantKey)}
                          className="p-1 border border-warmOchre/20 hover:border-warmOchre transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.product.variantKey)}
                          className="p-1 border border-warmOchre/20 hover:border-warmOchre transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-serif text-deepIndigo">
                          {formatPrice(price * item.quantity, item.product.currency)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-softCharcoal/60">
                            {formatPrice(price, item.product.currency)} each
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id, item.product.variantKey)}
                      className="mt-4 flex items-center gap-2 text-sm text-terracotta hover:text-terracotta/80 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-warmIvory border border-warmOchre/20 p-6 sticky top-24">
              <h2 className="text-2xl font-serif text-deepIndigo mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-softCharcoal">
                  <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>{formatPrice(total, 'SEK')}</span>
                </div>
                <div className="border-t border-warmOchre/20 pt-4">
                  <div className="flex justify-between text-xl font-serif text-deepIndigo">
                    <span>Total</span>
                    <span>{formatPrice(total, 'SEK')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-indigo text-ivory hover:bg-indigoDeep transition-all duration-300 font-medium tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>Proceed to Checkout</span>
                  </>
                )}
              </button>
              <p className="text-xs text-graphite/60 text-center mt-4">
                Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

