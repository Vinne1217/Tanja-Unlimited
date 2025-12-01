import { sourceFetch, SOURCE_BASE } from './source';

export type Category = { id: string; slug: string; name: string };

/**
 * Extract size and color from articleNumber if not provided directly
 * Example: "LJCfilG-L-Black" -> size: "L", color: "Black"
 * Example: "LJCfilG-XS" -> size: "XS", color: undefined
 * Example: "LJCfilG-S" -> size: "S", color: undefined
 */
function parseVariantAttributes(articleNumber: string, providedSize?: string, providedColor?: string, providedKey?: string): { size?: string; color?: string } {
  // Try to use key if it looks like a size (single letter or size code) - prioritize this
  if (providedKey && /^(XS|S|M|L|XL|XXL|XXXL)$/i.test(providedKey)) {
    return { size: providedKey.toUpperCase() };
  }
  
  // Parse from articleNumber: format is usually "BASESKU-SIZE" or "BASESKU-SIZE-COLOR"
  // This is the most reliable source when API doesn't provide size/color directly
  if (articleNumber && articleNumber.includes('-')) {
    const parts = articleNumber.split('-');
    if (parts.length >= 2) {
      // For "LJCfilG-XS" -> parts = ["LJCfilG", "XS"], size is last part
      // For "LJCfilG-L-Black" -> parts = ["LJCfilG", "L", "Black"], size is second to last, color is last
      const lastPart = parts[parts.length - 1];
      const secondToLastPart = parts.length >= 3 ? parts[parts.length - 2] : null;
      
      // Check if last part is a size code
      if (/^(XS|S|M|L|XL|XXL|XXXL)$/i.test(lastPart)) {
        const size = lastPart.toUpperCase();
        // If there's a second-to-last part and it's also a size, ignore it (shouldn't happen)
        // Otherwise, if there's a second-to-last part, it might be a color
        const color = secondToLastPart && !/^(XS|S|M|L|XL|XXL|XXXL)$/i.test(secondToLastPart) 
          ? secondToLastPart 
          : undefined;
        return { size, color };
      }
      
      // Check if second-to-last part is a size (for format "BASESKU-SIZE-COLOR")
      if (secondToLastPart && /^(XS|S|M|L|XL|XXL|XXXL)$/i.test(secondToLastPart)) {
        const size = secondToLastPart.toUpperCase();
        const color = lastPart; // Last part is color
        return { size, color };
      }
    }
  }
  
  // If size/color are provided and not "Standard", use them
  if (providedSize && providedSize !== 'Standard') return { size: providedSize, color: providedColor };
  if (providedColor && providedColor !== 'Standard') return { size: providedSize, color: providedColor };
  
  // Fallback: return undefined if nothing found
  return { size: undefined, color: undefined };
}

export type Variant = { 
  key: string; 
  sku: string; 
  stock: number; 
  stripePriceId: string;
  size?: string;
  color?: string;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  outOfStock?: boolean;
  lowStock?: boolean;
  inStock?: boolean;
};
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
      variants: p.variants?.map((v: any) => {
        const articleNumber = v.articleNumber || v.sku || v.id || v.key;
        const parsed = parseVariantAttributes(articleNumber, v.size, v.color, v.key);
        
        // Log for debugging if size/color couldn't be parsed
        if (!parsed.size && !parsed.color && articleNumber) {
          const parts = articleNumber.split('-');
          console.log(`⚠️ Could not parse size/color from variant:`, {
            articleNumber,
            providedSize: v.size,
            providedColor: v.color,
            providedKey: v.key,
            productId: p.baseSku || p.id,
            parts,
            lastPart: parts[parts.length - 1],
            matchesSizeRegex: parts.length > 0 ? /^(XS|S|M|L|XL|XXL|XXXL)$/i.test(parts[parts.length - 1]) : false
          });
        }
        
        return {
          key: articleNumber,
          sku: articleNumber,
          stock: v.stock ?? 0,
          stripePriceId: v.stripePriceId,
          size: parsed.size,
          color: parsed.color,
          status: v.status || (v.inStock === false ? 'out_of_stock' : v.lowStock ? 'low_stock' : 'in_stock'),
          outOfStock: v.outOfStock ?? (v.stock === 0 || v.stock <= 0 || v.inStock === false),
          lowStock: v.lowStock ?? false,
          inStock: v.inStock ?? (v.stock > 0)
        };
      }),
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
      variants: p.variants?.map((v: any) => {
        const articleNumber = v.articleNumber || v.sku || v.id || v.key;
        const parsed = parseVariantAttributes(articleNumber, v.size, v.color, v.key);
        
        // Log for debugging if size/color couldn't be parsed
        if (!parsed.size && !parsed.color && articleNumber) {
          const parts = articleNumber.split('-');
          console.log(`⚠️ Could not parse size/color from variant:`, {
            articleNumber,
            providedSize: v.size,
            providedColor: v.color,
            providedKey: v.key,
            productId: p.baseSku || p.id,
            parts,
            lastPart: parts[parts.length - 1],
            matchesSizeRegex: parts.length > 0 ? /^(XS|S|M|L|XL|XXL|XXXL)$/i.test(parts[parts.length - 1]) : false
          });
        }
        
        return {
          key: articleNumber,
          sku: articleNumber,
          stock: v.stock ?? 0,
          stripePriceId: v.stripePriceId,
          size: parsed.size,
          color: parsed.color,
          status: v.status || (v.inStock === false ? 'out_of_stock' : v.lowStock ? 'low_stock' : 'in_stock'),
          outOfStock: v.outOfStock ?? (v.stock === 0 || v.stock <= 0 || v.inStock === false),
          lowStock: v.lowStock ?? false,
          inStock: v.inStock ?? (v.stock > 0)
        };
      }),
      categoryId: p.category
    };
  } else if (data.id) {
    // Direct product object (catalog format)
    return data;
  }
  
  return null;
}


