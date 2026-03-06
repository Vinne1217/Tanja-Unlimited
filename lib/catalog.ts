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
  price?: number; // Price in SEK
  campaignPrice?: number; // Campaign price in SEK (server-side injected)
  priceSEK?: number; // Price in cents from API
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

    // Build hierarchical structure:
    // - Huvudkategorier: kategorier utan parentId
    // - Underkategorier: kategorier med parentId som pekar på en huvudkategori
    const rootCategoriesMap = new Map<string, Category>();
    const childCategories: Category[] = [];

    for (const cat of validCategories) {
      if (cat.parentId) {
        childCategories.push(cat);
      } else {
        // Se till att subcategories alltid är en array (även om API:t inte skickar någon lista)
        rootCategoriesMap.set(cat.id, {
          ...cat,
          subcategories: cat.subcategories ?? []
        });
      }
    }

    // Koppla ihop underkategorier med respektive huvudkategori
    for (const child of childCategories) {
      const parent = child.parentId ? rootCategoriesMap.get(child.parentId) : undefined;

      if (parent) {
        const existingSubs = parent.subcategories ?? [];

        // Undvik dubletter om API:t redan skickar child i parent.subcategories
        const alreadyExists = existingSubs.some(sub => sub.id === child.id);
        if (!alreadyExists) {
          existingSubs.push({
            ...child,
            // När den väl ligger under parent behövs inte parentId i UI:t
            parentId: child.parentId
          });
        }

        rootCategoriesMap.set(parent.id, {
          ...parent,
          subcategories: existingSubs
        });
      } else {
        // Om vi inte hittar en parent (konstig eller inkomplett data) behandlar vi den som root
        if (!rootCategoriesMap.has(child.id)) {
          rootCategoriesMap.set(child.id, {
            ...child,
            subcategories: child.subcategories ?? []
          });
        }
      }
    }

    const hierarchicalCategories = Array.from(rootCategoriesMap.values());

    console.log(`📦 Mapped ${hierarchicalCategories.length} root categories (from ${validCategories.length} valid categories, ${categoriesArray.length} raw categories)`);
    
    return hierarchicalCategories;
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
  // Ensure Storefront includes variants and Stripe metadata (needed for campaigns)
  // If backend already supports an "include" parameter, this will request:
  //   - variants: full variant list
  //   - stripe: stripeProductId / stripePriceId fields
  // This is safe even if backend ignores unknown include values.
  if (!qs.has('include')) {
    qs.set('include', 'variants,stripe');
  }
  
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
    // Log first product structure to see Stripe IDs and category field
    if (data.products.length > 0) {
      const firstProduct = data.products[0];
      
      // 🔍 Full raw JSON for the first product – to verify exactly what Storefront returns
      try {
        console.log('📦 RAW STOREFRONT PRODUCT (first item):', JSON.stringify(firstProduct, null, 2));
      } catch {
        console.log('📦 RAW STOREFRONT PRODUCT (first item): [Could not stringify]');
      }
      
      console.log(`📦 First product raw structure from API:`, {
        baseSku: firstProduct.baseSku,
        name: firstProduct.name,
        title: firstProduct.title,
        stripeProductId: firstProduct.stripeProductId,
        stripe_product_id: firstProduct.stripe_product_id,
        productId: firstProduct.productId,
        hasVariants: !!firstProduct.variants,
        variantCount: firstProduct.variants?.length || 0,
        firstVariantStripePriceId: firstProduct.variants?.[0]?.stripePriceId,
        firstVariantPriceId: firstProduct.variants?.[0]?.priceId,
        category: firstProduct.category,
        categoryId: firstProduct.categoryId,
        allKeys: Object.keys(firstProduct).slice(0, 20) // First 20 keys to see structure
      });
      
      // Log all variants' Stripe Price IDs for first product
      if (firstProduct.variants && firstProduct.variants.length > 0) {
        console.log(`📦 First product variants (Stripe IDs):`, firstProduct.variants.map((v: any, idx: number) => ({
          index: idx,
          articleNumber: v.articleNumber,
          stripePriceId: v.stripePriceId,
          priceId: v.priceId,
          priceSEK: v.priceSEK
        })));
      }
    }
    
    // Map storefront products to our Product format
    // First, identify products that need stripeProductId fallback
    // Check for null, undefined, or empty string
    const productsNeedingFallback = data.products
      .map((p: any, index: number) => ({ product: p, index }))
      .filter(({ product: p }: { product: any; index: number }) => {
        const hasStripeProductId = p.stripeProductId && p.stripeProductId !== null && p.stripeProductId !== '';
        const hasStripeProductIdAlt = p.stripe_product_id && p.stripe_product_id !== null && p.stripe_product_id !== '';
        return !hasStripeProductId && !hasStripeProductIdAlt;
      })
      .slice(0, 5); // Fetch for first 5 products that need it to avoid too many API calls
    
    console.log(`📦 Products needing stripeProductId fallback: ${productsNeedingFallback.length} out of ${data.products.length}`);
    
    // Fetch stripeProductId from detail endpoint for products that need it
    const fallbackResults = await Promise.all(
      productsNeedingFallback.map(async ({ product: p, index }: { product: any; index: number }) => {
        try {
          console.warn(`⚠️ [getProducts] Product ${p.baseSku || p.id} missing stripeProductId in list response, trying detail endpoint...`);
          const detailRes = await sourceFetch(`/storefront/${TENANT_ID}/product/${p.baseSku || p.id}?locale=sv`, {
            headers: { 'X-Tenant': TENANT_ID }
          });
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            if (detailData.success && detailData.product) {
              const stripeProductId = detailData.product.stripeProductId || detailData.product.stripe_product_id || undefined;
              if (stripeProductId) {
                console.log(`✅ [getProducts] Fetched stripeProductId from detail endpoint: ${p.baseSku || p.id} → ${stripeProductId}`);
                return { index, stripeProductId };
              } else {
                console.warn(`⚠️ [getProducts] Detail endpoint also missing stripeProductId for ${p.baseSku || p.id}`);
              }
            }
          } else {
            console.warn(`⚠️ [getProducts] Detail endpoint returned ${detailRes.status} for ${p.baseSku || p.id}`);
          }
        } catch (error) {
          console.warn(`⚠️ [getProducts] Failed to fetch stripeProductId from detail endpoint for ${p.baseSku || p.id}:`, error);
        }
        return { index, stripeProductId: undefined };
      })
    );
    
    // Create a map of index -> stripeProductId for fallback results
    const fallbackMap = new Map<number, string | undefined>();
    fallbackResults.forEach(({ index, stripeProductId }) => {
      if (stripeProductId) {
        fallbackMap.set(index, stripeProductId);
        console.log(`✅ [getProducts] Added fallback stripeProductId for index ${index}: ${stripeProductId}`);
      }
    });
    
    const mappedProducts: Product[] = data.products.map((p: any, index: number) => {
      // Log raw API data for first few products to debug Stripe IDs
      if (index < 3) {
        console.log(`🔍 Raw API product ${p.baseSku || p.id}:`, {
          stripeProductId: p.stripeProductId,
          stripe_product_id: p.stripe_product_id,
          hasVariants: !!p.variants,
          variantCount: p.variants?.length || 0,
          firstVariantStripePriceId: p.variants?.[0]?.stripePriceId,
          firstVariantPriceId: p.variants?.[0]?.priceId
        });
      }

      // priceRange.min and priceSEK are ALWAYS in cents from Storefront API
      // Convert to SEK by dividing by 100
      const priceInCents = p.priceRange?.min || (p.variants?.[0]?.priceSEK);
      const priceInSEK = priceInCents ? priceInCents / 100 : undefined;
      
      // Check if product is a subscription
      // Log subscription data for debugging
      if (p.type === 'subscription' || p.subscription) {
        console.log(`📋 Subscription product detected: ${p.baseSku || p.id}`, {
          type: p.type,
          hasSubscriptionObject: !!p.subscription,
          subscription: p.subscription
        });
      }
      
      const isSubscription = p.type === 'subscription' || p.subscription;
      const subscriptionInfo: SubscriptionInfo | undefined = isSubscription && p.subscription
        ? {
            interval: p.subscription.interval || 'month',
            intervalCount: p.subscription.intervalCount || 1
          }
        : undefined;

      // Extract stripeProductId - handle null explicitly (convert to undefined)
      // CRITICAL: Check both stripeProductId and stripe_product_id fields
      // Also check if value is null (not just falsy) - null should be treated as missing
      let stripeProductId: string | undefined = undefined;
      
      // Try stripeProductId first
      if (p.stripeProductId && p.stripeProductId !== null && p.stripeProductId !== '') {
        stripeProductId = p.stripeProductId;
      }
      // Fallback to stripe_product_id
      else if (p.stripe_product_id && p.stripe_product_id !== null && p.stripe_product_id !== '') {
        stripeProductId = p.stripe_product_id;
      }
      // Use fallback map if available
      else if (fallbackMap.has(index)) {
        stripeProductId = fallbackMap.get(index);
      }
      
      // Log detailed info for first few products
      if (index < 3) {
        console.log(`🔍 [getProducts] Extracting stripeProductId for ${p.baseSku || p.id}:`, {
          rawStripeProductId: p.stripeProductId,
          rawStripeProductIdType: typeof p.stripeProductId,
          rawStripeProductIdAlt: p.stripe_product_id,
          rawStripeProductIdAltType: typeof p.stripe_product_id,
          hasFallback: fallbackMap.has(index),
          finalStripeProductId: stripeProductId,
          finalStripeProductIdType: typeof stripeProductId
        });
      }
      
      // Log if we're using fallback for first few products
      if (index < 3 && fallbackMap.has(index)) {
        console.log(`✅ [getProducts] Using fallback stripeProductId for ${p.baseSku || p.id}: ${stripeProductId}`);
      }
      
      // Log if stripeProductId is still missing for first few products
      if (index < 3 && !stripeProductId) {
        console.warn(`⚠️ [getProducts] Product ${p.baseSku || p.id} still missing stripeProductId after all attempts`);
      }

      return {
        id: p.baseSku || p.id,
        name: p.title || p.name,
        description: p.description,
        images: p.images || [],
        price: priceInSEK, // Store price in SEK, not cents
        currency: 'SEK',
        stripeProductId: stripeProductId, // Explicitly handle null -> undefined
        type: p.type || (isSubscription ? 'subscription' : 'one_time'),
        subscription: subscriptionInfo,
        variants: (p.variants || []).map((v: any) => {
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
          
          // Extract stripePriceId - handle null explicitly (convert to undefined)
          // CRITICAL: Check both stripePriceId and priceId fields
          // Also check if value is null (not just falsy) - null should be treated as missing
          let stripePriceId: string | undefined = undefined;
          
          if (v.stripePriceId && v.stripePriceId !== null && v.stripePriceId !== '') {
            stripePriceId = v.stripePriceId;
          } else if (v.priceId && v.priceId !== null && v.priceId !== '') {
            stripePriceId = v.priceId;
          }
          
          // Log if stripePriceId is missing for first variant of first few products
          if (!stripePriceId && index < 3 && p.variants?.indexOf(v) === 0) {
            console.warn(`⚠️ [getProducts] Variant ${articleNumber} of product ${p.baseSku || p.id} missing stripePriceId in API response:`, {
              rawStripePriceId: v.stripePriceId,
              rawStripePriceIdType: typeof v.stripePriceId,
              rawPriceId: v.priceId,
              rawPriceIdType: typeof v.priceId
            });
          }
          
          return {
            key: articleNumber,
            sku: articleNumber,
            stock: v.stock ?? 0,
            stripePriceId: stripePriceId, // Explicitly handle null -> undefined
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
    
    // Fetch campaign prices for all variants server-side
    // Collect all Stripe price IDs from product variants
    const allPriceIds: string[] = [];
    for (const product of mappedProducts) {
      for (const variant of product.variants || []) {
        if (variant.stripePriceId) {
          allPriceIds.push(variant.stripePriceId);
        }
      }
    }
    
    // Deduplicate the price IDs
    const uniquePriceIds = [...new Set(allPriceIds)];
    
    // Call the campaign API once if we have any price IDs
    let campaignPrices: Record<string, { discountPercent: number } | null> = {};
    if (uniquePriceIds.length > 0) {
      try {
        const campaignApiUrl = `${SOURCE_BASE}/api/campaigns/prices?priceIds=${uniquePriceIds.join(',')}`;
        console.log(`🔍 Fetching campaign prices for ${uniquePriceIds.length} unique price IDs`);
        
        const campaignRes = await sourceFetch(campaignApiUrl, {
          headers: {
            'X-Tenant': TENANT_ID
          }
        });
        
        if (campaignRes.ok) {
          const campaignData = await campaignRes.json();
          // Parse the response into a lookup map
          // Expected format: { "prices": { "price_abc": { "discountPercent": 20 }, "price_xyz": null } }
          if (campaignData.prices && typeof campaignData.prices === 'object') {
            campaignPrices = campaignData.prices;
            console.log(`✅ Received campaign prices for ${Object.keys(campaignPrices).filter(k => campaignPrices[k] !== null).length} price IDs`);
          } else {
            console.warn(`⚠️ Campaign API returned unexpected format:`, campaignData);
          }
        } else {
          console.warn(`⚠️ Campaign API returned ${campaignRes.status}, skipping campaign prices`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch campaign prices:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    // Inject campaign prices into variants
    let injectedCount = 0;
    for (const product of mappedProducts) {
      for (const variant of product.variants || []) {
        const campaign = campaignPrices[variant.stripePriceId || ''];
        
        if (campaign && variant.price) {
          // Calculate campaign price: original price * (1 - discountPercent / 100)
          // variant.price is in SEK, campaignPrice should also be in SEK
          variant.campaignPrice = Math.round(variant.price * (1 - campaign.discountPercent / 100) * 100) / 100; // Round to 2 decimals
          injectedCount++;
        }
      }
    }
    
    console.log(`✅ Injected campaign prices into ${injectedCount} variants`);
    
    // Log sample mapped products to verify Stripe IDs and variants
    if (mappedProducts.length > 0) {
      console.log(`📦 Sample mapped products (Stripe IDs):`, mappedProducts.slice(0, 3).map(p => ({
        productId: p.id,
        productName: p.name,
        stripeProductId: p.stripeProductId,
        variantCount: p.variants?.length || 0,
        firstVariantStripePriceId: p.variants?.[0]?.stripePriceId,
        firstVariantCampaignPrice: p.variants?.[0]?.campaignPrice
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


