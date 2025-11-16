'use client';
import { useState, useEffect } from 'react';
import type { Product } from '@/lib/catalog';
import StockStatus from '@/components/StockStatus';

type InventoryData = {
  stock: number | null;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lowStock: boolean;
  outOfStock: boolean;
  hasData: boolean;
};

export default function ProductPurchase({ product }: { product: Product }) {
  const [variantKey, setVariantKey] = useState(product.variants?.[0]?.key);
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryData | null>(null);

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

  async function buyNow() {
    const priceId = selectedPriceId ?? fallbackPriceId;
    if (!priceId) {
      alert('Product is not purchasable yet.');
      return;
    }

    // Check if out of stock
    if (inventory?.outOfStock) {
      alert('Detta produkt är tyvärr slutsåld. Vänligen kontakta oss för mer information.');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ stripePriceId: priceId, quantity: 1, productId: product.id }],
        successUrl: `${location.origin}/?status=success`,
        cancelUrl: `${location.href}`
      })
    });
    setLoading(false);
    if (!res.ok) return alert('Could not start checkout');
    const data = await res.json();
    location.href = data.url;
  }

  const isOutOfStock = inventory?.outOfStock ?? false;
  const isDisabled = loading || isOutOfStock;

  return (
    <div className="space-y-3">
      {/* Stock Status */}
      <StockStatus productId={product.id} />

      {product.variants && product.variants.length > 0 && (
        <div>
          <label className="block text-sm mb-1">Variant</label>
          <select className="border p-2" value={variantKey} onChange={(e) => setVariantKey(e.target.value)}>
            {product.variants.map(v => (
              <option key={v.key} value={v.key} disabled={v.stock <= 0}>{v.key}{v.stock <= 0 ? ' — Out of stock' : ''}</option>
            ))}
          </select>
        </div>
      )}
      <button 
        className="bg-ochreRed text-white px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed" 
        onClick={buyNow} 
        disabled={isDisabled}
      >
        {loading ? 'Redirecting…' : isOutOfStock ? 'Slutsåld' : 'Buy now'}
      </button>
    </div>
  );
}


