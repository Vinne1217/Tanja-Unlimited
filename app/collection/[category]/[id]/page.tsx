import { getProduct } from '@/lib/catalog';
import ProductPurchase from './purchase';

export const revalidate = 300;

export default async function ProductPage({ params }: { params: { category: string; id: string } }) {
  const product = await getProduct(params.id, 'sv');
  if (!product) return <div>Product not found.</div>;
  const image = product.images?.[0];
  return (
    <section className="grid lg:grid-cols-2 gap-8">
      <div>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name} className="w-full rounded" />
        ) : (
          <div className="aspect-square bg-cream rounded" />)
        }
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">{product.name}</h1>
        {product.description && <p className="opacity-90">{product.description}</p>}
        <ProductPurchase product={product} />
      </div>
    </section>
  );
}


