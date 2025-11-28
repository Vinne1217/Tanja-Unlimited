/**
 * Storefront API Helper Functions
 * Transforms Tanja products to Storefront API format
 */

import { Product, getProductById, products } from './products';
import { getInventoryStatus, getInventoryByStripePriceId } from './inventory';
import { getInventoryFromSource } from './inventory-source';
import { reverseMapProductId } from './inventory-mapping';

export type StorefrontProduct = {
  id: string;
  baseSku: string;
  name: string;
  title: string;
  description?: string;
  images: string[];
  category?: string;
  isActive: boolean;
  variants: StorefrontVariant[];
  priceRange: {
    min: number;
    max: number;
  };
  inStock: boolean;
};

export type StorefrontVariant = {
  id: string;
  articleNumber: string;
  color: string;
  size: string;
  priceSEK: number;
  stripePriceId: string;
  stock: number;
  inStock: boolean;
};

/**
 * Get inventory status for a product (hybrid approach)
 */
async function getProductInventoryStatus(productId: string): Promise<{
  stock: number | null;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  outOfStock: boolean;
  lowStock: boolean;
}> {
  // Try Source API first
  const sourceInventory = await getInventoryFromSource(productId);
  if (sourceInventory) {
    return {
      stock: sourceInventory.stock,
      status: sourceInventory.status,
      outOfStock: sourceInventory.outOfStock,
      lowStock: sourceInventory.lowStock
    };
  }

  // Fallback to in-memory
  const memoryStatus = getInventoryStatus(productId);
  if (memoryStatus) {
    return {
      stock: memoryStatus.stock,
      status: memoryStatus.status,
      outOfStock: memoryStatus.outOfStock,
      lowStock: memoryStatus.lowStock
    };
  }

  // Default: assume in stock
  return {
    stock: null,
    status: 'in_stock',
    outOfStock: false,
    lowStock: false
  };
}

/**
 * Get inventory status for a variant by stripePriceId
 */
function getVariantInventoryStatus(stripePriceId: string): {
  stock: number | null;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  outOfStock: boolean;
  lowStock: boolean;
} {
  const variantInventory = getInventoryByStripePriceId(stripePriceId);
  
  if (variantInventory) {
    return {
      stock: variantInventory.stock,
      status: variantInventory.status,
      outOfStock: variantInventory.outOfStock,
      lowStock: variantInventory.lowStock
    };
  }

  // Default: assume in stock
  return {
    stock: null,
    status: 'in_stock',
    outOfStock: false,
    lowStock: false
  };
}

/**
 * Transform Tanja Product to Storefront API format
 */
export async function transformProductToStorefront(product: Product): Promise<StorefrontProduct> {
  const inventory = await getProductInventoryStatus(product.id);
  
  // Transform variants
  const variants: StorefrontVariant[] = [];
  let minPrice = product.price * 100; // Convert to öre
  let maxPrice = product.price * 100;
  let hasInStockVariant = false;

  if (product.variants && product.variants.length > 0) {
    // Extract color from product name (e.g., "Gold", "Silver", "Platinum" from "Long Jacket Cotton fitted imperial line Gold")
    const colorMatch = product.name.match(/\b(Gold|Silver|Platinum|White|Black|Blue|Red|Green|Yellow|Pink|Purple|Brown|Gray|Grey|Orange|Beige|Navy|Maroon|Teal|Coral|Lavender|Mint|Cream|Ivory|Tan|Khaki|Olive|Burgundy|Magenta|Cyan|Lime|Indigo|Violet|Turquoise|Amber|Rose|Peach|Salmon|Crimson|Azure|Sapphire|Emerald|Ruby|Topaz|Pearl|Copper|Bronze|Steel|Charcoal|Slate|Jet|Ebony|Snow|Alabaster)\b/i);
    const color = colorMatch ? colorMatch[1] : 'Standard';

    for (const variant of product.variants) {
      const variantInventory = getVariantInventoryStatus(variant.stripePriceId);
      
      // Use product price as base (variants typically have same price)
      // In production, you could fetch actual prices from Stripe API
      const variantPrice = product.price * 100; // Convert to öre
      
      if (variantPrice < minPrice) minPrice = variantPrice;
      if (variantPrice > maxPrice) maxPrice = variantPrice;

      const stock = variantInventory.stock ?? variant.stock ?? 0;
      const inStock = !variantInventory.outOfStock && stock > 0;

      const storefrontVariant: StorefrontVariant = {
        id: variant.sku,
        articleNumber: variant.sku,
        color: color,
        size: variant.key,
        priceSEK: variantPrice,
        stripePriceId: variant.stripePriceId,
        stock: stock,
        inStock: inStock
      };

      variants.push(storefrontVariant);
      if (inStock) {
        hasInStockVariant = true;
      }
    }
  } else {
    // No variants - use product price
    minPrice = product.price * 100;
    maxPrice = product.price * 100;
  }

  // Determine overall inStock status
  const inStock = variants.length > 0 
    ? hasInStockVariant 
    : !inventory.outOfStock && (inventory.stock ?? 0) > 0;

  return {
    id: product.id,
    baseSku: product.id, // Use product ID as base SKU
    name: product.name,
    title: product.name,
    description: product.description,
    images: product.image ? [product.image] : [],
    category: product.category,
    isActive: product.inStock !== false, // Default to active if not explicitly false
    variants,
    priceRange: {
      min: minPrice,
      max: maxPrice
    },
    inStock
  };
}

/**
 * Get all active products in Storefront format
 */
export async function getAllStorefrontProducts(): Promise<StorefrontProduct[]> {
  const activeProducts = products.filter(p => p.inStock !== false);
  const transformed = await Promise.all(
    activeProducts.map(p => transformProductToStorefront(p))
  );
  return transformed;
}

/**
 * Get single product by ID/SKU in Storefront format
 */
export async function getStorefrontProductById(id: string): Promise<StorefrontProduct | null> {
  // Try direct ID match first
  let product = getProductById(id);
  
  // If not found, try to find by base SKU or variant article number
  if (!product) {
    // Search in variants
    for (const p of products) {
      if (p.variants) {
        const variant = p.variants.find(v => v.sku === id || v.stripePriceId === id);
        if (variant) {
          product = p;
          break;
        }
      }
    }
  }

  if (!product) {
    return null;
  }

  return transformProductToStorefront(product);
}

/**
 * Get unique categories from products
 */
export function getStorefrontCategories(): string[] {
  const categories = new Set<string>();
  products.forEach(p => {
    if (p.category) {
      categories.add(p.category);
    }
  });
  return Array.from(categories);
}

