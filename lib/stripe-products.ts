/**
 * Stripe Product Mapping for Tanja Unlimited
 * Maps Tanja product IDs to Stripe Product IDs
 * Using Kraftverk's "Stripe-as-Database" approach
 */

import Stripe from 'stripe';

// Map Tanja product IDs to Stripe Product IDs
export const STRIPE_PRODUCT_MAPPING: Record<string, string> = {
  // The Tanja Jacket Collection
  'sjs-001': 'prod_TM8HrnCVZxAkzA',      // Short Jacket Silk (SJS)
  'ljsf-001': 'prod_TM8KNMKe85ZYMM',     // Long Jacket Silk fitted (LJSf)
  'sjcilw-001': 'prod_TM8ObxolUedP4W',   // Short jacket Cotton Imperial Line White (SJCilW)
  'njcilw-001': 'prod_TM8PR5YzRhLcGo',   // Nehru Jacket Cotton imperial line White (NJCilW)
  'ljckils-001': 'prod_TM8U3Iw6TlUoba',  // Long Jacket Cotton knee imperial line Silver (LJCkilS)
  'ljcfils-001': 'prod_TM8WtsmaCpBGLm',  // Long Jacket Cotton fitted imperial line Silver (LJCfilS)
  'ljckilg-001': 'prod_TTuI3y4djIk4dl',  // Long Jacket Cotton knee imperial line Gold (LJCkilG)
  'ljckilp-001': 'prod_TTuQwJfAiYh99j',  // Long Jacket Cotton knee imperial line Platinum (LJCkilP)
  'ljcfilg-001': 'prod_TTuM1DVrUtgru5',  // Long Jacket Cotton fitted imperial line Gold (LJCfilG)
  'ljcfild-001': 'prod_TTuSJQSVbUdio6',  // Long Jacket Cotton fitted imperial line Diamond (LJCfilD)
  
  // Add more products as you integrate them with Stripe
};

/**
 * Get the latest active price for a product from Stripe
 * This is how campaigns work - newest active price is used
 * 
 * Example:
 * Product has 2 prices:
 * - price_normal_6400kr (created Jan 1) - Active
 * - price_campaign_5120kr (created Nov 6) - Active ✨ NEWER
 * 
 * This function returns: price_campaign_5120kr
 */
export async function getLatestActivePriceForProduct(
  productId: string,
  stripeSecretKey: string,
  variantPriceIds?: string[] // Optional: list of variant price IDs to exclude from campaign detection
): Promise<{
  priceId: string;
  amount: number;
  currency: string;
  isCampaign: boolean;
  campaignInfo?: {
    originalAmount?: number;
    discountPercent?: number;
    description?: string;
  };
} | null> {
  const stripeProductId = STRIPE_PRODUCT_MAPPING[productId];
  
  if (!stripeProductId) {
    console.warn(`⚠️ No Stripe Product ID mapped for: ${productId}`);
    return null;
  }

  try {
    const stripe = new Stripe(stripeSecretKey, { 
      apiVersion: '2025-02-24.acacia' 
    });

    // Get ALL active prices for this Stripe Product
    const prices = await stripe.prices.list({
      product: stripeProductId,
      active: true,
      limit: 20, // Get all active prices
      expand: ['data.product']
    });

    if (prices.data.length === 0) {
      console.warn(`⚠️ No active prices found for product: ${productId} (${stripeProductId})`);
      return null;
    }

    // If variant price IDs provided, filter them out to check for campaign prices
    if (variantPriceIds && variantPriceIds.length > 0) {
      // Separate variant prices from potential campaign prices
      const variantPrices = prices.data.filter(p => variantPriceIds.includes(p.id));
      const nonVariantPrices = prices.data.filter(p => !variantPriceIds.includes(p.id));
      
      // If we have non-variant prices, check if they're campaign prices
      if (nonVariantPrices.length > 0) {
        // Get the base variant price for comparison (use first variant)
        const baseVariantPrice = variantPrices[0]?.unit_amount || 0;
        
        // Sort non-variant prices by creation date (newest first)
        const sorted = nonVariantPrices.sort((a, b) => {
          return (b.created || 0) - (a.created || 0);
        });
        
        const latestPrice = sorted[0];
        const amount = latestPrice.unit_amount || 0;
        
        // Check if this is cheaper than variant prices (campaign)
        if (baseVariantPrice > 0 && amount < baseVariantPrice) {
          const discountPercent = Math.round(((baseVariantPrice - amount) / baseVariantPrice) * 100);
          
          console.log(`🎯 Campaign price detected for variant product ${productId}:`, {
            campaignPrice: amount / 100,
            originalPrice: baseVariantPrice / 100,
            discount: `${discountPercent}%`,
            priceId: latestPrice.id
          });
          
          return {
            priceId: latestPrice.id,
            amount,
            currency: latestPrice.currency,
            isCampaign: true,
            campaignInfo: {
              originalAmount: baseVariantPrice,
              discountPercent,
              description: latestPrice.nickname || undefined
            }
          };
        }
      }
      
      // No campaign found for variant product
      console.log(`💰 No campaign found for variant product ${productId} (variants have fixed prices)`);
      return null;
    }

    // Original logic for non-variant products
    // Sort by creation date (newest first)
    const sorted = prices.data.sort((a, b) => {
      return (b.created || 0) - (a.created || 0);
    });

    const latestPrice = sorted[0];
    const amount = latestPrice.unit_amount || 0;
    
    // Check if this is a campaign price (if there are older active prices)
    const isCampaign = sorted.length > 1;
    let campaignInfo = undefined;

    if (isCampaign && sorted[1]) {
      const standardPrice = sorted[1];
      const originalAmount = standardPrice.unit_amount || 0;
      const discountPercent = Math.round(((originalAmount - amount) / originalAmount) * 100);
      
      campaignInfo = {
        originalAmount,
        discountPercent,
        description: latestPrice.nickname || undefined
      };

      console.log(`🎯 Campaign price detected for ${productId}:`, {
        campaignPrice: amount / 100,
        originalPrice: originalAmount / 100,
        discount: `${discountPercent}%`,
        priceId: latestPrice.id
      });
    } else {
      console.log(`💰 Standard price for ${productId}: ${amount / 100} ${latestPrice.currency.toUpperCase()}`);
    }

    return {
      priceId: latestPrice.id,
      amount,
      currency: latestPrice.currency,
      isCampaign,
      campaignInfo
    };
  } catch (error) {
    console.error(`❌ Error fetching prices for ${productId}:`, error);
    return null;
  }
}

/**
 * Check if a product has an active campaign
 */
export async function hasActiveCampaign(
  productId: string,
  stripeSecretKey: string
): Promise<boolean> {
  const result = await getLatestActivePriceForProduct(productId, stripeSecretKey);
  return result?.isCampaign || false;
}

