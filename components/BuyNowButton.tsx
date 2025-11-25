'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Loader2, XCircle, Check } from 'lucide-react';
import type { Product } from '@/lib/products';
import { useCart, type CartProduct } from '@/lib/cart-context';

type BuyNowButtonProps = {
  product: Product;
};

type InventoryData = {
  stock: number | null;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lowStock: boolean;
  outOfStock: boolean;
  hasData: boolean;
};

export default function BuyNowButton({ product }: BuyNowButtonProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    product.variants?.[0]?.key || null
  );
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [checkingStock, setCheckingStock] = useState(true);
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
      } finally {
        setCheckingStock(false);
      }
    }

    fetchStockStatus();
  }, [product.id]);

  const selectedVariantData = product.variants?.find(v => v.key === selectedVariant);
  const priceId = selectedVariantData?.stripePriceId || product.stripePriceId;
  const variantOutOfStock = selectedVariantData && selectedVariantData.stock <= 0;

  function handleAddToCart() {
    if (!priceId) {
      alert('This product is not available for online purchase. Please contact us.');
      return;
    }

    if (product.variants && !selectedVariant) {
      alert('Vänligen välj en storlek.');
      return;
    }

    // Check if out of stock
    if (inventory?.outOfStock || variantOutOfStock) {
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
  const isDisabled = checkingStock || isOutOfStock || variantOutOfStock || (product.variants && !selectedVariant);

  return (
    <div className="space-y-4">
      {/* Size Selector */}
      {product.variants && product.variants.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-deepIndigo mb-2">
            Storlek
          </label>
          <select
            value={selectedVariant || ''}
            onChange={(e) => setSelectedVariant(e.target.value)}
            className="w-full px-4 py-3 border border-warmOchre/20 bg-ivory text-deepIndigo focus:border-warmOchre focus:outline-none transition-colors"
          >
            <option value="">Välj storlek</option>
            {product.variants.map((variant) => (
              <option key={variant.key} value={variant.key} disabled={variant.stock <= 0}>
                {variant.key} {variant.stock <= 0 ? '— Slutsåld' : ''}
              </option>
            ))}
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

