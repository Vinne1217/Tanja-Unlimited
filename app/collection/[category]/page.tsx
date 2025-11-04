import { getProducts } from '@/lib/catalog';
import ProductCard from '@/components/ProductCard';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export default async function CategoryPage({ 
  params 
}: { 
  params: Promise<{ category: string }> 
}) {
  const { category } = await params;
  const { items } = await getProducts({ locale: 'sv', category, limit: 24 });
  
  return (
    <section className="min-h-screen py-16 bg-ivory">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <h2 className="text-4xl font-serif text-indigo mb-8">{category}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((p) => (
            <ProductCard 
              key={p.id} 
              id={p.id} 
              name={p.name} 
              image={p.images?.[0]} 
              categorySlug={category} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}


