import Link from 'next/link';
import { getCategoryBySlug } from '@/lib/products';
import { getProducts, getCategories } from '@/lib/catalog';
import CategoryPageClient from '../CategoryPageClient';
import CategoryNavigation from '@/components/CategoryNavigation';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export default async function SubcategoryPage({ 
  params 
}: { 
  params: Promise<{ slug: string; subcategory: string }> 
}) {
  const { slug, subcategory } = await params;
  
  console.log(`📦 SubcategoryPage: Loading subcategory ${subcategory} in category ${slug}`);
  
  // Get static category info for display
  const staticCategory = getCategoryBySlug(slug);
  
  // Fetch categories from Source API to find matching category and subcategory
  let sourceCategories: any[] = [];
  try {
    sourceCategories = await getCategories('sv');
    console.log(`✅ Fetched ${sourceCategories.length} categories from Source API`);
  } catch (error) {
    console.warn(`⚠️ Error fetching categories:`, error);
  }
  
  // Ensure sourceCategories is an array
  if (!Array.isArray(sourceCategories)) {
    sourceCategories = [];
  }
  
  const sourceCategory = sourceCategories.find(c => c.slug === slug);
  const sourceSubcategory = sourceCategory?.subcategories?.find((s: any) => s.slug === subcategory);
  
  console.log(`🔍 Subcategory lookup:`, {
    slug,
    subcategory,
    foundStaticCategory: !!staticCategory,
    foundSourceCategory: !!sourceCategory,
    foundSubcategory: !!sourceSubcategory,
  });
  
  // Fetch products filtered by subcategory
  let products: any[] = [];
  try {
    // Try filtering by subcategory slug
    const result = await getProducts({ 
      locale: 'sv', 
      category: subcategory, // Use subcategory slug for filtering
      limit: 100 
    });
    products = result.items || [];
    console.log(`✅ Fetched ${products.length} products for subcategory ${subcategory}`);
    
    // If no products found, try filtering all products by subcategory
    if (products.length === 0) {
      const allProductsResult = await getProducts({ 
        locale: 'sv', 
        limit: 100 
      });
      const allProducts = allProductsResult.items || [];
      
      // Filter products that match subcategory
      products = allProducts.filter(p => {
        const productCategory = p.categoryId || p.category;
        return productCategory === subcategory || 
               productCategory === sourceSubcategory?.id ||
               productCategory === sourceSubcategory?.slug;
      });
      console.log(`✅ Filtered to ${products.length} products for subcategory ${subcategory}`);
    }
  } catch (error) {
    console.error(`❌ Error fetching products:`, error);
    products = [];
  }
  
  // Use static category for display info, or fallback to Source API category
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
  
  // Use subcategory name if available
  const displayCategory = sourceSubcategory ? {
    ...category,
    name: sourceSubcategory.name || subcategory,
    description: sourceSubcategory.description || category.description
  } : category;
  
  // Convert Source API products to format expected by client component
  const formattedProducts = products.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    image: p.images?.[0],
    price: p.price || 0,
    currency: p.currency || 'SEK',
    salePrice: undefined,
    inStock: p.variants?.some((v: any) => v.inStock !== false) ?? true,
    category: p.categoryId || p.category || slug,
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

