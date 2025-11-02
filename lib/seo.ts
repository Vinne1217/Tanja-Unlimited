import { Product } from './catalog';

export function productJsonLd(p: Product) {
  const price = p.price ? (p.price / 100).toFixed(2) : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: p.images?.slice(0, 4),
    sku: p.variants?.[0]?.sku,
    offers: price
      ? {
          '@type': 'Offer',
          priceCurrency: p.currency ?? 'SEK',
          price,
          availability: 'https://schema.org/InStock'
        }
      : undefined
  } as Record<string, any>;
}


