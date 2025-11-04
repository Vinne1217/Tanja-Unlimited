import { getProduct } from '@/lib/catalog';
import ProductPurchase from './purchase';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ category: string; id: string }> 
}) {
  const { id } = await params;
  const product = await getProduct(id, 'sv');
  
  if (!product) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-indigo mb-4">Product not found</h1>
          <a href="/collection" className="text-ochre hover:text-indigo">← Back to Collection</a>
        </div>
      </div>
    );
  }
  
  const image = product.images?.[0];
  
  return (
    <section className="min-h-screen py-16 bg-ivory">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={image} 
                alt={product.name} 
                className="w-full rounded border border-ochre/20"
              />
            ) : (
              <div className="aspect-square bg-cream rounded border border-ochre/20" />
            )}
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-serif text-indigo">{product.name}</h1>
            {product.description && (
              <p className="text-graphite leading-relaxed font-light">{product.description}</p>
            )}
            <ProductPurchase product={product} />
          </div>
        </div>
      </div>
    </section>
  );
}


