/**
 * Storefront API Client
 * Fetches products from the Storefront API endpoint
 * Uses dynamic tenant ID from environment
 */

import type { Product } from './products';

/**
 * Get tenant ID - consistent across backend and frontend
 * Uses same logic as lib/source.ts
 * Defaults to 'tanjaunlimited' if not set
 */
function getTenantId(): string {
  // On client, only NEXT_PUBLIC_* vars are available
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_TENANT_ID || 'tanjaunlimited';
  }
  // On server, use SOURCE_TENANT_ID
  return process.env.SOURCE_TENANT_ID || 'tanjaunlimited';
}

// Get base URL for API calls (works both server and client side)
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: use relative URL
    return '';
  }
  // Server-side: use full URL if available, otherwise use localhost for development
  // In production, NEXT_PUBLIC_BASE_URL should be set
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  // Fallback: use relative URL (works for same-origin requests)
  return '';
}

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

export type StorefrontProductsResponse = {
  success: boolean;
  tenant: string;
  products: StorefrontProduct[];
  categories: string[];
  meta: {
    totalProducts: number;
    totalVariants: number;
  };
};

export type StorefrontProductResponse = {
  success: boolean;
  tenant: string;
  product: StorefrontProduct;
};

/**
 * Fetch all products from Storefront API
 */
export async function fetchStorefrontProducts(): Promise<StorefrontProduct[]> {
  const tenantId = getTenantId();
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/storefront/${tenantId}/products`;

  try {
    const response = await fetch(url, {
      cache: 'no-store', // Always fetch fresh data
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });

    if (!response.ok) {
      console.error(`Failed to fetch storefront products: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: StorefrontProductsResponse = await response.json();
    
    if (!data.success || !data.products) {
      console.error('Invalid storefront products response:', data);
      return [];
    }

    return data.products;
  } catch (error) {
    console.error('Error fetching storefront products:', error);
    return [];
  }
}

/**
 * Fetch single product from Storefront API
 */
export async function fetchStorefrontProduct(productId: string): Promise<StorefrontProduct | null> {
  const tenantId = getTenantId();
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/storefront/${tenantId}/product/${encodeURIComponent(productId)}`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      next: { revalidate: 30 } // Revalidate every 30 seconds
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error(`Failed to fetch storefront product: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: StorefrontProductResponse = await response.json();
    
    if (!data.success || !data.product) {
      console.error('Invalid storefront product response:', data);
      return null;
    }

    return data.product;
  } catch (error) {
    console.error('Error fetching storefront product:', error);
    return null;
  }
}

/**
 * Transform StorefrontProduct to Product format (for backward compatibility)
 */
export function transformStorefrontToProduct(storefrontProduct: StorefrontProduct): Product {
  // Use first image or empty string
  const image = storefrontProduct.images && storefrontProduct.images.length > 0 
    ? storefrontProduct.images[0] 
    : '';

  // Calculate price (use min price, convert from öre to SEK)
  const price = storefrontProduct.priceRange.min / 100;

  // Transform variants
  const variants = storefrontProduct.variants.map(v => ({
    key: v.size,
    sku: v.articleNumber,
    stock: v.stock,
    stripePriceId: v.stripePriceId
  }));

  // Get stripePriceId (use first variant's price or base product price)
  const stripePriceId = variants.length > 0 
    ? variants[0].stripePriceId 
    : undefined;

  return {
    id: storefrontProduct.id,
    name: storefrontProduct.name,
    price: price,
    currency: 'SEK',
    category: storefrontProduct.category || '',
    description: storefrontProduct.description,
    image: image,
    inStock: storefrontProduct.inStock,
    stripePriceId: stripePriceId,
    variants: variants.length > 0 ? variants : undefined
  };
}

/**
 * Get products by category from Storefront API
 */
export async function getStorefrontProductsByCategory(categorySlug: string): Promise<Product[]> {
  const allProducts = await fetchStorefrontProducts();
  
  // Get category info to match by ID or slug
  const { categories } = await import('@/lib/products');
  const category = categories.find(c => c.slug === categorySlug);
  
  // Filter by category (match by category ID, slug, or name)
  const categoryProducts = allProducts.filter(p => {
    if (!p.category) return false;
    
    const productCategory = p.category.toLowerCase();
    const slugLower = categorySlug.toLowerCase();
    
    // Match by category ID (e.g., 'tanja-jacket')
    if (category && productCategory === category.id.toLowerCase()) {
      return true;
    }
    
    // Match by slug
    if (productCategory === slugLower) {
      return true;
    }
    
    // Match by category name (normalized)
    if (category && productCategory === category.name.toLowerCase()) {
      return true;
    }
    
    // Match normalized category name (spaces to hyphens)
    if (productCategory.replace(/\s+/g, '-') === slugLower) {
      return true;
    }
    
    return false;
  });

  return categoryProducts.map(transformStorefrontToProduct);
}

/**
 * Get all storefront products as Product format
 */
export async function getAllStorefrontProductsAsProducts(): Promise<Product[]> {
  const storefrontProducts = await fetchStorefrontProducts();
  return storefrontProducts.map(transformStorefrontToProduct);
}

/**
 * Get single storefront product as Product format
 * productId can be baseSku, variant articleNumber, or product ID
 */
export async function getStorefrontProductAsProduct(productId: string): Promise<Product | null> {
  const storefrontProduct = await fetchStorefrontProduct(productId);
  
  if (!storefrontProduct) {
    return null;
  }

  return transformStorefrontToProduct(storefrontProduct);
}

