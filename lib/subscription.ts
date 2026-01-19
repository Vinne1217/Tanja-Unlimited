/**
 * Format subscription information for display
 * @param product - Product with subscription info
 * @returns Formatted subscription string (e.g., "499 kr/månad") or null if not a subscription
 */
export function formatSubscriptionInfo(product: { type?: string; subscription?: { interval: string; intervalCount: number }; price?: number }): string | null {
  if (product.type !== 'subscription' || !product.subscription) {
    return null;
  }

  const { interval, intervalCount } = product.subscription;
  const price = product.price || 0; // Price is already in SEK

  // Formatera intervall på svenska
  const intervalText: Record<string, (count: number) => string> = {
    'day': (count) => count === 1 ? 'dag' : `${count} dagar`,
    'week': (count) => count === 1 ? 'vecka' : `${count} veckor`,
    'month': (count) => count === 1 ? 'månad' : `${count} månader`,
    'year': (count) => count === 1 ? 'år' : `${count} år`
  };

  const intervalLabel = intervalText[interval]?.(intervalCount) || interval;

  return `${price.toFixed(0)} kr/${intervalLabel}`;
}

/**
 * Get subscription interval description in Swedish
 * @param interval - Subscription interval (day, week, month, year)
 * @param intervalCount - Number of intervals
 * @returns Description like "varje månad" or "var 2:e månad"
 */
export function getSubscriptionIntervalDescription(interval: string, intervalCount: number): string {
  const intervalLabels: Record<string, string> = {
    'day': 'dag',
    'week': 'vecka',
    'month': 'månad',
    'year': 'år'
  };

  const intervalLabel = intervalLabels[interval] || interval;

  if (intervalCount === 1) {
    return `varje ${intervalLabel}`;
  } else {
    return `var ${intervalCount}:e ${intervalLabel}`;
  }
}

/**
 * Get subscription interval label in Swedish
 */
export function getSubscriptionIntervalLabel(interval: string, intervalCount: number): string {
  const labels: Record<string, (count: number) => string> = {
    'day': (count) => count === 1 ? 'dag' : `${count} dagar`,
    'week': (count) => count === 1 ? 'vecka' : `${count} veckor`,
    'month': (count) => count === 1 ? 'månad' : `${count} månader`,
    'year': (count) => count === 1 ? 'år' : `${count} år`
  };

  return labels[interval]?.(intervalCount) || interval;
}

