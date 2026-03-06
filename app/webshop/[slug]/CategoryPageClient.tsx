'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ProductCardWithCampaign from '@/components/ProductCardWithCampaign';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
};

// Keep a local variant type so we can pass variant data (including Stripe Price IDs)
type Variant = {
  key: string;
  sku: string;
  stock: number;
  stripePriceId?: string;
  price?: number;
  priceSEK?: number;
};

type Product = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  currency: string;
  salePrice?: number;
  inStock?: boolean;
  category?: string;
  stripeProductId?: string | null; // Stripe Product ID for campaign price lookup
  stripePriceId?: string | null; // Stripe Price ID for variant-specific campaigns
  variants?: Variant[];   // Ensure variants survive the server → client boundary
};

export default function CategoryPageClient({
  category,
  products,
  slug
}: {
  category: Category;
  products: Product[];
  slug: string;
}) {
  // Client-side verification: ensure stripeProductId and variants survive the server → client boundary
  if (products && products.length > 0) {
    console.log(
      'CATEGORY CLIENT PRODUCTS',
      products.map((p) => ({
        id: p.id,
        stripeProductId: p.stripeProductId,
        variantCount: p.variants?.length,
        firstVariantStripePriceId: p.variants?.[0]?.stripePriceId
      }))
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 bg-gradient-editorial overflow-hidden">
        <div className="absolute inset-0 pattern-block-print"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
          <Link 
            href="/webshop"
            className="inline-flex items-center gap-2 text-sm text-warmOchre hover:text-deepIndigo transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Webshop</span>
          </Link>

          <div>
            <h1 className="text-5xl lg:text-6xl font-serif font-medium text-deepIndigo mb-6">
              {category.name}
            </h1>
            <div className="w-24 h-1 bg-warmOchre mb-6"></div>
            <p className="text-lg text-softCharcoal max-w-2xl leading-relaxed">
              {category.description}
            </p>
            <p className="text-sm text-softCharcoal/60 mt-4">
              {products.length} {products.length === 1 ? 'product' : 'products'} available
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-softCharcoal">
                No products available in this category at the moment.
              </p>
              <Link 
                href="/contact" 
                className="inline-block mt-6 px-8 py-3 bg-deepIndigo text-ivory hover:bg-indigoDeep transition-all duration-300"
              >
                Contact Us for Availability
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, idx) => (
                <ProductCardWithCampaign
                  key={product.id}
                  product={product}
                  slug={slug}
                  idx={idx}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="relative py-16 bg-deepIndigo text-ivory overflow-hidden">
        <div className="absolute inset-0 pattern-quilted opacity-20"></div>
        
        <div className="relative max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h3 className="text-2xl font-serif font-medium mb-4">
            Questions About Our Products?
          </h3>
          <p className="text-warmIvory/80 mb-8">
            Contact us for more information, custom orders, or assistance
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="tel:+46706332220" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-warmOchre text-deepIndigo hover:bg-antiqueGold transition-all duration-300 font-medium"
            >
              <span>+46 70 633 22 20</span>
            </a>
            <a 
              href="mailto:info@tanjaunlimited.se" 
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-ivory text-ivory hover:bg-ivory hover:text-deepIndigo transition-all duration-300 font-medium"
            >
              <span>info@tanjaunlimited.se</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}


