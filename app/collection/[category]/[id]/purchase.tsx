'use client';
import { useState, useEffect } from 'react';
import type { Product } from '@/lib/catalog';
import StockStatus from '@/components/StockStatus';
import { useCart, type CartProduct } from '@/lib/cart-context';

type InventoryData = {
  stock: number | null;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lowStock: boolean;
  outOfStock: boolean;
  hasData: boolean;
};

export default function ProductPurchase({ product }: { product: Product }) {
  // Filter variants to only those with sizes
  const sizeVariants = product.variants?.filter(v => v.size) || [];
  const hasMultipleSizes = sizeVariants.length > 1;
  
  // Auto-select the only variant if there's only one size, otherwise start with first variant or null
  const [variantKey, setVariantKey] = useState<string | undefined>(
    hasMultipleSizes ? undefined : (sizeVariants[0]?.key || product.variants?.[0]?.key)
  );
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    async function fetchStockStatus() {
      try {
        const res = await fetch(`/api/inventory/status?productId=${encodeURIComponent(product.id)}`, {
          cache: 'no-store'
        });
        
        if (res.ok) {
          const data = await res.json();
          setInventory(data);
        }
      } catch (error) {
        console.warn('Failed to fetch stock status:', error);
      }
    }

    fetchStockStatus();
  }, [product.id]);

  const selectedPriceId = product.variants?.find(v => v.key === variantKey)?.stripePriceId || undefined;
  const fallbackPriceId = (product as any).stripePriceId as string | undefined;

  function addToCart() {
    const priceId = selectedPriceId ?? fallbackPriceId;
    if (!priceId) {
      alert('Product is not purchasable yet.');
      return;
    }

    // Check if selected variant is out of stock
    // CRITICAL: Use API flags (outOfStock, inStock, status) instead of raw stock values
    const selectedVariant = product.variants?.find(v => v.key === variantKey);
    if (selectedVariant) {
      const variantOutOfStock = selectedVariant.outOfStock || selectedVariant.status === 'out_of_stock' || selectedVariant.inStock === false;
      if (variantOutOfStock) {
        alert('Denna variant är tyvärr slutsåld. Vänligen välj en annan variant eller kontakta oss för mer information.');
        return;
      }
    }
    
    // Also check product-level inventory (fallback)
    if (inventory?.outOfStock) {
      alert('Detta produkt är tyvärr slutsåld. Vänligen kontakta oss för mer information.');
      return;
    }

    // Convert catalog product to cart product format
    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      price: product.price ? product.price / 100 : 0, // Convert from cents to SEK
      currency: product.currency || 'SEK',
      category: product.categoryId,
      description: product.description,
      images: product.images,
      inStock: !inventory?.outOfStock,
      stripePriceId: fallbackPriceId,
      stripeProductId: product.stripeProductId, // Include Stripe Product ID for campaign price lookup
      variantKey: variantKey,
      variantPriceId: selectedPriceId,
    };

    addItem(cartProduct, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const isOutOfStock = inventory?.outOfStock ?? false;
  const isDisabled = isOutOfStock;

  return (
    <div className="space-y-3">
      {/* Stock Status */}
      <StockStatus productId={product.id} />

      {/* Size Selector - Only show if multiple sizes exist */}
      {(() => {
        const sizeVariants = product.variants?.filter(v => v.size) || [];
        const hasMultipleSizes = sizeVariants.length > 1;
        
        if (!hasMultipleSizes) {
          return null; // Don't show selector if only one or no size variants
        }
        
        return (
          <div>
            <label className="block text-sm mb-1">
              {sizeVariants.length > 1 ? 'Storlekar' : 'Storlek'}
            </label>
            <select className="border p-2" value={variantKey || ''} onChange={(e) => setVariantKey(e.target.value)}>
              <option value="">Välj storlek</option>
              {sizeVariants.map(v => {
                // Display label: show size (should always exist since we filtered for size variants)
                const displayLabel = v.size || v.key;
                
                // Check availability using API flags (outOfStock, inStock, status) instead of raw stock values
                const stockCount = v.stock ?? null;
                const isOutOfStock = v.outOfStock || v.status === 'out_of_stock' || v.inStock === false;
                
                // Stock display logic:
                // - Only show stock if low stock (< 10) with "snart slutsåld"
                // - If sold out, show "Slutsåld" and disable (but still visible)
                let stockText = '';
                if (isOutOfStock) {
                  stockText = ' — Slutsåld';
                } else if (stockCount > 0 && stockCount < 10) {
                  stockText = ' — Snart slutsåld';
                }
                
                return (
                  <option key={v.key} value={v.key} disabled={isOutOfStock}>
                    {displayLabel}{stockText}
                  </option>
                );
              })}
            </select>
          </div>
        );
      })()}
      <button 
        className="bg-ochreRed text-white px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed" 
        onClick={addToCart} 
        disabled={isDisabled}
      >
        {added ? 'Added to Cart!' : isOutOfStock ? 'Slutsåld' : 'Add to Cart'}
      </button>
    </div>
  );
}


