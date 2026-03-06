import Link from 'next/link';
import { getCategoryBySlug } from '@/lib/products';
import { getProducts, getCategories, Category as CatalogCategory } from '@/lib/catalog';
import CategoryPageClient from './CategoryPageClient';
import CategoryOverviewPageClient from './CategoryOverviewPageClient';
import CategoryNavigation from '@/components/CategoryNavigation';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  console.log(`📦 CategoryPage: Loading category ${slug}`);
  
  // Get static category info for display (name, description, etc.)
  const staticCategory = getCategoryBySlug(slug);
  
  // Fetch categories from Source API to find matching category
  let sourceCategories: any[] = [];
  try {
    sourceCategories = await getCategories('sv');
    console.log(`✅ Fetched ${sourceCategories.length} categories from Source API`);
  } catch (error) {
    console.warn(`⚠️ Error fetching categories:`, error);
  }
  
  // Ensure sourceCategories is an array
  if (!Array.isArray(sourceCategories)) {
    console.warn(`⚠️ sourceCategories is not an array:`, typeof sourceCategories);
    sourceCategories = [];
  }

  const sourceCategory: CatalogCategory | undefined = sourceCategories.find(
    (c: CatalogCategory) => c.slug === slug
  );
  console.log(`🔍 Category lookup:`, {
    slug,
    foundStaticCategory: !!staticCategory,
    foundSourceCategory: !!sourceCategory,
    sourceCategoryId: sourceCategory?.id,
    sourceCategorySlug: sourceCategory?.slug
  });

  // Om kategorin har underkategorier: visa en ren underkategori-översikt
  if (sourceCategory && Array.isArray(sourceCategory.subcategories) && sourceCategory.subcategories.length > 0) {
    const displayCategory = {
      id: sourceCategory.id,
      name: sourceCategory.name,
      slug: sourceCategory.slug,
      description: sourceCategory.description || staticCategory?.description || '',
      icon: sourceCategory.icon || staticCategory?.icon || 'sparkles',
    };

    console.log(
      `📦 CategoryPage: rendering subcategory overview for ${slug} with ${sourceCategory.subcategories.length} subcategories`
    );

    return (
      <>
        <CategoryNavigation />
        <CategoryOverviewPageClient
          category={displayCategory}
          subcategories={sourceCategory.subcategories}
        />
      </>
    );
  }

  // Fetch products from Source API
  let products: any[] = [];
  try {
    // Try fetching with category filter first
    const categoryParam = sourceCategory?.id || sourceCategory?.slug || slug;
    console.log(`🔍 Category filter params:`, {
      sourceCategoryId: sourceCategory?.id,
      sourceCategorySlug: sourceCategory?.slug,
      slug,
      categoryParam
    });
    
    let result = await getProducts({ 
      locale: 'sv', 
      category: categoryParam,
      limit: 100 
    });
    products = result.items || [];
    console.log(`✅ Fetched ${products.length} products with category filter: ${categoryParam}`);
    
    // Log first few products to verify Stripe IDs are present
    if (products.length > 0) {
      console.log(`📦 First products from getProducts (Stripe IDs check):`, products.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        stripeProductId: p.stripeProductId,
        variantCount: p.variants?.length || 0,
        firstVariantStripePriceId: p.variants?.[0]?.stripePriceId
      })));
    }
    
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
        console.log(`📦 Sample product categoryIds:`, allProducts.slice(0, 5).map(p => ({
          productId: p.id,
          productName: p.name,
          categoryId: p.categoryId
        })));
      }
      
      // Build list of category IDs to match (parent + all subcategories)
      const categoryIdsToMatch: string[] = [];
      if (sourceCategory) {
        // Add parent category ID
        if (sourceCategory.id) categoryIdsToMatch.push(sourceCategory.id);
        if (sourceCategory.slug) categoryIdsToMatch.push(sourceCategory.slug);
        
        // Add all subcategory IDs
        if (sourceCategory.subcategories && sourceCategory.subcategories.length > 0) {
          sourceCategory.subcategories.forEach((sub: any) => {
            if (sub.id) categoryIdsToMatch.push(sub.id);
            if (sub.slug) categoryIdsToMatch.push(sub.slug);
          });
        }
      }
      // Also add slug as fallback
      categoryIdsToMatch.push(slug);
      
      console.log(`🔍 Category IDs to match:`, categoryIdsToMatch);
      
      // Filter products that match any of the category IDs
      products = allProducts.filter(p => {
        const productCategoryId = p.categoryId;
        if (!productCategoryId) {
          // Log products without categoryId for debugging
          if (allProducts.indexOf(p) < 3) {
            console.log(`⚠️ Product ${p.id} (${p.name}) has no categoryId`);
          }
          return false;
        }
        
        // Check if product's categoryId matches any of our category IDs
        const matches = categoryIdsToMatch.some(catId => {
          const match = productCategoryId === catId || 
                       productCategoryId.toString() === catId.toString();
          if (match && allProducts.indexOf(p) < 3) {
            console.log(`✅ Product ${p.id} matches category ${catId} (product.categoryId: ${productCategoryId})`);
          }
          return match;
        });
        
        if (!matches && allProducts.indexOf(p) < 3) {
          console.log(`❌ Product ${p.id} (${p.name}) categoryId "${productCategoryId}" doesn't match any of:`, categoryIdsToMatch);
        }
        
        return matches;
      });
      
      console.log(`✅ Filtered to ${products.length} products matching categories:`, categoryIdsToMatch);
    }
  } catch (error) {
    console.error(`❌ Error fetching products:`, error);
    products = [];
  }
  
  // Use Source API category for display info (preferred), or fallback to static category
  const category = (sourceCategory ? {
    id: sourceCategory.id,
    name: sourceCategory.name,
    slug: sourceCategory.slug,
    description: sourceCategory.description || staticCategory?.description || '',
    icon: sourceCategory.icon || staticCategory?.icon || 'sparkles'
  } : staticCategory) || null;

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

  // Convert Source API products to format expected by client component
  const formattedProducts = products.map(p => {
    // Välj den variant vars pris vi utgår från i kortet:
    // - helst den billigaste varianten (lägsta price)
    // - fall tillbaka till första varianten om pris saknas
    const variants = p.variants || [];
    const primaryVariant =
      variants.length > 0
        ? variants.reduce((best: any, v: any) => {
            const bestPrice = best?.price ?? Number.POSITIVE_INFINITY;
            const currentPrice = v.price ?? Number.POSITIVE_INFINITY;
            return currentPrice < bestPrice ? v : best;
          }, variants[0])
        : undefined;

    // Price är redan i SEK från getProducts (konverterad från cents i lib/catalog.ts)
    const basePrice = p.price || 0;
    const variantPrice = primaryVariant?.price ?? basePrice;

    // Extract Stripe IDs - ensure they're not null (convert to undefined)
    const stripeProductId = p.stripeProductId || undefined;
    const stripePriceId = primaryVariant?.stripePriceId || undefined;

    // Log first few products to verify Stripe IDs are being passed correctly
    if (products.indexOf(p) < 3) {
      console.log(`🔍 CategoryPage: Preparing product ${p.id}:`, {
        stripeProductId,
        stripePriceId,
        primaryVariantArticleNumber: primaryVariant?.sku || primaryVariant?.key,
        variantCount: variants.length,
        allVariantStripePriceIds: variants.map((v: any) => v.stripePriceId).filter(Boolean)
      });
    }

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      image: p.images?.[0],
      price: variantPrice, // priset vi visar i kortet
      currency: p.currency || 'SEK',
      salePrice: undefined, // hanteras av kampanjlogik
      inStock: true,
      stripeProductId: stripeProductId, // Stripe Product ID behövs för kampanj-API (explicitly undefined if null)
      // Viktigt: använd samma Stripe Price ID som för varianten vars pris vi visar
      stripePriceId: stripePriceId, // Explicitly undefined if null
      category: category.id,
      // Skicka med varianterna i ett format som ProductCardWithCampaign förstår
      variants: variants.map((v: any) => ({
        key: v.key || v.articleNumber || v.sku,
        sku: v.sku || v.articleNumber || v.key,
        stripePriceId: v.stripePriceId || undefined,
        // Storefront ger priceSEK i öre – konvertera till SEK för klientlogik
        price: v.price ?? (v.priceSEK ? v.priceSEK / 100 : undefined),
        priceSEK: v.priceSEK,
        stock: v.stock ?? 0
      }))
    };
  });
  
  // Debug: verify that formatted products still contain Stripe IDs and variants
  console.log(
    'DEBUG formattedProducts before client boundary:',
    formattedProducts.slice(0, 2).map(p => ({
      id: p.id,
      stripeProductId: p.stripeProductId,
      stripePriceId: p.stripePriceId,
      variantCount: p.variants?.length,
      firstVariantStripePriceId: p.variants?.[0]?.stripePriceId
    }))
  );
  
  console.log(`✅ CategoryPage: Prepared ${formattedProducts.length} products for display`);
  
  // Log sample formatted products to verify Stripe IDs
  if (formattedProducts.length > 0) {
    console.log(`📦 CategoryPage: Sample formatted products (Stripe IDs):`, formattedProducts.slice(0, 3).map(p => ({
      id: p.id,
      name: p.name,
      stripeProductId: p.stripeProductId,
      stripePriceId: p.stripePriceId,
      variantCount: p.variants?.length || 0
    })));
  }

  // SERVER-SIDE VERIFICATION: Log formattedProducts immediately before client boundary
  console.log(
    "SERVER formattedProducts sample",
    formattedProducts.slice(0, 3).map(p => ({
      id: p.id,
      stripeProductId: p.stripeProductId,
      stripePriceId: p.stripePriceId,
      variantCount: p.variants?.length
    }))
  );

  return (
    <>
      <CategoryNavigation />
      <CategoryPageClient 
        category={category}
        products={formattedProducts}
        slug={slug}
      />
    </>
  );
}

