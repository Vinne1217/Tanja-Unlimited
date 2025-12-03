/**
 * Campaign Price Service for Tanja Unlimited
 * Manages campaign pricing using Source database API
 * Similar to Kraftverk implementation
 */

import { sourceFetch } from './source';

export type CampaignPrice = {
  tenantId: string;
  productId: string;
  campaignId: string;
  stripePriceId: string;
  status: 'active' | 'expired';
  validFrom?: string;
  validTo?: string;
  metadata?: {
    campaign_name?: string;
    discount_percent?: number;
    [key: string]: any;
  };
};

export type PriceUpdatePayload = {
  stripePriceId: string;
  originalProductId: string;
  campaignId: string;
  campaignName?: string;
  metadata?: Record<string, any>;
};

/**
 * Store or update a campaign price in Source database
 */
export async function storeCampaignPrice(
  tenantId: string,
  priceUpdate: PriceUpdatePayload,
  eventId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const campaignPrice: CampaignPrice = {
      tenantId,
      productId: priceUpdate.originalProductId,
      campaignId: priceUpdate.campaignId,
      stripePriceId: priceUpdate.stripePriceId,
      status: 'active',
      validFrom: new Date().toISOString(),
      metadata: {
        campaign_name: priceUpdate.campaignName,
        ...priceUpdate.metadata,
      },
    };

    // Store in Source database via API
    console.log(`💾 Storing campaign price to Source API:`, {
      stripePriceId: priceUpdate.stripePriceId,
      productId: priceUpdate.originalProductId,
      campaignId: priceUpdate.campaignId,
      tenantId,
    });

    const res = await sourceFetch('/v1/campaign-prices', {
      method: 'POST',
      body: JSON.stringify({
        ...campaignPrice,
        eventId,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ Failed to store campaign price (${res.status}):`, errorText);
      console.error(`   Request payload:`, JSON.stringify(campaignPrice, null, 2));
      return { 
        success: false, 
        message: `Failed to store campaign price: ${res.status} ${errorText}` 
      };
    }

    const responseData = await res.json().catch(() => ({}));
    console.log(`✅ Successfully stored campaign price: ${priceUpdate.stripePriceId} for product: ${priceUpdate.originalProductId}`);
    console.log(`   Campaign: ${priceUpdate.campaignName || 'N/A'} (${priceUpdate.campaignId})`);
    console.log(`   Response:`, responseData);

    return { success: true, message: 'Price stored successfully' };
  } catch (error) {
    console.error('❌ Error storing campaign price:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      priceUpdate: {
        stripePriceId: priceUpdate.stripePriceId,
        productId: priceUpdate.originalProductId,
        campaignId: priceUpdate.campaignId,
      }
    });
    return { 
      success: false, 
      message: `Error storing campaign price: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Get active campaign price for a product
 * Returns null if no campaign or if Source API is unavailable (fail gracefully)
 */
export async function getCampaignPriceForProduct(
  tenantId: string,
  productId: string
): Promise<{
  hasCampaignPrice: boolean;
  stripePriceId?: string;
  campaignId?: string;
  campaignName?: string;
  metadata?: Record<string, any>;
} | null> {
  try {
    // Note: Source campaign-prices API endpoint may not be implemented yet
    // This will gracefully return null if the endpoint doesn't exist
    const res = await sourceFetch(
      `/v1/campaign-prices?tenantId=${tenantId}&productId=${productId}&status=active`,
      {
        // Add timeout to prevent blocking
        signal: AbortSignal.timeout(2000)
      }
    );

    if (!res.ok) {
      // 404 = endpoint doesn't exist yet, or no campaigns
      if (res.status === 404) {
        console.log(`ℹ️  No campaign price API or no campaigns for product: ${productId}`);
      } else {
        console.warn(`Campaign API returned ${res.status} for product: ${productId}`);
      }
      return { hasCampaignPrice: false };
    }

    const data = await res.json();
    const prices = Array.isArray(data) ? data : data.prices || [];

    if (prices.length === 0) {
      return { hasCampaignPrice: false };
    }

    // Get the most recent active campaign price
    const activeCampaign = prices.sort((a: CampaignPrice, b: CampaignPrice) => {
      return new Date(b.validFrom || 0).getTime() - new Date(a.validFrom || 0).getTime();
    })[0];

    console.log(`🎯 Found campaign price for ${productId}:`, {
      priceId: activeCampaign.stripePriceId,
      campaign: activeCampaign.campaignId,
    });

    return {
      hasCampaignPrice: true,
      stripePriceId: activeCampaign.stripePriceId,
      campaignId: activeCampaign.campaignId,
      campaignName: activeCampaign.metadata?.campaign_name,
      metadata: activeCampaign.metadata,
    };
  } catch (error) {
    // Fail gracefully - return no campaign if API is down or times out
    console.warn(`Campaign lookup skipped for ${productId}:`, error instanceof Error ? error.message : 'Unknown error');
    return { hasCampaignPrice: false };
  }
}

/**
 * Get all active campaign prices for a tenant
 */
export async function getActiveCampaignPrices(
  tenantId: string
): Promise<CampaignPrice[]> {
  try {
    const res = await sourceFetch(
      `/v1/campaign-prices?tenantId=${tenantId}&status=active`
    );

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.prices || [];
  } catch (error) {
    console.error('Error fetching active campaign prices:', error);
    return [];
  }
}

/**
 * Expire a campaign price
 */
export async function expireCampaignPrice(
  tenantId: string,
  campaignId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await sourceFetch(`/v1/campaign-prices/${campaignId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        tenantId,
        status: 'expired',
        validTo: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      console.error('Failed to expire campaign price:', await res.text());
      return { success: false, message: 'Failed to expire campaign' };
    }

    console.log(`⏰ Expired campaign: ${campaignId}`);
    return { success: true, message: 'Campaign expired' };
  } catch (error) {
    console.error('Error expiring campaign price:', error);
    return { success: false, message: 'Error expiring campaign' };
  }
}

/**
 * Check if event has already been processed (idempotency)
 */
export async function isEventProcessed(
  tenantId: string,
  eventId: string
): Promise<boolean> {
  if (!eventId) return false;

  try {
    const res = await sourceFetch(
      `/v1/campaign-prices/events/${eventId}?tenantId=${tenantId}`
    );
    return res.ok; // If found, it's been processed
  } catch {
    return false;
  }
}

