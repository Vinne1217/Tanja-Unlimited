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
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    product.variants?.[0]?.key || null
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

  // Fetch campaign price when variant is selected
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
        const url = `/api/campaigns/price?productId=${encodeURIComponent(product.id)}&originalPriceId=${encodeURIComponent(variant.stripePriceId)}`;
        const res = await fetch(url, { cache: 'no-store' });
        
        if (res.ok) {
          const data = await res.json();
          if (data.hasCampaignPrice && data.priceId) {
            // Fetch price amount from Stripe
            const priceRes = await fetch(`/api/products/price?productId=${encodeURIComponent(product.id)}&stripePriceId=${encodeURIComponent(data.priceId)}`);
            if (priceRes.ok) {
              const priceData = await priceRes.json();
              if (priceData.found && priceData.amount) {
                const campaignAmount = priceData.amount / 100; // Convert cents to SEK
                const originalAmount = product.price;
                const discountPercent = Math.round(((originalAmount - campaignAmount) / originalAmount) * 100);
                
                setCampaignPrice({
                  amount: campaignAmount,
                  originalAmount,
                  discountPercent
                });
                return;
              }
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch campaign price:', error);
      }
      
      setCampaignPrice(null);
    }

    fetchCampaignPrice();
  }, [selectedVariant, product.id, product.variants, product.price]);

  const selectedVariantData = product.variants?.find(v => v.key === selectedVariant);
  const priceId = selectedVariantData?.stripePriceId || product.stripePriceId;
  
  // Check variant inventory from synced data, or use variant's own stock/status properties
  const selectedVariantInventory = selectedVariant ? variantInventories.get(selectedVariant) : null;
  const variantOutOfStock = selectedVariantInventory 
    ? (selectedVariantInventory.outOfStock || (selectedVariantInventory.stock !== null && selectedVariantInventory.stock <= 0) || selectedVariantInventory.status === 'out_of_stock')
    : (selectedVariantData 
      ? (selectedVariantData.outOfStock || selectedVariantData.stock <= 0 || selectedVariantData.status === 'out_of_stock' || selectedVariantData.inStock === false)
      : false); // If no inventory data and no variant data, assume in stock

  function handleAddToCart() {
    if (!priceId) {
      alert('This product is not available for online purchase. Please contact us.');
      return;
    }

    if (product.variants && !selectedVariant) {
      alert('Vänligen välj en storlek.');
      return;
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
    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      price: product.salePrice || product.price,
      currency: product.currency,
      category: product.category,
      description: product.description,
      image: product.image,
      inStock: !inventory?.outOfStock && !variantOutOfStock,
      stripePriceId: product.stripePriceId, // Fallback
      variantKey: selectedVariant || undefined,
      variantPriceId: selectedVariantData?.stripePriceId,
    };

    addItem(cartProduct, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const isOutOfStock = inventory?.outOfStock ?? false;
  
  // Check if all variants are out of stock
  const allVariantsOutOfStock = product.variants && product.variants.length > 0 
    ? product.variants.every(variant => {
        const variantInventory = variantInventories.get(variant.key);
        const stockCount = variantInventory?.stock ?? variant.stock ?? 0;
        return variantInventory 
          ? (variantInventory.outOfStock || (variantInventory.stock !== null && variantInventory.stock <= 0) || variantInventory.status === 'out_of_stock')
          : (variant.outOfStock || stockCount <= 0 || variant.status === 'out_of_stock' || variant.inStock === false);
      })
    : false;
  
  const isDisabled = checkingStock || isOutOfStock || allVariantsOutOfStock || variantOutOfStock || (product.variants && !selectedVariant);

  // Determine if variants have sizes or colors to show correct label
  const hasSizes = product.variants?.some(v => v.size) ?? false;
  const hasColors = product.variants?.some(v => v.color) ?? false;
  const variantLabel = hasSizes ? 'Storlek' : hasColors ? 'Färg' : 'Variant';
  const placeholderText = hasSizes ? 'Välj storlek' : hasColors ? 'Välj färg' : 'Välj variant';

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

      {/* Variant Selector */}
      {product.variants && product.variants.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-deepIndigo mb-2">
            {variantLabel}
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
            <option value="">{placeholderText}</option>
            {product.variants.map((variant) => {
              const variantInventory = variantInventories.get(variant.key);
              // Check availability: use variant's own stock/status, or inventory data, or variant properties
              const stockCount = variantInventory?.stock ?? variant.stock ?? 0;
              const isOutOfStock = variantInventory 
                ? (variantInventory.outOfStock || (variantInventory.stock !== null && variantInventory.stock <= 0) || variantInventory.status === 'out_of_stock')
                : (variant.outOfStock || variant.stock <= 0 || variant.status === 'out_of_stock' || variant.inStock === false);
              
              // Build human-readable label: show ONLY size OR color (not both, not article number)
              // IMPORTANT: Never show SKU/article number - only size or color
              let displayLabel: string;
              if (variant.size) {
                displayLabel = variant.size;
              } else if (variant.color) {
                displayLabel = variant.color;
              } else {
                // If neither size nor color is available, this is a data issue
                // Log warning and show a placeholder - never show SKU/article number
                console.warn(`Variant ${variant.key} missing both size and color`, {
                  variantKey: variant.key,
                  variantSku: variant.sku,
                  stripePriceId: variant.stripePriceId
                });
                displayLabel = 'Variant'; // Don't show SKU/article number
              }
              
              // Stock display logic:
              // - Only show stock if low stock (< 10) with "snart slutsåld"
              // - If sold out, show "Slutsåld" and disable
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

