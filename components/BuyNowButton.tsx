'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Loader2, XCircle, Check } from 'lucide-react';
import type { Product } from '@/lib/products';
import { useCart, type CartProduct } from '@/lib/cart-context';

type BuyNowButtonProps = {
  product: Product;
  onVariantChange?: (variantKey: string | null) => void; // Callback when variant changes
};

type InventoryData = {
  stock: number | null;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lowStock: boolean;
  outOfStock: boolean;
  hasData: boolean;
};

export default function BuyNowButton({ product, onVariantChange }: BuyNowButtonProps) {
  // Filter variants to only those with sizes
  const sizeVariants = product.variants?.filter(v => v.size) || [];
  const hasMultipleSizes = sizeVariants.length > 1;
  
  // Auto-select the only variant if there's only one size, otherwise start with null
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    hasMultipleSizes ? null : (sizeVariants[0]?.key || product.variants?.[0]?.key || null)
  );
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [variantInventories, setVariantInventories] = useState<Map<string, InventoryData>>(new Map());
  const [checkingStock, setCheckingStock] = useState(true);
  const [added, setAdded] = useState(false);
  const [campaignPrice, setCampaignPrice] = useState<{ amount: number; originalAmount: number; discountPercent: number } | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    async function fetchStockStatus() {
      try {
        // Fetch product-level inventory
        const res = await fetch(`/api/inventory/status?productId=${encodeURIComponent(product.id)}`, {
          cache: 'no-store'
        });
        
        if (res.ok) {
          const data = await res.json();
          setInventory(data);
        }

        // If product has variants, fetch inventory for each variant
        if (product.variants && product.variants.length > 0) {
          console.log(`📦 Fetching inventory for ${product.variants.length} variants for product ${product.id}`);
          const variantInventoryMap = new Map<string, InventoryData>();
          
          await Promise.all(
            product.variants.map(async (variant) => {
              try {
                const url = `/api/inventory/status?productId=${encodeURIComponent(product.id)}&stripePriceId=${encodeURIComponent(variant.stripePriceId)}`;
                console.log(`📡 Fetching variant inventory: ${variant.key} (${variant.stripePriceId})`);
                
                const variantRes = await fetch(url, { cache: 'no-store' });
                
                if (variantRes.ok) {
                  const variantData = await variantRes.json();
                  console.log(`✅ Variant inventory received for ${variant.key}:`, {
                    stock: variantData.stock,
                    outOfStock: variantData.outOfStock,
                    hasData: variantData.hasData,
                    source: variantData.source
                  });
                  variantInventoryMap.set(variant.key, variantData);
                } else {
                  console.warn(`⚠️ Failed to fetch inventory for variant ${variant.key}:`, variantRes.status);
                }
              } catch (error) {
                console.warn(`Failed to fetch inventory for variant ${variant.key}:`, error);
              }
            })
          );
          
          console.log(`📦 Variant inventory fetch complete. Found data for ${variantInventoryMap.size} variants`);
          setVariantInventories(variantInventoryMap);
        }
      } catch (error) {
        console.warn('Failed to fetch stock status:', error);
      } finally {
        setCheckingStock(false);
      }
    }

    fetchStockStatus();
  }, [product.id, product.variants]);

  // Fetch campaign price when variant is selected (for BuyNowButton's own display)
  // Note: CampaignBadge also fetches campaign prices, but this is for the button's internal state
  useEffect(() => {
    async function fetchCampaignPrice() {
      if (!selectedVariant || !product.variants) {
        setCampaignPrice(null);
        return;
      }

      const variant = product.variants.find(v => v.key === selectedVariant);
      if (!variant || !variant.stripePriceId) {
        setCampaignPrice(null);
        return;
      }

      try {
        // Use Stripe Product ID if available, otherwise use product.id
        const productIdForCampaign = product.stripeProductId || product.id;
        const url = `/api/campaigns/price?productId=${encodeURIComponent(productIdForCampaign)}&originalPriceId=${encodeURIComponent(variant.stripePriceId)}`;
        const res = await fetch(url, { cache: 'no-store' });
        
        if (res.ok) {
          const data = await res.json();
          if (data.hasCampaignPrice && data.priceId) {
            // PRIORITY 1: Use amount and metadata from API response (customer portal provides this)
            if (data.amount && data.metadata?.discount_percent) {
              const campaignAmount = data.amount / 100; // Convert cents to SEK
              const originalAmount = (data.metadata.original_unit_amount || (selectedVariantData?.price ?? product.price) * 100) / 100;
              const discountPercent = data.metadata.discount_percent;
              
              console.log(`💰 BuyNowButton: Using API-provided campaign price:`, {
                campaignAmount,
                originalAmount,
                discountPercent,
                source: 'customer_portal_api'
              });
              
              setCampaignPrice({
                amount: campaignAmount,
                originalAmount,
                discountPercent
              });
              return;
            }
            
            // PRIORITY 2: Fallback to fetching from Stripe (for backward compatibility)
            console.log(`ℹ️ BuyNowButton: API response missing amount/metadata, trying Stripe fetch...`);
            const priceRes = await fetch(`/api/products/price?productId=${encodeURIComponent(productIdForCampaign)}&stripePriceId=${encodeURIComponent(data.priceId)}`);
            if (priceRes.ok) {
              const priceData = await priceRes.json();
              if (priceData.found && priceData.amount) {
                const campaignAmount = priceData.amount / 100; // Convert cents to SEK
                // ✅ Use variant-specific price as original amount if available
                const originalAmount = selectedVariantData?.price ?? product.price;
                const discountPercent = Math.round(((originalAmount - campaignAmount) / originalAmount) * 100);
                
                setCampaignPrice({
                  amount: campaignAmount,
                  originalAmount,
                  discountPercent
                });
                return;
              }
            } else {
              console.warn(`⚠️ BuyNowButton: Stripe price fetch failed (${priceRes.status}) - price may be in Stripe Connect account`);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch campaign price:', error);
      }
      
      setCampaignPrice(null);
    }

    fetchCampaignPrice();
  }, [selectedVariant, product.id, product.stripeProductId, product.variants, product.price]);

  const selectedVariantData = product.variants?.find(v => v.key === selectedVariant);
  const priceId = selectedVariantData?.stripePriceId || product.stripePriceId;
  
  // Check variant inventory from synced data, or use variant's own stock/status properties
  // CRITICAL: Use API flags (outOfStock, status) instead of raw stock values
  // This ensures gift cards (which have stock: 0 or null) are handled correctly
  const selectedVariantInventory = selectedVariant ? variantInventories.get(selectedVariant) : null;
  const variantOutOfStock = selectedVariantInventory 
    ? (selectedVariantInventory.outOfStock || selectedVariantInventory.status === 'out_of_stock')
    : (selectedVariantData 
      ? (selectedVariantData.outOfStock || selectedVariantData.status === 'out_of_stock' || selectedVariantData.inStock === false)
      : true); // CRITICAL: If no inventory data and no variant data, treat as OUT OF STOCK (not in stock)

  function handleAddToCart() {
    if (!priceId) {
      alert('This product is not available for online purchase. Please contact us.');
      return;
    }

    // Only require variant selection if there are multiple sizes
    if (hasMultipleSizes && !selectedVariant) {
      alert('Vänligen välj en storlek.');
      return;
    }
    
    // If only one size variant, auto-select it
    if (!hasMultipleSizes && sizeVariants.length === 1 && !selectedVariant) {
      setSelectedVariant(sizeVariants[0].key);
    }

    // Check if out of stock - prioritize variant-level stock over product-level
    if (variantOutOfStock) {
      alert('Denna variant är tyvärr slutsåld. Vänligen välj en annan storlek eller kontakta oss för mer information.');
      return;
    }
    
    // Also check product-level inventory exists (fallback)
    if (inventory?.outOfStock) {
      alert('Detta produkt är tyvärr slutsåld. Vänligen kontakta oss för mer information.');
      return;
    }

    // Convert Product to CartProduct format
    // ✅ Use variant-specific price if available, otherwise use product price
    const variantPrice = selectedVariantData?.price ?? product.price;
    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      price: product.salePrice || variantPrice, // Use variant price if available
      currency: product.currency,
      category: product.category,
      description: product.description,
      image: product.image,
      inStock: !inventory?.outOfStock && !variantOutOfStock,
      stripePriceId: priceId || product.stripePriceId, // Use selected variant's price ID
      stripeProductId: product.stripeProductId, // Include Stripe Product ID for campaign price lookup
      variantKey: selectedVariant || undefined,
      variantPriceId: selectedVariantData?.stripePriceId,
    };

    addItem(cartProduct, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const isOutOfStock = inventory?.outOfStock ?? false;
  
  // Check if all variants are out of stock
  // CRITICAL: Use API flags (outOfStock, status) instead of raw stock values
  const allVariantsOutOfStock = product.variants && product.variants.length > 0 
    ? product.variants.every(variant => {
        const variantInventory = variantInventories.get(variant.key);
        return variantInventory 
          ? (variantInventory.outOfStock || variantInventory.status === 'out_of_stock')
          : (variant.outOfStock || variant.status === 'out_of_stock' || variant.inStock === false);
      })
    : false;
  
  // Only require variant selection if there are multiple sizes
  const requiresVariantSelection = hasMultipleSizes;
  
  const isDisabled = checkingStock || isOutOfStock || allVariantsOutOfStock || variantOutOfStock || (requiresVariantSelection && !selectedVariant);

  return (
    <div className="space-y-4">
      {/* Campaign Price Display */}
      {campaignPrice && (
        <div className="bg-terracotta/10 border border-terracotta/20 p-4 space-y-2">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-serif text-terracotta">
              {campaignPrice.amount.toLocaleString('sv-SE')} {product.currency || 'SEK'}
            </span>
            <span className="text-lg text-graphite/50 line-through">
              {campaignPrice.originalAmount.toLocaleString('sv-SE')} {product.currency || 'SEK'}
            </span>
            <span className="px-2 py-1 bg-terracotta text-ivory text-xs font-medium">
              {campaignPrice.discountPercent}% rabatt
            </span>
          </div>
          <div className="text-sm text-graphite/70">
            Spara {(campaignPrice.originalAmount - campaignPrice.amount).toLocaleString('sv-SE')} {product.currency || 'SEK'}
          </div>
        </div>
      )}

      {/* Size Selector - Only show if multiple sizes exist */}
      {hasMultipleSizes && (
        <div>
          <label className="block text-sm font-medium text-deepIndigo mb-2">
            {sizeVariants.length > 1 ? 'Storlekar' : 'Storlek'}
          </label>
          <select
            value={selectedVariant || ''}
            onChange={(e) => {
              const newVariant = e.target.value || null;
              setSelectedVariant(newVariant);
              if (onVariantChange) {
                onVariantChange(newVariant);
              }
            }}
            className="w-full px-4 py-3 border border-warmOchre/20 bg-ivory text-deepIndigo focus:border-warmOchre focus:outline-none transition-colors"
          >
            <option value="">Välj storlek</option>
            {sizeVariants.map((variant) => {
              const variantInventory = variantInventories.get(variant.key);
              // Check availability: use API flags (outOfStock, status) instead of raw stock values
              const stockCount = variantInventory?.stock ?? variant.stock ?? null;
              const isOutOfStock = variantInventory 
                ? (variantInventory.outOfStock || variantInventory.status === 'out_of_stock')
                : (variant.outOfStock || variant.status === 'out_of_stock' || variant.inStock === false);
              
              // Display label: show size (should always exist since we filtered for size variants)
              const displayLabel = variant.size || variant.key;
              
              // Stock display logic:
              // - Only show stock if low stock (< 10) with "snart slutsåld"
              // - If sold out, show "Slutsåld" and disable (but still visible)
              let stockText = '';
              if (isOutOfStock) {
                stockText = ' — Slutsåld';
              } else if (stockCount !== null && stockCount > 0 && stockCount < 10) {
                stockText = ' — Snart slutsåld';
              }
              
              return (
                <option key={variant.key} value={variant.key} disabled={isOutOfStock}>
                  {displayLabel}{stockText}
                </option>
              );
            })}
          </select>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={isDisabled}
        className="flex items-center justify-center gap-3 w-full px-8 py-4 bg-indigo text-ivory hover:bg-indigoDeep transition-all duration-300 font-medium tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {added ? (
          <>
            <Check className="w-5 h-5" />
            <span>Lagt i varukorg!</span>
          </>
        ) : isOutOfStock || variantOutOfStock ? (
          <>
            <XCircle className="w-5 h-5" />
            <span>Slutsåld</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            <span>Lägg i varukorg</span>
          </>
        )}
      </button>
    </div>
  );
}

