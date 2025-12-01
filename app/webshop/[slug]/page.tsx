import Link from 'next/link';
import { getCategoryBySlug } from '@/lib/products';
import { getProducts, getCategories } from '@/lib/catalog';
import CategoryPageClient from './CategoryPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Get static category info for display (name, description, etc.)
  const staticCategory = getCategoryBySlug(slug);
  
  // Fetch categories from Source API to find matching category
  const sourceCategories = await getCategories('sv');
  const sourceCategory = sourceCategories.find(c => c.slug === slug);
  
  // Fetch products from Source API using the category slug or ID
  const categoryParam = sourceCategory?.id || sourceCategory?.slug || slug;
  const { items: products } = await getProducts({ 
    locale: 'sv', 
    category: categoryParam, 
    limit: 100 
  });
  
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
  const formattedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    image: p.images?.[0],
    price: p.price ? p.price / 100 : 0, // Convert from cents to SEK
    currency: p.currency || 'SEK',
    salePrice: undefined, // Will be handled by campaign pricing
    inStock: true,
    stripeProductId: undefined,
    stripePriceId: undefined,
    category: category.id
  }));

  return (
    <CategoryPageClient 
      category={category}
      products={formattedProducts}
      slug={slug}
    />
  );
}

