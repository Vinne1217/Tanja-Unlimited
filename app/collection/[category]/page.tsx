import { getProducts } from '@/lib/catalog';
import ProductCard from '@/components/ProductCard';

export const revalidate = 300;

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const { items } = await getProducts({ locale: 'sv', category: params.category, limit: 24 });
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">{params.category}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => (
          <ProductCard key={p.id} id={p.id} name={p.name} image={p.images?.[0]} categorySlug={params.category} />
        ))}
      </div>
    </section>
  );
}


