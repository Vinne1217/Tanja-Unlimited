import { sourceFetch, SOURCE_BASE } from './source';

export type Category = { id: string; slug: string; name: string };
export type Variant = { key: string; sku: string; stock: number; stripePriceId: string };
export type Product = {
  id: string;
  name: string;
  description?: string;
  images?: string[];
  price?: number; // cents for default price if no variants
  currency?: string;
  variants?: Variant[];
  categoryId?: string;
};

const TENANT_ID = process.env.SOURCE_TENANT_ID ?? 'tanjaunlimited';

export async function getCategories(locale = 'sv'): Promise<Category[]> {
  // Try storefront endpoint first, fallback to catalog
  let res = await sourceFetch(`/storefront/${TENANT_ID}/categories?locale=${locale}`, {
    headers: { 'X-Tenant': TENANT_ID }
  });
  
  if (!res.ok) {
    // Fallback to catalog endpoint
    res = await sourceFetch(`/v1/tenants/${TENANT_ID}/catalog/categories?locale=${locale}`, {
      headers: { 'X-Tenant': TENANT_ID }
    });
  }
  
  if (!res.ok) return [];
  return res.json();
}

export async function getProducts(params: { locale?: string; category?: string; q?: string; limit?: number; cursor?: string } = {}): Promise<{ items: Product[]; nextCursor?: string }>{
  const qs = new URLSearchParams();
  if (params.locale) qs.set('locale', params.locale);
  if (params.category) qs.set('category', params.category);
  if (params.q) qs.set('q', params.q);
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.cursor) qs.set('cursor', params.cursor);
  
  // Try storefront endpoint first, fallback to catalog
  let res = await sourceFetch(`/storefront/${TENANT_ID}/products?${qs.toString()}`, {
    headers: { 'X-Tenant': TENANT_ID }
  });
  
  if (!res.ok) {
    // Fallback to catalog endpoint
    console.log(`⚠️ Storefront endpoint failed, trying catalog endpoint for products`);
    res = await sourceFetch(`/v1/tenants/${TENANT_ID}/catalog/products?${qs.toString()}`, {
      headers: { 'X-Tenant': TENANT_ID }
    });
  }
  
  if (!res.ok) {
    console.error(`❌ Failed to fetch products: ${res.status} ${res.statusText}`);
    return { items: [] };
  }
  
  const data = await res.json();
  
  // Handle different response formats
  if (data.success && data.products) {
    // Storefront format: { success: true, products: [...] }
    // Map storefront products to our Product format
    const mappedProducts: Product[] = data.products.map((p: any) => ({
      id: p.baseSku || p.id,
      name: p.title || p.name,
      description: p.description,
      images: p.images || [],
      price: p.priceRange?.min || (p.variants?.[0]?.priceSEK),
      currency: 'SEK',
      variants: p.variants?.map((v: any) => ({
        key: v.articleNumber || v.id,
        sku: v.articleNumber || v.id,
        stock: v.stock || 0,
        stripePriceId: v.stripePriceId
      })),
      categoryId: p.category
    }));
    return { items: mappedProducts };
  } else if (data.items) {
    // Catalog format: { items: [...], nextCursor?: string }
    return data;
  } else if (Array.isArray(data)) {
    // Direct array format
    return { items: data };
  }
  
  return { items: [] };
}

export async function getProduct(productId: string, locale = 'sv'): Promise<Product | null> {
  // Try storefront endpoint first, fallback to catalog
  let res = await sourceFetch(`/storefront/${TENANT_ID}/product/${productId}?locale=${locale}`, {
    headers: { 'X-Tenant': TENANT_ID }
  });
  
  if (!res.ok) {
    // Fallback to catalog endpoint
    console.log(`⚠️ Storefront endpoint failed, trying catalog endpoint for product ${productId}`);
    res = await sourceFetch(`/v1/tenants/${TENANT_ID}/catalog/products/${productId}?locale=${locale}`, {
      headers: { 'X-Tenant': TENANT_ID }
    });
  }
  
  if (!res.ok) {
    console.error(`❌ Failed to fetch product ${productId}: ${res.status} ${res.statusText}`);
    return null;
  }
  
  const data = await res.json();
  
  // Handle different response formats
  if (data.success && data.product) {
    // Storefront format: { success: true, product: {...} }
    const p = data.product;
    return {
      id: p.baseSku || p.id,
      name: p.title || p.name,
      description: p.description,
      images: p.images || [],
      price: p.priceRange?.min || (p.variants?.[0]?.priceSEK),
      currency: 'SEK',
      variants: p.variants?.map((v: any) => ({
        key: v.articleNumber || v.id,
        sku: v.articleNumber || v.id,
        stock: v.stock || 0,
        stripePriceId: v.stripePriceId
      })),
      categoryId: p.category
    };
  } else if (data.id) {
    // Direct product object (catalog format)
    return data;
  }
  
  return null;
}


