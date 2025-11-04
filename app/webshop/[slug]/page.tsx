'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { getCategoryBySlug, getProductsByCategory, formatPrice } from '@/lib/products';
import { use } from 'react';

// Mark as dynamic to support client-side rendering
export const dynamic = 'force-dynamic';

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const category = getCategoryBySlug(slug);
  const products = category ? getProductsByCategory(category.id) : [];

  if (!category) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-deepIndigo mb-4">Category Not Found</h1>
          <Link href="/webshop" className="text-warmOchre hover:text-deepIndigo">
            ← Back to Webshop
          </Link>
        </div>
      </div>
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
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
          </motion.div>
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
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="group"
                >
                  <div className="bg-warmIvory border border-ochre/20 hover:border-ochre transition-all duration-500 overflow-hidden h-full flex flex-col">
                    {/* Product Image */}
                    <div className="relative h-80 bg-warmIvory overflow-hidden">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-textile pattern-quilted flex items-center justify-center group-hover:bg-ochre/5 transition-all duration-500">
                          <div className="text-ochre/20 group-hover:text-ochre/30 transition-colors">
                            <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5"/>
                              <path d="M21 15l-5-5L5 21"/>
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      {/* Sale Badge */}
                      {product.salePrice && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-terracotta text-ivory text-xs uppercase tracking-widest font-medium z-10">
                          Sale
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 bg-cream flex-1 flex flex-col">
                      <h3 className="text-xl font-serif text-indigo mb-3 group-hover:text-ochre transition-colors">
                        {product.name}
                      </h3>
                      
                      {product.description && (
                        <p className="text-sm text-graphite leading-relaxed mb-4 flex-1 font-light">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="mt-auto">
                        <div className="flex items-baseline gap-2 mb-4">
                          {product.salePrice ? (
                            <>
                              <span className="text-2xl font-serif text-terracotta">
                                {formatPrice(product.salePrice, product.currency)}
                              </span>
                              <span className="text-lg text-graphite/50 line-through">
                                {formatPrice(product.price, product.currency)}
                              </span>
                            </>
                          ) : (
                            <span className="text-2xl font-serif text-indigo">
                              {formatPrice(product.price, product.currency)}
                            </span>
                          )}
                        </div>
                        
                        <Link
                          href={`/webshop/${slug}/${product.id}`}
                          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo text-ivory hover:bg-indigoDeep transition-all duration-300 font-medium"
                        >
                          <span>View Details</span>
                          <ShoppingCart className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
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

