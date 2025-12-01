import Link from 'next/link';
import { getCategoryBySlug } from '@/lib/products';
import { getProduct, getCategories } from '@/lib/catalog';
import ProductDetailPageClient from './ProductDetailPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export default async function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string; id: string }> 
}) {
  const { slug, id } = await params;
  
  // Get static category info for display
  const staticCategory = getCategoryBySlug(slug);
  
  // Fetch product from Source API
  const sourceProduct = await getProduct(id, 'sv');
  
  if (!sourceProduct) {
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
  
  // Fetch categories from Source API to find matching category
  const sourceCategories = await getCategories('sv');
  const sourceCategory = sourceCategories.find(c => c.slug === slug);
  
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
  
  // Convert Source API product to format expected by BuyNowButton
  // BuyNowButton expects Product from @/lib/products but also uses variants
  const product: any = {
    id: sourceProduct.id,
    name: sourceProduct.name,
    description: sourceProduct.description,
    price: sourceProduct.price ? sourceProduct.price / 100 : 0, // Convert from cents to SEK
    currency: sourceProduct.currency || 'SEK',
    category: category.id,
    image: sourceProduct.images?.[0],
    inStock: true,
    stripeProductId: undefined,
    stripePriceId: sourceProduct.variants?.[0]?.stripePriceId || undefined,
  };
  
  // Add variants if they exist (BuyNowButton uses this)
  if (sourceProduct.variants && sourceProduct.variants.length > 0) {
    product.variants = sourceProduct.variants.map((v: any) => ({
      key: v.key,
      sku: v.sku,
      stock: v.stock,
      stripePriceId: v.stripePriceId
    }));
  }

  return (
    <ProductDetailPageClient 
      product={product}
      category={category}
      slug={slug}
    />
  );
}

