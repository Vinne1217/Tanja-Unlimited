'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Loader2, Gift, X } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../../lib/cart-context';
import StockStatus from '../../components/StockStatus';
import { formatPrice } from '../../lib/products';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardVerified, setGiftCardVerified] = useState<{
    valid: boolean;
    balance?: number;
    expiresAt?: string;
  } | null>(null);
  const [verifyingGiftCard, setVerifyingGiftCard] = useState(false);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);

  // Verify gift card (read-only, no redemption)
  async function handleVerifyGiftCard() {
    if (!giftCardCode.trim()) {
      setGiftCardError('Please enter a gift card code');
      return;
    }

    setVerifyingGiftCard(true);
    setGiftCardError(null);
    setGiftCardVerified(null);

    try {
      const response = await fetch('/api/gift-cards/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: giftCardCode.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGiftCardError(data.error || 'Invalid gift card code');
        setGiftCardVerified({ valid: false });
        return;
      }

      if (data.valid) {
        setGiftCardVerified({
          valid: true,
          balance: data.balance,
          expiresAt: data.expiresAt
        });
        setGiftCardError(null);
      } else {
        setGiftCardError(data.error || 'Invalid gift card code');
        setGiftCardVerified({ valid: false });
      }
    } catch (error) {
      setGiftCardError('Failed to verify gift card. Please try again.');
      setGiftCardVerified({ valid: false });
    } finally {
      setVerifyingGiftCard(false);
    }
  }

  function handleClearGiftCard() {
    setGiftCardCode('');
    setGiftCardVerified(null);
    setGiftCardError(null);
  }

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
          giftCardCode: giftCardVerified?.valid ? giftCardCode.trim() : undefined, // Only include if verified
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // API returned an error
        const errorMessage = data.error || 'Unknown error occurred';
        console.error('Checkout API error:', {
          status: response.status,
          error: errorMessage,
          data
        });
        
        // If gift card error, clear it and show message
        if (giftCardCode && (errorMessage.includes('gift card') || errorMessage.includes('Gift card'))) {
          setGiftCardCode('');
          alert(`Gift card error: ${errorMessage}`);
        } else {
          alert(`Kunde inte slutföra köpet: ${errorMessage}`);
        }
        setCheckingOut(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout response missing URL:', data);
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Det uppstod ett fel vid behandling av din begäran: ${errorMessage}. Försök igen eller kontakta oss.`);
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
                      <p className="text-sm text-softCharcoal mb-2">Storlek: {item.product.variantKey}</p>
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
            <div className="bg-warmIvory border border-warmOchre/20 p-6 sticky top-24 space-y-6">
              <h2 className="text-2xl font-serif text-deepIndigo mb-6">Order Summary</h2>
              
              {/* Gift Card Section */}
              <div className="border-t border-warmOchre/20 pt-4">
                <h3 className="text-sm font-medium text-deepIndigo mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Gift Card
                </h3>
                <div className="space-y-2">
                  {giftCardVerified?.valid ? (
                    <div className="bg-sage/10 border border-sage/30 p-3 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-deepIndigo font-medium">
                          {giftCardCode.slice(0, 4)}****{giftCardCode.slice(-4)}
                        </span>
                        <button
                          onClick={handleClearGiftCard}
                          className="text-terracotta hover:text-terracotta/80 transition-colors"
                          aria-label="Remove gift card"
                          disabled={checkingOut}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-sage">
                        Balance: {formatPrice((giftCardVerified.balance || 0) / 100, 'SEK')}
                      </p>
                      {giftCardVerified.expiresAt && (
                        <p className="text-xs text-softCharcoal/60 mt-1">
                          Expires: {new Date(giftCardVerified.expiresAt).toLocaleDateString('sv-SE')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={giftCardCode}
                          onChange={(e) => {
                            setGiftCardCode(e.target.value);
                            setGiftCardError(null);
                            setGiftCardVerified(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && giftCardCode.trim()) {
                              handleVerifyGiftCard();
                            }
                          }}
                          placeholder="Enter gift card code"
                          className="flex-1 px-3 py-2 border border-warmOchre/20 bg-ivory text-deepIndigo focus:border-warmOchre focus:outline-none text-sm"
                          disabled={checkingOut || verifyingGiftCard}
                        />
                        {giftCardCode && (
                          <button
                            onClick={handleVerifyGiftCard}
                            disabled={verifyingGiftCard || !giftCardCode.trim() || checkingOut}
                            className="px-4 py-2 bg-indigo text-ivory hover:bg-indigoDeep transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {verifyingGiftCard ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Verify'
                            )}
                          </button>
                        )}
                      </div>
                      {giftCardError && (
                        <p className="text-xs text-terracotta">{giftCardError}</p>
                      )}
                      {!giftCardError && !giftCardVerified && (
                        <p className="text-xs text-softCharcoal/60">
                          Enter your gift card code and click Verify. It will be applied during checkout.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Totals */}
              <div className="space-y-4 border-t border-warmOchre/20 pt-4">
                <div className="flex justify-between text-softCharcoal">
                  <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>{formatPrice(total, 'SEK')}</span>
                </div>
                {giftCardVerified?.valid && (
                  <div className="flex justify-between text-sm text-sage">
                    <span>Gift card will be applied</span>
                    <span>—</span>
                  </div>
                )}
                <div className="border-t border-warmOchre/20 pt-4">
                  <div className="flex justify-between text-xl font-serif text-deepIndigo">
                    <span>Total</span>
                    <span>{formatPrice(total, 'SEK')}</span>
                  </div>
                  {giftCardVerified?.valid && (
                    <p className="text-xs text-softCharcoal/60 mt-1">
                      Final amount will be calculated at checkout
                    </p>
                  )}
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

