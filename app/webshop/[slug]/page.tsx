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
  let productsForCategory: any[] = [];
  try {
    // Try fetching with category filter first
    const categoryParam = sourceCategory?.id || sourceCategory?.slug || slug;
    console.log(`🔍 Category filter params:`, {
      sourceCategoryId: sourceCategory?.id,
      sourceCategorySlug: sourceCategory?.slug,
      slug,
      categoryParam
    });
    
    const { items } = await getProducts({
      locale: 'sv',
      category: categoryParam,
      limit: 100,
    });
    const categoryItems = items || [];
    console.log(`✅ Fetched ${categoryItems.length} products with category filter: ${categoryParam}`);
    
    // Log first few products to verify Stripe IDs are present
    if (categoryItems.length > 0) {
      console.log(`📦 First products from getProducts (Stripe IDs check):`, categoryItems.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        stripeProductId: p.stripeProductId,
        variantCount: p.variants?.length || 0,
        firstVariantStripePriceId: p.variants?.[0]?.stripePriceId
      })));
    }
    
    // If no products found with filter, fetch all and filter manually
    if (categoryItems.length === 0) {
      const { items: allItems } = await getProducts({
        locale: 'sv',
        limit: 100,
      });
      const allProducts = allItems || [];
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
      productsForCategory = allProducts.filter(p => {
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
      
      console.log(`✅ Filtered to ${productsForCategory.length} products matching categories:`, categoryIdsToMatch);
    } else {
      // We already have category-filtered items from the first getProducts call
      productsForCategory = categoryItems;
    }
  } catch (error) {
    console.error(`❌ Error fetching products:`, error);
    productsForCategory = [];
  }

  // Debug: log raw storefront product structure before any mapping,
  // so we can see exactly where stripeProductId and variants live.
  if (productsForCategory && productsForCategory.length > 0) {
    try {
      console.log(
        'RAW STOREFRONT PRODUCT SAMPLE',
        JSON.stringify(productsForCategory[0], null, 2)
      );
    } catch {
      console.log('RAW STOREFRONT PRODUCT SAMPLE: [Could not stringify first product]');
    }
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

  // Forward full products from getProducts() and only add a few helper fields
  const formattedProducts = productsForCategory.map((p: any) => ({
    ...p,
    // Use first variant's stripePriceId as default for card-level priceId
    stripePriceId: p.variants?.[0]?.stripePriceId ?? null,
    // Extra fält som underlättar loggning och kampanjlogik i klienten
    variantCount: p.variants?.length ?? 0,
    firstVariantStripePriceId: p.variants?.[0]?.stripePriceId ?? null,
  }));

  console.log(
    'SERVER PRODUCTS SENT TO CLIENT',
    formattedProducts.map((p: any) => ({
      id: p.id,
      hasVariants: Array.isArray(p.variants),
      variantCount: p.variants?.length,
      firstVariantCampaignPrice: p.variants?.[0]?.campaignPrice,
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

