import { getProducts } from '@/lib/catalog';
import ProductCardWithCampaign from '@/components/ProductCardWithCampaign';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export default async function CategoryPage({ 
  params 
}: { 
  params: Promise<{ category: string }> 
}) {
  const { category } = await params;
  const { items } = await getProducts({ locale: 'sv', category, limit: 24 });

  // Debug: ensure collection listing receives variants with campaignPrice from getProducts()
  console.log(
    'SERVER PRODUCTS SENT TO COLLECTION LISTING',
    items.map((p) => ({
      id: p.id,
      hasVariants: Array.isArray(p.variants),
      variantCount: p.variants?.length,
      firstVariantCampaignPrice: p.variants?.[0]?.campaignPrice,
    }))
  );
  
  return (
    <section className="min-h-screen py-16 bg-ivory">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <h2 className="text-4xl font-serif text-indigo mb-8">{category}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((product, idx) => (
            <ProductCardWithCampaign
              key={product.id}
              product={{
                id: product.id,
                name: product.name,
                description: product.description,
                image: product.images?.[0],
                price: product.price || 0,
                currency: product.currency || 'SEK',
                // Only pass fields that exist on the Product type returned by getProducts()
                stripeProductId: product.stripeProductId,
                stripePriceId: product.variants?.[0]?.stripePriceId || null,
                type: product.type,
                subscription: product.subscription,
                variants: product.variants,
              }}
              slug={category}
              idx={idx}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


