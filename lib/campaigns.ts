export type Campaign = {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  products?: string[]; // product ids
  startDate?: string;
  endDate?: string;
  stripeCouponId?: string;
  stripePromotionCodeId?: string;
  stripePriceIds?: string[]; // Campaign price IDs for checkout
  usageCount?: number;
  maxUses?: number;
};

const campaignStore = new Map<string, Campaign>();

export function upsertCampaign(c: Campaign) {
  campaignStore.set(c.id, c);
}

export function deleteCampaign(id: string) {
  campaignStore.delete(id);
}

export function listCampaigns(): Campaign[] {
  return Array.from(campaignStore.values());
}

export function findCampaignsForProduct(productId: string): Campaign[] {
  const now = Date.now();
  return listCampaigns().filter((c) => {
    if (c.status !== 'active') return false;
    if (c.startDate && new Date(c.startDate).getTime() > now) return false;
    if (c.endDate && new Date(c.endDate).getTime() < now) return false;
    return !c.products || c.products.includes(productId);
  });
}

/**
 * Find active campaign for a stripePriceId
 * Used during checkout to determine if a campaign price should be used
 */
export function findCampaignByStripePriceId(stripePriceId: string): Campaign | null {
  const now = Date.now();
  const campaigns = listCampaigns().filter((c) => {
    if (c.status !== 'active') return false;
    if (c.startDate && new Date(c.startDate).getTime() > now) return false;
    if (c.endDate && new Date(c.endDate).getTime() < now) return false;
    return c.stripePriceIds && c.stripePriceIds.includes(stripePriceId);
  });
  
  // Return the most recent campaign (by startDate)
  if (campaigns.length === 0) return null;
  
  return campaigns.sort((a, b) => {
    const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
    const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
    return bDate - aDate; // Most recent first
  })[0];
}

/**
 * Get active campaign for a product (checks both products array and stripePriceIds)
 */
export function getActiveCampaignForProduct(productId: string, variantStripePriceId?: string): Campaign | null {
  // First check if variant has a campaign price
  if (variantStripePriceId) {
    const variantCampaign = findCampaignByStripePriceId(variantStripePriceId);
    if (variantCampaign) return variantCampaign;
  }
  
  // Fallback to product-level campaigns
  const campaigns = findCampaignsForProduct(productId);
  return campaigns.length > 0 ? campaigns[0] : null;
}


