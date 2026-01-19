'use client';

import { useState, useEffect } from 'react';
import { detectSubscriptionFromStripePrice } from './subscription-detection';
import { formatSubscriptionInfo } from './subscription';

/**
 * Hook to detect and format subscription info with Stripe Price fallback
 * Used when Source Portal API doesn't return type: 'subscription'
 */
export function useSubscriptionDetection(
  product: {
    type?: string;
    subscription?: { interval: string; intervalCount: number };
    price?: number;
    variants?: Array<{ stripePriceId?: string }>;
  },
  stripePriceId?: string
): { subscriptionInfo: string | null; isDetecting: boolean } {
  const [subscriptionInfo, setSubscriptionInfo] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    // First, try synchronous check (if API provided subscription data)
    const syncInfo = formatSubscriptionInfo(product);
    if (syncInfo) {
      setSubscriptionInfo(syncInfo);
      setIsDetecting(false);
      return;
    }

    // If no subscription data from API, try Stripe Price fallback
    const priceIdToCheck = stripePriceId || product.variants?.[0]?.stripePriceId;
    if (priceIdToCheck && !product.type) {
      setIsDetecting(true);
      detectSubscriptionFromStripePrice(priceIdToCheck)
        .then((detection) => {
          if (detection?.isSubscription && detection.interval) {
            const price = product.price || 0;
            const interval = detection.interval;
            const intervalCount = detection.intervalCount || 1;

            // Formatera intervall på svenska
            const intervalText: Record<string, (count: number) => string> = {
              'day': (count) => count === 1 ? 'dag' : `${count} dagar`,
              'week': (count) => count === 1 ? 'vecka' : `${count} veckor`,
              'month': (count) => count === 1 ? 'månad' : `${count} månader`,
              'year': (count) => count === 1 ? 'år' : `${count} år`
            };

            const intervalLabel = intervalText[interval]?.(intervalCount) || interval;
            const formatted = `${price.toFixed(0)} kr/${intervalLabel}`;
            console.log(`✅ Detected subscription via Stripe Price fallback: ${formatted}`);
            setSubscriptionInfo(formatted);
          } else {
            setSubscriptionInfo(null);
          }
        })
        .catch((error) => {
          console.warn('⚠️ Error in subscription fallback detection:', error);
          setSubscriptionInfo(null);
        })
        .finally(() => {
          setIsDetecting(false);
        });
    } else {
      setSubscriptionInfo(null);
      setIsDetecting(false);
    }
  }, [product, stripePriceId]);

  return { subscriptionInfo, isDetecting };
}

