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
 * Searches through product variants to find matching price
 */
export async function getVariantByPriceId(
  stripePriceId: string,
  productId?: string
): Promise<(StorefrontVariant & { productId: string; productName: string }) | null> {
  try {
    // If we know the product ID, fetch it directly
    if (productId) {
      const product = await getProductFromStorefront(productId, { revalidate: 0 }); // Fresh data for checkout

      if (product && product.variants) {
        const variant = product.variants.find(v => v.stripePriceId === stripePriceId);

        if (variant) {
          console.log(`✅ Found variant: ${variant.size || 'N/A'} ${variant.color || 'N/A'} (stock: ${variant.stock})`);
          return {
            ...variant,
            productId: product.baseSku || product.id,
            productName: product.title
          };
        }
      }
    }

    // If product ID unknown, fetch all products (slower but works)
    console.log(`🔍 Product ID unknown, searching all products for price ${stripePriceId}...`);
    const allProducts = await getAllProductsFromStorefront({ revalidate: 0 });

    for (const product of allProducts) {
      if (product.variants) {
        const variant = product.variants.find(v => v.stripePriceId === stripePriceId);
        if (variant) {
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

