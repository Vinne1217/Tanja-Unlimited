'use client';
import { useState } from 'react';
import type { Product } from '@/lib/catalog';

export default function ProductPurchase({ product }: { product: Product }) {
  const [variantKey, setVariantKey] = useState(product.variants?.[0]?.key);
  const [loading, setLoading] = useState(false);

  const selectedPriceId = product.variants?.find(v => v.key === variantKey)?.stripePriceId || undefined;
  const fallbackPriceId = (product as any).stripePriceId as string | undefined;

  async function buyNow() {
    const priceId = selectedPriceId ?? fallbackPriceId;
    if (!priceId) {
      alert('Product is not purchasable yet.');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ stripePriceId: priceId, quantity: 1 }],
        successUrl: `${location.origin}/?status=success`,
        cancelUrl: `${location.href}`
      })
    });
    setLoading(false);
    if (!res.ok) return alert('Could not start checkout');
    const data = await res.json();
    location.href = data.url;
  }

  return (
    <div className="space-y-3">
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
      <button className="bg-ochreRed text-white px-4 py-2" onClick={buyNow} disabled={loading}>
        {loading ? 'Redirecting…' : 'Buy now'}
      </button>
    </div>
  );
}


