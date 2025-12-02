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
  try {
    const { slug, id } = await params;
    
    console.log(`📦 ProductDetailPage: Loading product ${id} in category ${slug}`);
    
    // Get static category info for display
    const staticCategory = getCategoryBySlug(slug);
    
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
    
    // Fetch categories from Source API to find matching category
    let sourceCategories: any[] = [];
    try {
      sourceCategories = await getCategories('sv');
    } catch (error) {
      console.warn(`⚠️ Error fetching categories, using static category only:`, error);
    }
    
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
    // Handle price conversion safely (price might already be in SEK, not cents)
    let price = 0;
    if (sourceProduct.price) {
      // If price is very large (> 10000), assume it's in cents (e.g., 500000 = 5000 SEK)
      // Otherwise assume it's already in SEK
      price = sourceProduct.price > 10000 ? sourceProduct.price / 100 : sourceProduct.price;
    }
    
    const product: any = {
      id: sourceProduct.id,
      name: sourceProduct.name,
      description: sourceProduct.description,
      price: price,
      currency: sourceProduct.currency || 'SEK',
      category: category.id,
      image: sourceProduct.images?.[0],
      inStock: true,
      stripeProductId: sourceProduct.stripeProductId, // Use Stripe Product ID from Source API
      stripePriceId: sourceProduct.variants?.[0]?.stripePriceId || undefined,
    };
    
    // Add variants if they exist (BuyNowButton uses this)
    // IMPORTANT: Include size and color fields directly from Source API
    if (sourceProduct.variants && sourceProduct.variants.length > 0) {
      try {
        product.variants = sourceProduct.variants.map((v: any) => ({
          key: v.key,
          sku: v.sku,
          stock: v.stock ?? 0,
          stripePriceId: v.stripePriceId,
          size: v.size, // ✅ Include size field directly from Source API
          color: v.color, // ✅ Include color field directly from Source API
          status: v.status,
          outOfStock: v.outOfStock,
          lowStock: v.lowStock,
          inStock: v.inStock
        }));
      } catch (error) {
        console.error(`❌ Error mapping variants for product ${id}:`, error);
        // Continue without variants if mapping fails
        product.variants = [];
      }
    }

    console.log(`✅ ProductDetailPage: Successfully loaded product ${id}`, {
      hasVariants: !!product.variants,
      variantCount: product.variants?.length || 0,
      category: category.slug
    });

    return (
      <ProductDetailPageClient 
        product={product}
        category={category}
        slug={slug}
      />
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

