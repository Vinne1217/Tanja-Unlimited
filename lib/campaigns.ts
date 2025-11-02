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


