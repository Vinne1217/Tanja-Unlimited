import Link from 'next/link';
import { getCategoryBySlug } from '@/lib/products';
import { getProducts, getCategories } from '@/lib/catalog';
import CategoryPageClient from './CategoryPageClient';

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
  // NOTE: Storefront API might not support category filtering, so try without category first
  let products: any[] = [];
  try {
    // First try without category filter (Storefront API might return all products)
    const result = await getProducts({ 
      locale: 'sv', 
      limit: 100 
    });
    products = result.items || [];
    console.log(`✅ Fetched ${products.length} products from Source API (no category filter)`);
    
    // If we have products, filter by category if sourceCategory exists
    if (products.length > 0 && sourceCategory) {
      const categoryParam = sourceCategory.id || sourceCategory.slug;
      // Filter products by category (check if product.category matches)
      const filteredProducts = products.filter(p => {
        const productCategory = p.categoryId || p.category;
        return productCategory === categoryParam || productCategory === slug;
      });
      
      if (filteredProducts.length > 0) {
        products = filteredProducts;
        console.log(`✅ Filtered to ${products.length} products in category ${categoryParam}`);
      } else {
        console.warn(`⚠️ No products found after filtering by category ${categoryParam}, showing all products`);
      }
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
    <CategoryPageClient 
      category={category}
      products={formattedProducts}
      slug={slug}
    />
  );
}

