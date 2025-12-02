/**
 * Inventory System - Storefront API Approach
 * 
 * Uses Source Portal's Storefront API directly for inventory data.
 * This is simpler and more reliable than webhook-based systems.
 * 
 * Benefits:
 * - Always up-to-date inventory
 * - No webhook sync issues
 * - Single source of truth
 * - Next.js caching for performance
 */

import { sourceFetch, SOURCE_BASE, TENANT } from './source';

const TENANT_ID = TENANT;

export type StorefrontProduct = {
  id: string;
  baseSku: string;
  title: string;
  description?: string;
  images?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  inStock: boolean;
  variants: StorefrontVariant[];
  stripeProductId?: string;
};

export type StorefrontVariant = {
  articleNumber: string;
  sku: string;
  size?: string;
  color?: string;
  stock: number;
  stripePriceId: string;
  priceSEK: number;
  inStock: boolean;
  outOfStock: boolean;
  lowStock?: boolean;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
};

/**
 * Fetch product with inventory from Source Portal Storefront API
 * Uses Next.js caching for performance
 */
export async function getProductFromStorefront(
  productId: string,
  options?: { revalidate?: number; tags?: string[] }
): Promise<StorefrontProduct | null> {
  try {
    const response = await sourceFetch(
      `/storefront/${TENANT_ID}/product/${productId}`,
      {
        headers: { 'X-Tenant': TENANT_ID },
        next: {
          revalidate: options?.revalidate ?? 60, // Cache for 60 seconds by default
          tags: options?.tags || [`product:${productId}`] // For manual revalidation
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`ℹ️ Product ${productId} not found in Storefront API`);
        return null;
      }
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.product) {
      console.log(`✅ Fetched ${productId} from Storefront API:`, {
        title: data.product.title,
        variants: data.product.variants?.length || 0,
        inStock: data.product.inStock
      });

      return data.product;
    }

    return null;
  } catch (error) {
    console.error(`❌ Error fetching product ${productId} from Storefront API:`, error);
    return null;
  }
}

/**
 * Get variant by Stripe Price ID
 * Uses the dedicated variant endpoint for faster lookups
 * Falls back to product search if endpoint is unavailable
 */
export async function getVariantByPriceId(
  stripePriceId: string,
  productId?: string
): Promise<(StorefrontVariant & { productId: string; productName: string }) | null> {
  try {
    // ✅ USE DEDICATED VARIANT ENDPOINT (faster than searching all products)
    // This is the recommended approach per Storefront API documentation
    const response = await sourceFetch(
      `/storefront/${TENANT_ID}/variant/${stripePriceId}`,
      {
        headers: { 'X-Tenant': TENANT_ID },
        next: { revalidate: 0 } // Fresh data for checkout (no cache)
      }
    );

    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.variant && data.product) {
        console.log(`✅ Found variant via dedicated endpoint: ${data.variant.size || 'N/A'} ${data.variant.color || 'N/A'} (stock: ${data.variant.stock})`);
        return {
          ...data.variant,
          productId: data.product.baseSku || data.product.id,
          productName: data.product.title
        };
      }
    }

    // Fallback: If dedicated endpoint doesn't work (404 or other error), use product search
    if (response.status === 404) {
      console.log(`ℹ️ Variant endpoint returned 404, falling back to product search for ${stripePriceId}`);
    } else {
      console.warn(`⚠️ Variant endpoint returned ${response.status}, falling back to product search`);
    }
    
    // Fallback method 1: If we know the product ID, fetch it directly
    if (productId) {
      const product = await getProductFromStorefront(productId, { revalidate: 0 });
      if (product && product.variants) {
        const variant = product.variants.find(v => v.stripePriceId === stripePriceId);
        if (variant) {
          console.log(`✅ Found variant via product lookup: ${variant.size || 'N/A'} ${variant.color || 'N/A'} (stock: ${variant.stock})`);
          return {
            ...variant,
            productId: product.baseSku || product.id,
            productName: product.title
          };
        }
      }
    }

    // Fallback method 2: Last resort - search all products (slower but works)
    console.log(`🔍 Searching all products for price ${stripePriceId}...`);
    const allProducts = await getAllProductsFromStorefront({ revalidate: 0 });
    for (const product of allProducts) {
      if (product.variants) {
        const variant = product.variants.find(v => v.stripePriceId === stripePriceId);
        if (variant) {
          console.log(`✅ Found variant via product search: ${variant.size || 'N/A'} ${variant.color || 'N/A'} (stock: ${variant.stock})`);
          return {
            ...variant,
            productId: product.baseSku || product.id,
            productName: product.title
          };
        }
      }
    }

    console.error(`❌ No variant found for price ${stripePriceId}`);
    return null;
  } catch (error) {
    console.error('❌ Error getting variant:', error);
    // Try fallback even on error
    if (productId) {
      try {
        const product = await getProductFromStorefront(productId, { revalidate: 0 });
        if (product && product.variants) {
          const variant = product.variants.find(v => v.stripePriceId === stripePriceId);
          if (variant) {
            return {
              ...variant,
              productId: product.baseSku || product.id,
              productName: product.title
            };
          }
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
    }
    return null;
  }
}

/**
 * Get all products (with caching)
 */
export async function getAllProductsFromStorefront(
  options?: { revalidate?: number }
): Promise<StorefrontProduct[]> {
  try {
    const response = await sourceFetch(
      `/storefront/${TENANT_ID}/products`,
      {
        headers: { 'X-Tenant': TENANT_ID },
        next: { revalidate: options?.revalidate ?? 300 } // Cache for 5 minutes by default
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.products) {
      console.log(`✅ Fetched ${data.products.length} products from Storefront API`);
      return data.products;
    }

    return [];
  } catch (error) {
    console.error('❌ Error fetching products from Storefront API:', error);
    return [];
  }
}

