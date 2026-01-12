'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Loader2, Gift, X } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../../lib/cart-context';
import { formatPrice } from '../../lib/products';
import CartItem from '../../components/CartItem';
import { CartTotalWithCampaigns } from '../../components/CartTotalWithCampaigns';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardVerified, setGiftCardVerified] = useState<{
    valid: boolean;
    balance?: number; // In SEK for display
    balanceInCents?: number; // Original amount in cents
    expiresAt?: string;
    status?: string;
    currency?: string;
  } | null>(null);
  const [verifyingGiftCard, setVerifyingGiftCard] = useState(false);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);
  const [calculatedTotal, setCalculatedTotal] = useState<number | null>(null);

  // Log when calculatedTotal changes
  useEffect(() => {
    if (calculatedTotal !== null) {
      console.log(`💰 CartPage: calculatedTotal updated to: ${calculatedTotal} SEK`);
    }
  }, [calculatedTotal]);

  // Verify gift card (read-only, no redemption)
  async function handleVerifyGiftCard() {
    const formattedCode = giftCardCode.toUpperCase().trim();
    
    if (!formattedCode) {
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
          code: formattedCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error responses
        const errorMessage = data.error || data.message || 'Invalid gift card code';
        setGiftCardError(errorMessage);
        setGiftCardVerified({ valid: false });
        return;
      }

      if (data.valid) {
        // API returns balance in cents (öre), convert to SEK for display
        // balanceInCents is the original amount from API (in cents)
        const balanceInCents = data.balance || 0;
        const balanceInSEK = balanceInCents / 100;
        
        setGiftCardVerified({
          valid: true,
          balance: balanceInSEK, // Store in SEK for display
          balanceInCents: balanceInCents, // Keep original in cents for calculations
          expiresAt: data.expiresAt,
          status: data.status,
          currency: data.currency || 'SEK'
        });
        setGiftCardError(null);
      } else {
        setGiftCardError(data.error || 'Invalid gift card code');
        setGiftCardVerified({ valid: false });
      }
    } catch (error) {
      console.error('❌ Gift card verification failed:', error);
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
      // Prepare gift card code (uppercase, trimmed)
      const giftCardCodeToSend = giftCardVerified?.valid 
        ? giftCardCode.toUpperCase().trim() 
        : undefined;

      // Debug log (as per documentation)
      console.log('🔍 [CHECKOUT] Creating checkout with:', {
        items: items.length,
        giftCardCode: giftCardCodeToSend || 'NOT PROVIDED',
        hasGiftCard: !!giftCardCodeToSend,
        giftCardVerified: giftCardVerified?.valid || false,
        giftCardBalance: giftCardVerified?.balanceInCents || 0
      });

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
          giftCardCode: giftCardCodeToSend, // ✅ Direct property (preferred)
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.href,
          metadata: {
            // Include gift card code in metadata as backup (as per documentation)
            ...(giftCardCodeToSend && { giftCardCode: giftCardCodeToSend }),
          },
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

  // Note: Total is now calculated in CartTotalWithCampaigns component

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
            {items.map((item) => (
              <CartItem
                key={`${item.product.id}${item.product.variantKey ? `:${item.product.variantKey}` : ''}`}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
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
                        Balance: {formatPrice(giftCardVerified.balance || 0, giftCardVerified.currency || 'SEK')}
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
              <CartTotalWithCampaigns 
                items={items} 
                onTotalCalculated={setCalculatedTotal}
              />
              
              {/* Gift Card Discount Calculation */}
              {(() => {
                // Calculate totals in SEK (calculatedTotal is already in SEK)
                const subtotal = calculatedTotal !== null 
                  ? calculatedTotal 
                  : items.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0);
                
                // Gift card balance is in cents, convert to SEK
                const giftCardBalanceSEK = giftCardVerified?.balanceInCents 
                  ? giftCardVerified.balanceInCents / 100 
                  : (giftCardVerified?.balance || 0);
                
                // Calculate discount (min of gift card balance and subtotal)
                const discount = giftCardVerified?.valid 
                  ? Math.min(giftCardBalanceSEK, subtotal)
                  : 0;
                
                // Calculate final total (minimum 0.50 SEK for Stripe)
                const finalTotal = Math.max(0.50, subtotal - discount);
                
                return (
                  <>
                    {giftCardVerified?.valid && discount > 0 && (
                      <div className="flex justify-between text-sm text-sage">
                        <span>Gift card discount</span>
                        <span>-{formatPrice(discount, giftCardVerified.currency || 'SEK')}</span>
                      </div>
                    )}
                    {giftCardVerified?.valid && discount === 0 && (
                      <div className="flex justify-between text-sm text-softCharcoal/60">
                        <span>Gift card balance: {formatPrice(giftCardBalanceSEK, giftCardVerified.currency || 'SEK')}</span>
                        <span>(Less than order total)</span>
                      </div>
                    )}
                    <div className="border-t border-warmOchre/20 pt-4">
                      <div className="flex justify-between text-xl font-serif text-deepIndigo">
                        <span>Total</span>
                        <span>
                          {formatPrice(finalTotal, giftCardVerified?.currency || 'SEK')}
                        </span>
                      </div>
                      {giftCardVerified?.valid && discount > 0 && (
                        <p className="text-xs text-softCharcoal/60 mt-1">
                          {discount >= subtotal 
                            ? 'Gift card covers full amount' 
                            : `You'll pay ${formatPrice(finalTotal, giftCardVerified.currency || 'SEK')} at checkout`}
                        </p>
                      )}
                    </div>
                  </>
                );
              })()}
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

