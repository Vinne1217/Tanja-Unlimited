'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Product as WebshopProduct } from '@/lib/products';
import type { Product as CatalogProduct } from '@/lib/catalog';

// Unified cart item type that works with both product types
export type CartProduct = {
  id: string;
  name: string;
  price: number;
  currency: string;
  category?: string;
  description?: string;
  image?: string;
  images?: string[];
  inStock: boolean;
  stripePriceId?: string;
  // For catalog products with variants
  variantKey?: string;
  variantPriceId?: string;
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (productId: string, variantKey?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantKey?: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('tanja-cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('tanja-cart', JSON.stringify(items));
    }
  }, [items, mounted]);

  // Helper to create a unique key for cart items (productId + variantKey if exists)
  const getItemKey = (productId: string, variantKey?: string) => {
    return variantKey ? `${productId}:${variantKey}` : productId;
  };

  const addItem = (product: CartProduct, quantity: number = 1) => {
    setItems((prev) => {
      const itemKey = getItemKey(product.id, product.variantKey);
      const existing = prev.find((item) => {
        const existingKey = getItemKey(item.product.id, item.product.variantKey);
        return existingKey === itemKey;
      });
      
      if (existing) {
        return prev.map((item) => {
          const existingKey = getItemKey(item.product.id, item.product.variantKey);
          if (existingKey === itemKey) {
            return { ...item, quantity: item.quantity + quantity };
          }
          return item;
        });
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeItem = (productId: string, variantKey?: string) => {
    setItems((prev) => {
      const itemKey = getItemKey(productId, variantKey);
      return prev.filter((item) => {
        const existingKey = getItemKey(item.product.id, item.product.variantKey);
        return existingKey !== itemKey;
      });
    });
  };

  const updateQuantity = (productId: string, quantity: number, variantKey?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantKey);
      return;
    }
    setItems((prev) => {
      const itemKey = getItemKey(productId, variantKey);
      return prev.map((item) => {
        const existingKey = getItemKey(item.product.id, item.product.variantKey);
        if (existingKey === itemKey) {
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => {
      const price = item.product.price || 0;
      return sum + price * item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

