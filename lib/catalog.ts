import { sourceFetch, SOURCE_BASE } from './source';

export type Category = { 
  id: string; 
  slug: string; 
  name: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  parentId?: string; // For subcategories
  subcategories?: Category[];
  productCount?: number;
};

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
export type SubscriptionInfo = {
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  images?: string[];
  price?: number; // cents for default price if no variants
  currency?: string;
  stripeProductId?: string; // Stripe Product ID (prod_...)
  variants?: Variant[];
  categoryId?: string;
  type?: 'one_time' | 'subscription'; // Product type from API
  subscription?: SubscriptionInfo; // Subscription details if type === 'subscription'
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
  
  if (!res.ok) {
    console.warn(`⚠️ Failed to fetch categories: ${res.status} ${res.statusText}`);
    return [];
  }
  
  try {
    const data = await res.json();
    
    // Log the actual response structure for debugging
    console.log(`📦 Raw categories response type:`, typeof data);
    if (Array.isArray(data) && data.length > 0) {
      console.log(`📦 First category raw structure:`, JSON.stringify(data[0], null, 2));
    } else if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
      console.log(`📦 First category raw structure:`, JSON.stringify(data.categories[0], null, 2));
    }
    
    let categoriesArray: any[] = [];
    
    // Handle different response formats
    if (Array.isArray(data)) {
      categoriesArray = data;
    } else if (data.categories && Array.isArray(data.categories)) {
      categoriesArray = data.categories;
    } else if (data.success && Array.isArray(data.categories)) {
      categoriesArray = data.categories;
    } else {
      console.warn(`⚠️ Unexpected categories response format:`, typeof data, Object.keys(data || {}));
      return [];
    }
    
    // Map categories to expected format (handle different field names from customer portal)
    const mappedCategories: Category[] = categoriesArray.map((cat: any) => {
      // Helper function to generate slug from name if not provided
      const generateSlug = (name: string, id?: string) => {
        if (!name) return id?.toLowerCase().replace(/\s+/g, '-') || '';
        return name.toLowerCase()
          .replace(/å/g, 'a')
          .replace(/ä/g, 'a')
          .replace(/ö/g, 'o')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      };
      
      // Try different possible field names for id
      const categoryId = cat.id || cat._id || cat.categoryId || cat.category_id || cat.id;
      const categoryName = cat.name || cat.title || cat.categoryName || cat.category_name || '';
      const categorySlug = cat.slug || cat.slugName || generateSlug(categoryName, categoryId);
      
      // Map subcategories if they exist
      const mappedSubcategories = cat.subcategories && Array.isArray(cat.subcategories) 
        ? cat.subcategories.map((sub: any) => {
            const subId = sub.id || sub._id || sub.categoryId || String(sub.id || sub._id || '');
            const subName = sub.name || sub.title || sub.categoryName || '';
            const subSlug = sub.slug || sub.slugName || generateSlug(subName, subId);
            
            return {
              id: subId,
              slug: subSlug,
              name: subName,
              description: sub.description || sub.desc || '',
              icon: sub.icon || 'sparkles',
              imageUrl: sub.imageUrl || sub.image_url || sub.image || undefined,
              productCount: sub.productCount || sub.product_count || sub.count || undefined
            };
          })
        : undefined;
      
      return {
        id: categoryId || String(cat.id || cat._id || ''),
        slug: categorySlug,
        name: categoryName,
        description: cat.description || cat.desc || '',
        icon: cat.icon || cat.iconName || 'sparkles',
        imageUrl: cat.imageUrl || cat.image_url || cat.image || undefined,
        parentId: cat.parentId || cat.parent_id || cat.parentCategoryId || undefined,
        subcategories: mappedSubcategories,
        productCount: cat.productCount || cat.product_count || cat.count || undefined
      };
    });
    
    // Filter out invalid categories (must have at least id, name, and slug)
    const validCategories = mappedCategories.filter(cat => {
      const isValid = !!(cat.id && cat.name && cat.slug);
      if (!isValid) {
        console.warn(`⚠️ Filtered out invalid category:`, cat);
      }
      return isValid;
    });
    
    console.log(`📦 Mapped ${validCategories.length} valid categories from ${categoriesArray.length} raw categories`);
    
    return validCategories;
  } catch (error) {
    console.error(`❌ Error parsing categories response:`, error);
    return [];
  }
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
    // Log first product structure to see category field
    if (data.products.length > 0) {
      const firstProduct = data.products[0];
      console.log(`📦 First product raw structure (category field):`, {
        baseSku: firstProduct.baseSku,
        name: firstProduct.name,
        title: firstProduct.title,
        category: firstProduct.category,
        categoryId: firstProduct.categoryId,
        category_id: firstProduct.category_id,
        categoryName: firstProduct.categoryName,
        allCategoryKeys: Object.keys(firstProduct).filter(k => k.toLowerCase().includes('categor'))
      });
    }
    
    // Map storefront products to our Product format
    const mappedProducts: Product[] = data.products.map((p: any) => {
      // priceRange.min and priceSEK are ALWAYS in cents from Storefront API
      // Convert to SEK by dividing by 100
      const priceInCents = p.priceRange?.min || (p.variants?.[0]?.priceSEK);
      const priceInSEK = priceInCents ? priceInCents / 100 : undefined;
      
      // Check if product is a subscription
      const isSubscription = p.type === 'subscription' || p.subscription;
      const subscriptionInfo: SubscriptionInfo | undefined = isSubscription && p.subscription
        ? {
            interval: p.subscription.interval || 'month',
            intervalCount: p.subscription.intervalCount || 1
          }
        : undefined;

      return {
        id: p.baseSku || p.id,
        name: p.title || p.name,
        description: p.description,
        images: p.images || [],
        price: priceInSEK, // Store price in SEK, not cents
        currency: 'SEK',
        stripeProductId: p.stripeProductId || p.stripe_product_id, // Use Stripe Product ID from Source API
        type: p.type || (isSubscription ? 'subscription' : 'one_time'),
        subscription: subscriptionInfo,
        variants: p.variants?.map((v: any) => {
          const articleNumber = v.articleNumber || v.sku || v.id || v.key;
          
          // ✅ Use size and color fields directly from API (Source Portal provides these)
          // Only fall back to parsing if not provided
          let size = v.size;
          let color = v.color;
          
          // Fallback to parsing only if size/color not provided directly
          if (!size && !color) {
            const parsed = parseVariantAttributes(articleNumber, v.size, v.color, v.key);
            size = parsed.size;
            color = parsed.color;
          }
          
          // Log if we still don't have size/color after parsing
          if (!size && !color && articleNumber) {
            console.log(`⚠️ Variant missing size/color:`, {
              articleNumber,
              providedSize: v.size,
              providedColor: v.color,
              providedKey: v.key,
              productId: p.baseSku || p.id
            });
          }
          
          // ✅ Include variant-specific price data from Storefront API
          // priceSEK is in cents (e.g., 29900 = 299 SEK), always convert to SEK
          const variantPriceSEK = v.priceSEK ?? v.price ?? null;
          const variantPrice = variantPriceSEK ? variantPriceSEK / 100 : null;
          
          return {
            key: articleNumber,
            sku: articleNumber,
            stock: v.stock ?? 0,
            stripePriceId: v.stripePriceId,
            size: size, // ✅ Use direct field, fallback to parsed
            color: color, // ✅ Use direct field, fallback to parsed
            status: v.status || (v.inStock === false ? 'out_of_stock' : v.lowStock ? 'low_stock' : 'in_stock'),
            // CRITICAL: Use API flags instead of raw stock values (gift cards have stock: 0 but inStock: true)
            // Prioritize explicit flags, then status, then infer from inStock
            outOfStock: v.outOfStock ?? (v.status === 'out_of_stock' ? true : (v.inStock === false ? true : false)),
            lowStock: v.lowStock ?? (v.status === 'low_stock' ? true : false),
            inStock: v.inStock ?? (v.status === 'in_stock' || v.status === 'low_stock' ? true : (v.outOfStock === false ? true : false)),
            priceSEK: variantPriceSEK, // Price in cents from API
            price: variantPrice, // Price in SEK (converted)
            priceFormatted: v.priceFormatted || (variantPrice ? `${variantPrice.toFixed(2)} kr` : undefined) // Formatted price string
          };
        }),
        // Try multiple possible field names for categoryId
        categoryId: p.categoryId || p.category || p.category_id || p.categoryName || undefined
      };
    });
    
    // Log sample mapped products to verify categoryId mapping
    if (mappedProducts.length > 0) {
      console.log(`📦 Sample mapped products categoryIds:`, mappedProducts.slice(0, 3).map(p => ({
        productId: p.id,
        productName: p.name,
        categoryId: p.categoryId
      })));
    }
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
    
    // priceRange.min and priceSEK are ALWAYS in cents from Storefront API
    // Convert to SEK by dividing by 100
    const priceInCents = p.priceRange?.min || (p.variants?.[0]?.priceSEK);
    const priceInSEK = priceInCents ? priceInCents / 100 : undefined;
    
    // Check if product is a subscription
    const isSubscription = p.type === 'subscription' || p.subscription;
    const subscriptionInfo: SubscriptionInfo | undefined = isSubscription && p.subscription
      ? {
          interval: p.subscription.interval || 'month',
          intervalCount: p.subscription.intervalCount || 1
        }
      : undefined;
    
    return {
      id: p.baseSku || p.id,
      name: p.title || p.name,
      description: p.description,
      images: p.images || [],
      price: priceInSEK, // Store price in SEK, not cents
      currency: 'SEK',
      stripeProductId: p.stripeProductId || p.stripe_product_id, // Use Stripe Product ID from Source API
      type: p.type || (isSubscription ? 'subscription' : 'one_time'),
      subscription: subscriptionInfo,
      variants: p.variants?.map((v: any) => {
        const articleNumber = v.articleNumber || v.sku || v.id || v.key;
        
        // ✅ Use size and color fields directly from API (Source Portal provides these)
        // Only fall back to parsing if not provided
        let size = v.size;
        let color = v.color;
        
        // Fallback to parsing only if size/color not provided directly
        if (!size && !color) {
          const parsed = parseVariantAttributes(articleNumber, v.size, v.color, v.key);
          size = parsed.size;
          color = parsed.color;
        }
        
        // Log if we still don't have size/color after parsing
        if (!size && !color && articleNumber) {
          console.log(`⚠️ Variant missing size/color:`, {
            articleNumber,
            providedSize: v.size,
            providedColor: v.color,
            providedKey: v.key,
            productId: p.baseSku || p.id
          });
        }
        
        // ✅ Include variant-specific price data from Storefront API
        // priceSEK is in cents (e.g., 29900 = 299 SEK), always convert to SEK
        const variantPriceSEK = v.priceSEK ?? v.price ?? null;
        const variantPrice = variantPriceSEK ? variantPriceSEK / 100 : null;
        
        return {
          key: articleNumber,
          sku: articleNumber,
          stock: v.stock ?? 0,
          stripePriceId: v.stripePriceId,
          size: size, // ✅ Use direct field, fallback to parsed
          color: color, // ✅ Use direct field, fallback to parsed
          status: v.status || (v.inStock === false ? 'out_of_stock' : v.lowStock ? 'low_stock' : 'in_stock'),
          // CRITICAL: Use API flags instead of raw stock values (gift cards have stock: 0 but inStock: true)
          // Prioritize explicit flags, then status, then infer from inStock
          outOfStock: v.outOfStock ?? (v.status === 'out_of_stock' ? true : (v.inStock === false ? true : false)),
          lowStock: v.lowStock ?? (v.status === 'low_stock' ? true : false),
          inStock: v.inStock ?? (v.status === 'in_stock' || v.status === 'low_stock' ? true : (v.outOfStock === false ? true : false)),
          priceSEK: variantPriceSEK, // Price in cents from API
          price: variantPrice, // Price in SEK (converted)
          priceFormatted: v.priceFormatted || (variantPrice ? `${variantPrice.toFixed(2)} kr` : undefined) // Formatted price string
        };
      }),
      categoryId: p.category || p.categoryId || p.category_id || undefined
    };
  } else if (data.id) {
    // Direct product object (catalog format)
    return data;
  }
  
  return null;
}


