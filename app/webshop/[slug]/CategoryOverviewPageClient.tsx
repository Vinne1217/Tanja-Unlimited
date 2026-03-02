'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

type Subcategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
};

export default function CategoryOverviewPageClient({
  category,
  subcategories,
}: {
  category: Category;
  subcategories: Subcategory[];
}) {
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
            <span>Tillbaka till webbshoppen</span>
          </Link>

          <div>
            <h1 className="text-5xl lg:text-6xl font-serif font-medium text-deepIndigo mb-6">
              {category.name}
            </h1>
            <div className="w-24 h-1 bg-warmOchre mb-6"></div>
            {category.description && (
              <p className="text-lg text-softCharcoal max-w-2xl leading-relaxed">
                {category.description}
              </p>
            )}
            <p className="text-sm text-softCharcoal/60 mt-4">
              Välj en underkategori för att se produkterna.
            </p>
          </div>
        </div>
      </section>

      {/* Subcategories grid */}
      <section className="py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {subcategories.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-softCharcoal">
                Det finns inga underkategorier för den här kategorin ännu.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {subcategories.map((subcategory, idx) => (
                <motion.div
                  key={subcategory.id || subcategory.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                  <Link
                    href={`/webshop/${category.slug}/${subcategory.slug}`}
                    className="group block h-full"
                  >
                    <div className="relative bg-warmIvory border border-warmOchre/20 hover:border-warmOchre transition-all duration-500 overflow-hidden h-full flex flex-col">
                      {/* Image / placeholder */}
                      <div className="relative h-56 bg-cream pattern-quilted flex items-center justify-center overflow-hidden">
                        {subcategory.imageUrl ? (
                          <img
                            src={subcategory.imageUrl}
                            alt={subcategory.name || 'Underkategori'}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-warmOchre/70 text-sm uppercase tracking-[0.2em]">
                            Underkategori
                          </div>
                        )}
                      </div>

                      <div className="p-6 bg-cream flex-1 flex flex-col">
                        <h2 className="text-xl font-serif text-deepIndigo mb-2 group-hover:text-warmOchre transition-colors">
                          {subcategory.name}
                          {subcategory.productCount !== undefined &&
                            subcategory.productCount > 0 && (
                              <span className="ml-2 text-sm font-normal opacity-70">
                                ({subcategory.productCount})
                              </span>
                            )}
                        </h2>
                        {subcategory.description && (
                          <p className="text-sm text-softCharcoal/90 leading-relaxed mb-4">
                            {subcategory.description}
                          </p>
                        )}
                        <div className="mt-auto flex items-center gap-2 text-sm text-deepIndigo group-hover:text-warmOchre transition-colors">
                          <span className="uppercase tracking-widest font-medium">
                            Visa produkter
                          </span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

