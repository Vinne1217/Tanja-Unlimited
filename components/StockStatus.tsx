'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

type StockStatusProps = {
  productId: string;
  className?: string;
};

type InventoryData = {
  stock: number | null;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lowStock: boolean;
  outOfStock: boolean;
  hasData: boolean;
};

export default function StockStatus({ productId, className = '' }: StockStatusProps) {
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStockStatus() {
      try {
        const res = await fetch(`/api/inventory/status?productId=${encodeURIComponent(productId)}`, {
          cache: 'no-store'
        });
        
        if (res.ok) {
          const data = await res.json();
          setInventory(data);
        }
      } catch (error) {
        console.warn('Failed to fetch stock status:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStockStatus();
  }, [productId]);

  if (loading || !inventory) {
    // Default: show in stock if no data
    return (
      <div className={`flex items-center gap-2 text-sage ${className}`}>
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm font-medium">In Stock</span>
      </div>
    );
  }

  if (inventory.outOfStock) {
    return (
      <div className={`flex items-center gap-2 text-terracotta ${className}`}>
        <XCircle className="w-5 h-5" />
        <span className="text-sm font-medium">Slutsåld</span>
      </div>
    );
  }

  // Low stock: stock < 5 or lowStock flag
  const isLowStock = inventory.lowStock || (inventory.stock !== null && inventory.stock < 5);
  
  if (isLowStock) {
    return (
      <div className={`flex items-center gap-2 text-ochre ${className}`}>
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm font-medium">
          Snart slutsåld{inventory.stock !== null ? ` (${inventory.stock} st)` : ''}
        </span>
      </div>
    );
  }

  // Stock >= 5: Just show "I lager" without count
  return (
    <div className={`flex items-center gap-2 text-sage ${className}`}>
      <CheckCircle className="w-5 h-5" />
      <span className="text-sm font-medium">I lager</span>
    </div>
  );
}

