/**
 * Fallback subscription detection from Stripe Price metadata
 * Used when Source Portal API doesn't return type: 'subscription'
 * 
 * Note: We can't directly access Stripe Connect prices from frontend,
 * so we try to use Source Portal Storefront API first
 */

export async function detectSubscriptionFromStripePrice(
  stripePriceId: string
): Promise<{ isSubscription: boolean; interval?: string; intervalCount?: number } | null> {
  if (!stripePriceId) {
    return null;
  }

  try {
    // Try Source Portal Storefront API first (has access to Stripe Connect)
    const SOURCE_BASE = process.env.NEXT_PUBLIC_SOURCE_DATABASE_URL || 'https://source-database-809785351172.europe-north1.run.app';
    const TENANT_ID = process.env.NEXT_PUBLIC_SOURCE_TENANT_ID || 'tanjaunlimited';
    
    try {
      // Try to fetch variant by price ID from Storefront API
      const variantResponse = await fetch(
        `${SOURCE_BASE}/storefront/${TENANT_ID}/variant/${stripePriceId}`,
        {
          headers: { 'X-Tenant': TENANT_ID }
        }
      );
      
      if (variantResponse.ok) {
        const variantData = await variantResponse.json();
        if (variantData.success && variantData.variant) {
          const variant = variantData.variant;
          
          // Check if variant has subscription info
          if (variant.subscription || variant.type === 'subscription') {
            console.log(`✅ Detected subscription from Storefront API variant ${stripePriceId}:`, {
              interval: variant.subscription?.interval,
              intervalCount: variant.subscription?.intervalCount
            });
            
            return {
              isSubscription: true,
              interval: variant.subscription?.interval || 'month',
              intervalCount: variant.subscription?.intervalCount || 1
            };
          }
          
          // Also check if product has subscription info
          if (variantData.product) {
            const product = variantData.product;
            if (product.type === 'subscription' || product.subscription) {
              console.log(`✅ Detected subscription from Storefront API product for variant ${stripePriceId}:`, {
                interval: product.subscription?.interval,
                intervalCount: product.subscription?.intervalCount
              });
              
              return {
                isSubscription: true,
                interval: product.subscription?.interval || 'month',
                intervalCount: product.subscription?.intervalCount || 1
              };
            }
          }
        }
      } else {
        console.log(`ℹ️ Storefront API variant endpoint returned ${variantResponse.status} for ${stripePriceId}`);
      }
    } catch (sourceError) {
      console.log(`ℹ️ Storefront API variant endpoint error:`, sourceError);
    }

    // Note: We don't try direct Stripe API because Stripe Connect prices aren't accessible
    // via platform account key. Source Portal API is the only way to get this data.
    console.log(`ℹ️ Could not detect subscription from Storefront API for ${stripePriceId}`);
    return null;
  } catch (error) {
    console.warn(`⚠️ Error detecting subscription from Stripe Price ${stripePriceId}:`, error);
    return null;
  }
}

