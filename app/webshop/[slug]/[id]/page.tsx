import Link from 'next/link';
import { getCategoryBySlug } from '@/lib/products';
import { getProduct, getCategories, getProducts } from '@/lib/catalog';
import ProductDetailPageClient from './ProductDetailPageClient';
import CategoryNavigation from '@/components/CategoryNavigation';
import CategoryPageClient from '../CategoryPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export default async function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string; id: string }> 
}) {
  try {
    const { slug, id } = await params;
    
    console.log(`📦 ProductDetailPage: Loading ${id} in category ${slug}`);
    
    // Get static category info for display
    const staticCategory = getCategoryBySlug(slug);
    
    // Fetch categories from Source API to check if this is a subcategory
    let sourceCategories: any[] = [];
    try {
      sourceCategories = await getCategories('sv');
    } catch (error) {
      console.warn(`⚠️ Error fetching categories:`, error);
    }
    
    if (!Array.isArray(sourceCategories)) {
      sourceCategories = [];
    }
    
    const sourceCategory = sourceCategories.find(c => c.slug === slug);
    const sourceSubcategory = sourceCategory?.subcategories?.find((s: any) => s.slug === id);
    
    // If this is a subcategory, render subcategory page instead
    if (sourceSubcategory) {
      console.log(`📦 Detected subcategory: ${id}, rendering subcategory page`);
      
      // Fetch products filtered by subcategory
      let products: any[] = [];
      try {
        // Try fetching with subcategory filter first
        const subcategoryParam = sourceSubcategory?.id || sourceSubcategory?.slug || id;
        console.log(`🔍 Subcategory filter params:`, {
          sourceSubcategoryId: sourceSubcategory?.id,
          sourceSubcategorySlug: sourceSubcategory?.slug,
          id,
          subcategoryParam
        });
        
        let result = await getProducts({ 
          locale: 'sv', 
          category: subcategoryParam,
          limit: 100 
        });
        products = result.items || [];
        console.log(`✅ Fetched ${products.length} products with subcategory filter: ${subcategoryParam}`);
        
        // If no products found with filter, fetch all and filter manually
        if (products.length === 0) {
          const allProductsResult = await getProducts({ 
            locale: 'sv', 
            limit: 100 
          });
          const allProducts = allProductsResult.items || [];
          console.log(`✅ Fetched ${allProducts.length} total products from Source API`);
          
          // Log sample product categoryIds to see what we're working with
          if (allProducts.length > 0) {
            console.log(`📦 Sample product categoryIds (subcategory page):`, allProducts.slice(0, 5).map(p => ({
              productId: p.id,
              productName: p.name,
              categoryId: p.categoryId
            })));
          }
          
          // Build list of category IDs to match (subcategory ID and slug)
          const categoryIdsToMatch: string[] = [];
          if (sourceSubcategory) {
            if (sourceSubcategory.id) categoryIdsToMatch.push(sourceSubcategory.id);
            if (sourceSubcategory.slug) categoryIdsToMatch.push(sourceSubcategory.slug);
          }
          categoryIdsToMatch.push(id); // Add the slug from URL
          
          console.log(`🔍 Subcategory IDs to match:`, categoryIdsToMatch);
          
          // Filter products that match the subcategory
          products = allProducts.filter(p => {
            const productCategoryId = p.categoryId;
            if (!productCategoryId) {
              if (allProducts.indexOf(p) < 3) {
                console.log(`⚠️ Product ${p.id} (${p.name}) has no categoryId`);
              }
              return false;
            }
            
            const matches = categoryIdsToMatch.some(catId => {
              const match = productCategoryId === catId || 
                           productCategoryId.toString() === catId.toString();
              if (match && allProducts.indexOf(p) < 3) {
                console.log(`✅ Product ${p.id} matches subcategory ${catId} (product.categoryId: ${productCategoryId})`);
              }
              return match;
            });
            
            if (!matches && allProducts.indexOf(p) < 3) {
              console.log(`❌ Product ${p.id} (${p.name}) categoryId "${productCategoryId}" doesn't match any of:`, categoryIdsToMatch);
            }
            
            return matches;
          });
          
          console.log(`✅ Filtered to ${products.length} products for subcategory ${subcategoryParam}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching products:`, error);
        products = [];
      }
      
      const category = staticCategory || (sourceCategory ? {
        id: sourceCategory.id,
        name: sourceCategory.name,
        slug: sourceCategory.slug,
        description: '',
        icon: 'sparkles'
      } : null);
      
      if (!category) {
        return (
          <div className="min-h-screen bg-ivory flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-serif text-deepIndigo mb-4">Category Not Found</h1>
              <Link href="/webshop" className="text-warmOchre hover:text-deepIndigo">
                ← Back to Webshop
              </Link>
            </div>
          </div>
        );
      }
      
      const displayCategory = {
        ...category,
        name: sourceSubcategory.name || id,
        description: sourceSubcategory.description || category.description
      };
      
      const formattedProducts = products.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        image: p.images?.[0],
        price: p.price || 0,
        currency: p.currency || 'SEK',
        salePrice: undefined,
        inStock: p.variants?.some((v: any) => v.inStock !== false) ?? true,
        category: p.categoryId || slug,
      }));
      
      return (
        <>
          <CategoryNavigation />
          <CategoryPageClient 
            category={displayCategory}
            products={formattedProducts}
            slug={slug}
          />
        </>
      );
    }
    
    // Otherwise, treat as product ID
    console.log(`📦 Treating ${id} as product ID`);
    
    // Fetch product from Source API
    let sourceProduct;
    try {
      sourceProduct = await getProduct(id, 'sv');
    } catch (error) {
      console.error(`❌ Error fetching product ${id}:`, error);
      return (
        <div className="min-h-screen bg-ivory flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-serif text-deepIndigo mb-4">Error Loading Product</h1>
            <p className="text-deepIndigo mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
            <Link href="/webshop" className="text-warmOchre hover:text-deepIndigo">
              ← Back to Webshop
            </Link>
          </div>
        </div>
      );
    }
    
    if (!sourceProduct) {
      console.warn(`⚠️ Product ${id} not found`);
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-deepIndigo mb-4">Product Not Found</h1>
          <Link href="/webshop" className="text-warmOchre hover:text-deepIndigo">
            ← Back to Webshop
          </Link>
        </div>
      </div>
    );
  }

    // Use already fetched categories (from subcategory check above)
    const sourceCategoryFromList = sourceCategories.find(c => c.slug === slug);
    
    // Use static category for display info, or fallback to Source API category
    const category = staticCategory || (sourceCategoryFromList ? {
      id: sourceCategoryFromList.id,
      name: sourceCategoryFromList.name,
      slug: sourceCategoryFromList.slug,
      description: '',
      icon: 'sparkles'
    } : null);
    
    if (!category) {
      console.warn(`⚠️ Category ${slug} not found for product ${id}`);
  return (
        <div className="min-h-screen bg-ivory flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-serif text-deepIndigo mb-4">Category Not Found</h1>
            <p className="text-deepIndigo mb-4">Category "{slug}" does not exist</p>
            <Link href="/webshop" className="text-warmOchre hover:text-deepIndigo">
              ← Back to Webshop
            </Link>
          </div>
        </div>
      );
    }
    
    // Convert Source API product to format expected by BuyNowButton
    // BuyNowButton expects Product from @/lib/products but also uses variants
    // Price should already be in SEK from getProduct (converted from cents in lib/catalog.ts)
    // But add safety check: if price is very large (> 10000), it's likely still in cents
    let price = sourceProduct.price || 0;
    if (price > 10000) {
      console.warn(`⚠️ Product ${id} price seems to be in cents (${price}), converting to SEK`);
      price = price / 100;
    }
    
    // Log price for debugging
    console.log(`💰 Product price for ${id}:`, {
      rawPrice: sourceProduct.price,
      convertedPrice: price,
      currency: sourceProduct.currency
    });
    
    // Log images for debugging
    console.log(`📸 Product images for ${id}:`, {
      imageCount: sourceProduct.images?.length || 0,
      images: sourceProduct.images || [],
      hasImages: !!(sourceProduct.images && sourceProduct.images.length > 0),
      firstImageUrl: sourceProduct.images?.[0] || 'none'
    });

    const product: any = {
      id: sourceProduct.id,
      name: sourceProduct.name,
      description: sourceProduct.description,
      price: price,
      currency: sourceProduct.currency || 'SEK',
      category: category.id,
      image: sourceProduct.images?.[0], // Keep for backward compatibility
      images: sourceProduct.images || [], // ✅ Add full images array
      inStock: true,
      stripeProductId: sourceProduct.stripeProductId, // Use Stripe Product ID from Source API
      stripePriceId: sourceProduct.variants?.[0]?.stripePriceId || undefined,
    };
    
    // Add variants if they exist (BuyNowButton uses this)
    // IMPORTANT: Include size and color fields directly from Source API
    if (sourceProduct.variants && sourceProduct.variants.length > 0) {
      try {
        product.variants = sourceProduct.variants.map((v: any) => {
          // ✅ Include variant-specific price data from Storefront API
          // priceSEK is in cents (e.g., 29900 = 299 SEK), always convert to SEK
          const variantPriceSEK = v.priceSEK ?? v.price ?? null;
          const variantPrice = variantPriceSEK ? variantPriceSEK / 100 : null;
          
          return {
            key: v.key,
            sku: v.sku,
            stock: v.stock ?? 0,
            stripePriceId: v.stripePriceId,
            size: v.size, // ✅ Include size field directly from Source API
            color: v.color, // ✅ Include color field directly from Source API
            status: v.status,
            outOfStock: v.outOfStock,
            lowStock: v.lowStock,
            inStock: v.inStock,
            priceSEK: variantPriceSEK, // Price in cents from API
            price: variantPrice, // Price in SEK (converted)
            priceFormatted: v.priceFormatted || (variantPrice ? `${variantPrice.toFixed(2)} kr` : undefined) // Formatted price string
          };
        });
      } catch (error) {
        console.error(`❌ Error mapping variants for product ${id}:`, error);
        // Continue without variants if mapping fails
        product.variants = [];
      }
    }

    // ✅ Add final check before passing to client
    console.log(`📤 Passing product to client component:`, {
      productId: product.id,
      imagesArray: product.images,
      imageCount: product.images?.length || 0,
      firstImage: product.image || 'none'
    });

    console.log(`✅ ProductDetailPage: Successfully loaded product ${id}`, {
      hasVariants: !!product.variants,
      variantCount: product.variants?.length || 0,
      category: category.slug
    });

    return (
      <>
        <CategoryNavigation />
        <ProductDetailPageClient 
          product={product}
          category={category}
          slug={slug}
        />
      </>
    );
  } catch (error) {
    console.error(`❌ Fatal error in ProductDetailPage:`, error);
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-deepIndigo mb-4">Error Loading Page</h1>
          <p className="text-deepIndigo mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
          <Link href="/webshop" className="text-warmOchre hover:text-deepIndigo">
            ← Back to Webshop
          </Link>
        </div>
    </div>
  );
  }
}

