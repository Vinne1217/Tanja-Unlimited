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
  const [variantKey, setVariantKey] = useState(product.variants?.[0]?.key);
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

    // Check if selected variant is out of stock (prioritize variant-level stock)
    const selectedVariant = product.variants?.find(v => v.key === variantKey);
    if (selectedVariant) {
      const variantOutOfStock = selectedVariant.outOfStock || selectedVariant.stock <= 0 || selectedVariant.status === 'out_of_stock' || selectedVariant.inStock === false;
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

      {product.variants && product.variants.length > 0 && (
        <div>
          <label className="block text-sm mb-1">Variant</label>
          <select className="border p-2" value={variantKey || ''} onChange={(e) => setVariantKey(e.target.value)}>
            <option value="">Välj variant</option>
            {product.variants.map(v => {
              // Build human-readable label: show ONLY size OR color (not both, not article number)
              // Prefer size if available, otherwise color, otherwise fallback to key
              let displayLabel = v.size || v.color || v.key || v.sku || 'Variant';
              
              // Check availability using variant's own stock/status
              const stockCount = v.stock ?? 0;
              const isOutOfStock = v.outOfStock || stockCount <= 0 || v.status === 'out_of_stock' || v.inStock === false;
              
              // Stock display logic:
              // - Only show stock if low stock (< 10) with "snart slutsåld"
              // - If sold out, show "Slutsåld" and disable
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
      )}
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


