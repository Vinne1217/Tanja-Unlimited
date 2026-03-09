'use client';

import { useEffect, useState } from 'react';
import { Tag, Sparkles } from 'lucide-react';

type CampaignBadgeProps = {
  productId: string;
  defaultPrice: number; // Original price in SEK
  currency?: string;
  onCampaignFound?: (campaignPrice: number) => void;
  hasVariants?: boolean; // Deprecated: API now handles variant detection automatically
  variantPriceId?: string; // For variant-specific campaign prices (original Stripe price ID)
};

type PriceInfo = {
  found: boolean;
  priceId?: string;
  amount?: number;
  currency?: string;
  isCampaign?: boolean;
  campaignInfo?: {
    originalAmount?: number;
    discountPercent?: number;
    description?: string;
  };
};

export default function CampaignBadge({
  productId,
  defaultPrice,
  currency = 'SEK',
  onCampaignFound,
  hasVariants = false,
  variantPriceId
}: CampaignBadgeProps) {
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Log component mount and props
  console.log(`🎨 CampaignBadge: Component rendered for product: ${productId}`, {
    defaultPrice,
    currency,
    variantPriceId: variantPriceId || 'none',
    hasVariants
  });

  useEffect(() => {
    // DISABLED: CampaignBadge now relies on server-injected variant.campaignPrice
    // Campaign prices are resolved server-side via batch endpoint in catalog.ts
    // This component should be replaced with direct variant.campaignPrice usage
    console.log(`⚠️ CampaignBadge: Legacy component - campaign prices should come from variant.campaignPrice`);
    setLoading(false);
    setPriceInfo(null);
    return;
    
    async function fetchCampaignPrice() {
      // DISABLED - This function is no longer used
      return;
      
      // Reset loading state when variant changes
      setLoading(true);
      setPriceInfo(null);
      
      console.log(`🔍 CampaignBadge: useEffect triggered for product: ${productId}${variantPriceId ? ` (variant: ${variantPriceId})` : ' (no variant)'}`);
      
      // Normalize variantPriceId: convert 'none' string to undefined for API call
      const normalizedVariantPriceId: string | undefined = variantPriceId && variantPriceId !== 'none' ? variantPriceId : undefined;
      
      // If we have variants but no variantPriceId selected yet, still fetch for product-level campaigns
      // We'll fetch without originalPriceId to check for product-level campaigns
      if (hasVariants && !normalizedVariantPriceId) {
        console.log(`ℹ️ CampaignBadge: No variant selected, checking for product-level campaigns...`);
      }
      
      try {
        // DISABLED: Use Source Portal API for campaign prices (supports variant-specific prices)
        // IMPORTANT: productId should be Stripe Product ID (prod_...), not baseSku
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        // Build URL with optional originalPriceId for variant-specific campaigns
        // productId should already be Stripe Product ID from product.stripeProductId
        let url = `/api/campaigns/price?productId=${encodeURIComponent(productId)}`;
        if (normalizedVariantPriceId) {
          // TypeScript: non-null assertion is safe here because of the if check
          url += `&originalPriceId=${encodeURIComponent(normalizedVariantPriceId!)}`;
        }

        console.log(`📡 CampaignBadge: Fetching from: ${url}`);

        const res = await fetch(url, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) {
          console.warn(`⚠️ CampaignBadge: API returned ${res.status} for ${productId}`);
          setLoading(false);
          return;
        }

        const data = await res.json();
        console.log(`📦 CampaignBadge: API response for ${productId}:`, {
          hasCampaignPrice: data.hasCampaignPrice,
          priceId: data.priceId,
          campaignName: data.campaignName,
          success: data.success,
          metadata: data.metadata,
          discountPercent: data.metadata?.discount_percent,
          amount: data.amount,
          unitAmount: data.metadata?.unit_amount
        });

        // If campaign price found, use API-provided data first (from customer portal)
        if (data.hasCampaignPrice && data.priceId) {
          console.log(`✅ CampaignBadge: Campaign found! Price ID: ${data.priceId}`);
          
          // PRIORITY 1: Use amount and metadata from API response (customer portal now provides this)
          if (data.amount && data.metadata?.discount_percent) {
            const campaignAmount = data.amount; // Already in cents
            const discountPercent = data.metadata.discount_percent;
            const originalAmount = data.metadata.original_unit_amount || (defaultPrice * 100);
            
            console.log(`💰 CampaignBadge: Using API-provided price data:`, {
              campaignAmount: campaignAmount / 100,
              originalAmount: originalAmount / 100,
              discountPercent,
              source: 'customer_portal_api'
            });
            
            if (discountPercent > 0) {
              const campaignInfo: PriceInfo = {
                found: true,
                priceId: data.priceId,
                amount: campaignAmount,
                currency: data.currency || currency,
                isCampaign: true,
                campaignInfo: {
                  originalAmount,
                  discountPercent,
                  description: data.campaignName
                }
              };
              
              setPriceInfo(campaignInfo);
              const campaignPrice = campaignAmount / 100; // Convert cents to SEK
              
              console.log(`🎯 CampaignBadge: Campaign price set from API! ${campaignPrice} SEK (${discountPercent}% off)`);
              
              // Notify parent component
              onCampaignFound?.(campaignPrice!); // Optional chaining + non-null assertion
              return; // Exit early - we have all the data we need
            }
          }
          
          // PRIORITY 2: Fallback to fetching from Stripe (for backward compatibility)
          console.log(`ℹ️ CampaignBadge: API response missing amount/metadata, trying Stripe fetch...`);
          try {
            // Fetch campaign price details from Stripe to get amount
            const priceRes = await fetch(`/api/products/price?productId=${productId}&stripePriceId=${encodeURIComponent(data.priceId)}`);
            if (priceRes.ok) {
              const priceData = await priceRes.json();
              console.log(`💰 CampaignBadge: Stripe price data:`, {
                found: priceData.found,
                amount: priceData.amount,
                currency: priceData.currency
              });
              
              if (priceData.found && priceData.amount) {
                // For variant products, we need to get the original variant price, not product default price
                // Try to fetch original variant price from Stripe if variantPriceId is provided
                let originalAmount = defaultPrice * 100; // Default: convert SEK to cents
                
                if (variantPriceId) {
                  try {
                    // Fetch original variant price from Stripe
                    // TypeScript: non-null assertion safe due to if check
                    const originalPriceRes = await fetch(`/api/products/price?productId=${productId}&stripePriceId=${encodeURIComponent(variantPriceId!)}`);
                    if (originalPriceRes.ok) {
                      const originalPriceData = await originalPriceRes.json();
                      if (originalPriceData.found && originalPriceData.amount) {
                        originalAmount = originalPriceData.amount; // Already in cents
                        console.log(`💰 CampaignBadge: Using variant original price: ${originalAmount / 100} SEK`);
                      }
                    }
                  } catch (error) {
                    console.warn(`⚠️ CampaignBadge: Could not fetch original variant price, using default:`, error);
                  }
                }
                
                // Calculate discount percentage
                const campaignAmount = priceData.amount;
                const discountPercent = Math.round(((originalAmount - campaignAmount) / originalAmount) * 100);

                console.log(`📊 CampaignBadge: Price calculation:`, {
                  campaignAmount,
                  originalAmount,
                  discountPercent,
                  defaultPrice,
                  variantPriceId: variantPriceId || 'none'
                });

                if (discountPercent > 0) {
                  const campaignInfo: PriceInfo = {
                    found: true,
                    priceId: data.priceId,
                    amount: campaignAmount,
                    currency: priceData.currency || currency,
                    isCampaign: true,
                    campaignInfo: {
                      originalAmount,
                      discountPercent,
                      description: data.campaignName
                    }
                  };

                  setPriceInfo(campaignInfo);
                  const campaignPrice = campaignAmount / 100; // Convert cents to SEK
                  
                  console.log(`🎯 CampaignBadge: Campaign price set! ${campaignPrice} SEK (${discountPercent}% off)`);
                  
                  // Notify parent component
                  onCampaignFound?.(campaignPrice!); // Optional chaining + non-null assertion
                } else {
                  console.warn(`⚠️ CampaignBadge: Discount percent is ${discountPercent}, not showing campaign`);
                }
              } else {
                console.warn(`⚠️ CampaignBadge: Stripe price data not found or missing amount`);
              }
            } else {
              // Price fetch failed (likely Stripe Connect account)
              console.warn(`⚠️ CampaignBadge: Failed to fetch Stripe price: ${priceRes.status} - price may be in Stripe Connect account`);
              
              // Try to get original price and calculate campaign price from metadata
              let originalAmount = defaultPrice * 100; // Default: convert SEK to cents
              
              // Try to fetch original variant price if available (this should work as it's not a campaign price)
              if (normalizedVariantPriceId && normalizedVariantPriceId !== 'none') {
                try {
                  // TypeScript: non-null assertion is safe here because of the if check
                  const originalPriceRes = await fetch(`/api/products/price?productId=${productId}&stripePriceId=${encodeURIComponent(normalizedVariantPriceId!)}`);
                  if (originalPriceRes.ok) {
                    const originalPriceData = await originalPriceRes.json();
                    if (originalPriceData.found && originalPriceData.amount) {
                      originalAmount = originalPriceData.amount; // Already in cents
                      console.log(`💰 CampaignBadge: Fetched original variant price: ${originalAmount / 100} SEK`);
                    }
                  }
                } catch (error) {
                  console.warn(`⚠️ CampaignBadge: Could not fetch original variant price:`, error);
                }
              }
              
              // Try to calculate campaign price from metadata discount_percent
              const discountPercent =
                data.metadata?.discount_percent || data.metadata?.discountPercent;

              if (!discountPercent || typeof discountPercent !== 'number' || discountPercent <= 0) {
                console.log(
                  `ℹ️ CampaignBadge: No valid discount metadata available - showing badge without price details`
                );
                // Don't show price if we can't calculate it - just show badge
                const campaignInfo: PriceInfo = {
                  found: true,
                  priceId: data.priceId,
                  amount: originalAmount, // Use original as placeholder
                  currency: currency,
                  isCampaign: true,
                  campaignInfo: {
                    originalAmount,
                    discountPercent: 0, // Unknown
                    description: data.campaignName
                  }
                };
                setPriceInfo(campaignInfo);
                return; // Exit early - badge will show but without price
              }

              const campaignAmount = Math.round(
                originalAmount * (1 - discountPercent / 100)
              );
              console.log(
                `💰 CampaignBadge: Calculated campaign price from metadata: ${campaignAmount / 100} SEK (${discountPercent}% off from ${originalAmount / 100} SEK)`
              );

              // Calculate discount percentage
              const calculatedDiscountPercent = Math.round(
                ((originalAmount - campaignAmount) / originalAmount) * 100
              );
              
              if (calculatedDiscountPercent > 0) {
                const campaignInfo: PriceInfo = {
                  found: true,
                  priceId: data.priceId,
                  amount: campaignAmount,
                  currency: currency,
                  isCampaign: true,
                  campaignInfo: {
                    originalAmount,
                    discountPercent: calculatedDiscountPercent,
                    description: data.campaignName
                  }
                };
                setPriceInfo(campaignInfo);
                console.log(`🎯 CampaignBadge: Campaign price calculated! ${campaignAmount / 100} SEK (${calculatedDiscountPercent}% off)`);
                
                // Notify parent component
                onCampaignFound?.(campaignAmount / 100); // Optional chaining
              } else {
                console.warn(`⚠️ CampaignBadge: Calculated discount is ${calculatedDiscountPercent}%, not showing campaign`);
              }
            }
          } catch (error) {
            // Campaign price is likely in Stripe Connect account (not accessible via platform key)
            // Show campaign badge anyway - checkout will use the correct price
            console.warn(`⚠️ CampaignBadge: Could not fetch campaign price (likely Stripe Connect):`, error instanceof Error ? error.message : 'Unknown error');
            console.log(`ℹ️ CampaignBadge: Showing campaign badge - price will be applied in checkout`);
            
            // Show campaign badge without exact price
            const originalAmount = defaultPrice * 100;
            const campaignInfo: PriceInfo = {
              found: true,
              priceId: data.priceId,
              amount: originalAmount, // Placeholder
              currency: currency,
              isCampaign: true,
              campaignInfo: {
                originalAmount,
                discountPercent: 0, // Unknown - will be calculated in checkout
                description: data.campaignName
              }
            };
            setPriceInfo(campaignInfo);
          }
        } else {
          console.log(`ℹ️ CampaignBadge: No campaign found for ${productId}${variantPriceId ? ` (variant: ${variantPriceId})` : ''}`);
        }
      } catch (error) {
        // Silently fail - just don't show campaign badge
        console.warn('Campaign lookup skipped:', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchCampaignPrice();
  }, [productId, variantPriceId, defaultPrice, currency, hasVariants, onCampaignFound]);

  if (loading || !priceInfo?.isCampaign || !priceInfo.campaignInfo) {
    return null;
  }

  const campaignPrice = priceInfo.amount! / 100; // Convert cents to SEK
  const originalPrice = priceInfo.campaignInfo.originalAmount! / 100;
  const discountAmount = originalPrice - campaignPrice;
  const discountPercent = priceInfo.campaignInfo.discountPercent || 0;

  return (
    <div className="space-y-3">
      {/* Campaign Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta text-ivory text-sm font-medium tracking-wider">
        <Sparkles className="w-4 h-4" />
        <span>
          {discountPercent > 0 
            ? `${discountPercent}% rabatt`
            : priceInfo.campaignInfo?.description || 'Kampanj'
          }
        </span>
      </div>

      {/* Pris visas i huvudsektionen – här visar vi bara badge + besparing för att undvika dubbla priser */}

      {/* Campaign Description */}
      {priceInfo.campaignInfo.description && (
        <div className="flex items-center gap-2 text-sm text-graphite/70">
          <Tag className="w-4 h-4" />
          <span>{priceInfo.campaignInfo.description}</span>
        </div>
      )}

      {/* Savings Display */}
      <div className="inline-block px-3 py-1 bg-terracotta/10 text-terracotta text-sm font-medium">
        Spara {discountAmount.toLocaleString('sv-SE')} {currency.toUpperCase()}
      </div>
    </div>
  );
}

