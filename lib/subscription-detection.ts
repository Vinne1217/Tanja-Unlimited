/**
 * Fallback subscription detection from Stripe Price metadata
 * Used when Source Portal API doesn't return type: 'subscription'
 */

export async function detectSubscriptionFromStripePrice(
  stripePriceId: string
): Promise<{ isSubscription: boolean; interval?: string; intervalCount?: number } | null> {
  if (!stripePriceId) {
    return null;
  }

  try {
    const response = await fetch(`/api/stripe/price?id=${encodeURIComponent(stripePriceId)}`);
    
    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch Stripe price ${stripePriceId} for subscription detection:`, response.status);
      return null;
    }

    const priceData = await response.json();
    
    // Check if price has recurring data (Stripe subscription prices have this)
    if (priceData.recurring) {
      console.log(`✅ Detected subscription from Stripe Price ${stripePriceId}:`, {
        interval: priceData.recurring.interval,
        intervalCount: priceData.recurring.interval_count
      });
      
      return {
        isSubscription: true,
        interval: priceData.recurring.interval,
        intervalCount: priceData.recurring.interval_count || 1
      };
    }

    return { isSubscription: false };
  } catch (error) {
    console.warn(`⚠️ Error detecting subscription from Stripe Price ${stripePriceId}:`, error);
    return null;
  }
}

