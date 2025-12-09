import Link from 'next/link';
import { getCategoryBySlug } from '@/lib/products';
import { getProducts, getCategories } from '@/lib/catalog';
import CategoryPageClient from './CategoryPageClient';
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
  
  const sourceCategory = sourceCategories.find(c => c.slug === slug);
  console.log(`🔍 Category lookup:`, {
    slug,
    foundStaticCategory: !!staticCategory,
    foundSourceCategory: !!sourceCategory,
    sourceCategoryId: sourceCategory?.id,
    sourceCategorySlug: sourceCategory?.slug
  });
  
  // Fetch products from Source API
  let products: any[] = [];
  try {
    // Try fetching with category filter first
    const categoryParam = sourceCategory?.id || sourceCategory?.slug || slug;
    let result = await getProducts({ 
      locale: 'sv', 
      category: categoryParam,
      limit: 100 
    });
    products = result.items || [];
    console.log(`✅ Fetched ${products.length} products with category filter: ${categoryParam}`);
    
    // If no products found with filter, fetch all and filter manually
    if (products.length === 0) {
      const allProductsResult = await getProducts({ 
        locale: 'sv', 
        limit: 100 
      });
      const allProducts = allProductsResult.items || [];
      console.log(`✅ Fetched ${allProducts.length} total products from Source API`);
      
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
      
      // Filter products that match any of the category IDs
      products = allProducts.filter(p => {
        const productCategoryId = p.categoryId;
        if (!productCategoryId) return false;
        
        // Check if product's categoryId matches any of our category IDs
        return categoryIdsToMatch.some(catId => 
          productCategoryId === catId || 
          productCategoryId.toString() === catId.toString()
        );
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
    // Handle price conversion (might be in cents or SEK)
    let price = 0;
    if (p.price) {
      // If price is very large (> 10000), assume it's in cents (e.g., 500000 = 5000 SEK)
      // Otherwise assume it's already in SEK
      price = p.price > 10000 ? p.price / 100 : p.price;
    }
    
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      image: p.images?.[0],
      price: price,
      currency: p.currency || 'SEK',
      salePrice: undefined, // Will be handled by campaign pricing
      inStock: true,
      stripeProductId: p.stripeProductId, // Include Stripe Product ID
      stripePriceId: p.variants?.[0]?.stripePriceId || undefined,
      category: category.id
    };
  });
  
  console.log(`✅ CategoryPage: Prepared ${formattedProducts.length} products for display`);

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

