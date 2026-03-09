import Link from 'next/link';
import { getCategoryBySlug } from '@/lib/products';
import { getProducts, getCategories, Category as CatalogCategory } from '@/lib/catalog';
import CategoryPageClient from './CategoryPageClient';
import CategoryOverviewPageClient from './CategoryOverviewPageClient';
import CategoryNavigation from '@/components/CategoryNavigation';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  console.log('🔥 ROUTE EXECUTED: app/webshop/[slug]/page.tsx');
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
  // Always derive listing items directly from getProducts().items to preserve variants & campaign data
  let listingItems: any[] = [];
  try {
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
    listingItems = items || [];

    // Log first few products to verify Stripe IDs and variants are present
    if (listingItems.length > 0) {
      console.log(
        `📦 First products from getProducts (Stripe IDs & variants check):`,
        listingItems.slice(0, 3).map((p) => ({
          id: p.id,
          name: p.name,
          stripeProductId: p.stripeProductId,
          variantCount: p.variants?.length || 0,
          firstVariantStripePriceId: p.variants?.[0]?.stripePriceId,
          firstVariantCampaignPrice: p.variants?.[0]?.campaignPrice,
        }))
      );
    }
  } catch (error) {
    console.error(`❌ Error fetching products:`, error);
    listingItems = [];
  }

  // Debug: log raw storefront product structure before any mapping,
  // so we can see exactly where stripeProductId and variants live.
  if (listingItems && listingItems.length > 0) {
    try {
      console.log(
        'RAW STOREFRONT PRODUCT SAMPLE',
        JSON.stringify(listingItems[0], null, 2)
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

  // Debug: ensure listingItems still contain variants and campaignPrice before mapping
  console.log(
    'SERVER LISTING PRODUCTS',
    listingItems.map((p: any) => ({
      id: p.id,
      hasVariants: Array.isArray(p.variants),
      variantCount: p.variants?.length,
      firstVariantCampaignPrice: p.variants?.[0]?.campaignPrice,
    }))
  );

  // Build client-facing products directly from normalized items (preserve variants)
  const formattedProducts = listingItems.map((p: any) => ({
    ...p,
    name: p.name ?? p.title ?? '',
    image: p.images?.[0] ?? null,
    // Prefer normalized price from catalog; fallback to raw priceRange if present
    price:
      typeof p.price === 'number'
        ? p.price
        : p.priceRange?.min
        ? p.priceRange.min / 100
        : 0,
    currency: p.currency ?? p.priceRange?.currency ?? 'SEK',
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

