import { sourceFetch } from './source';

export type Category = { id: string; slug: string; name: string };
export type Variant = { key: string; sku: string; stock: number; stripePriceId: string };
export type Product = {
  id: string;
  name: string;
  description?: string;
  images?: string[];
  price?: number; // cents for default price if no variants
  currency?: string;
  variants?: Variant[];
  categoryId?: string;
};

export async function getCategories(locale = 'sv'): Promise<Category[]> {
  const res = await sourceFetch(`/v1/tenants/tanja/catalog/categories?locale=${locale}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getProducts(params: { locale?: string; category?: string; q?: string; limit?: number; cursor?: string } = {}): Promise<{ items: Product[]; nextCursor?: string }>{
  const qs = new URLSearchParams();
  if (params.locale) qs.set('locale', params.locale);
  if (params.category) qs.set('category', params.category);
  if (params.q) qs.set('q', params.q);
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.cursor) qs.set('cursor', params.cursor);
  const res = await sourceFetch(`/v1/tenants/tanja/catalog/products?${qs.toString()}`);
  if (!res.ok) return { items: [] };
  return res.json();
}

export async function getProduct(productId: string, locale = 'sv'): Promise<Product | null> {
  const res = await sourceFetch(`/v1/tenants/tanja/catalog/products/${productId}?locale=${locale}`);
  if (!res.ok) return null;
  return res.json();
}


