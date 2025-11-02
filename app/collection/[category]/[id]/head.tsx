import { getProduct } from '@/lib/catalog';
import { productJsonLd } from '@/lib/seo';

export default async function Head({ params }: { params: { id: string; category: string } }) {
  const product = await getProduct(params.id, 'sv');
  const jsonLd = product ? productJsonLd(product) : null;
  return (
    <>
      <title>{product ? `${product.name} — Tanja Unlimited` : 'Product — Tanja Unlimited'}</title>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
    </>
  );
}


