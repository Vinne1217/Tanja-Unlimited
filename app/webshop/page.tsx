'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { categories } from '@/lib/products';
import { useTranslation } from '@/lib/useTranslation';

// Mark as dynamic to support useSearchParams
export const dynamic = 'force-dynamic';

export default function WebshopPage() {
  const { t } = useTranslation();
  const categoryIcons: Record<string, React.ReactNode> = {
    jacket: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 7h-9M14 17H6m8 0c0 1.657-2.686 3-6 3s-6-1.343-6-3m12 0c0-1.657-2.686-3-6-3s-6 1.343-6 3m12 0v-6m-12 6v-6m12 0c0-1.657-2.686-3-6-3s-6 1.343-6 3"/>
      </svg>
    ),
    shirt: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 4l1.5 1.5L19 7l1 6-2 7H6l-2-7 1-6 2.5-1.5L9 4"/>
      </svg>
    ),
    pillow: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
      </svg>
    ),
    scarf: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3l7 7m-7 4l7 7m4-18l7 7m-7 4l7 7"/>
      </svg>
    ),
    rug: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="3" y1="15" x2="21" y2="15"/>
      </svg>
    ),
    jeans: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 2h10v12l-3 8H10l-3-8V2z"/>
        <line x1="7" y1="10" x2="17" y2="10"/>
      </svg>
    ),
    heart: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    ),
    sparkles: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        <path d="M5 3v4M3 5h4M6 17v4M4 19h4M15 4v2M14 5h2"/>
      </svg>
    ),
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-editorial overflow-hidden">
        <div className="absolute inset-0 pattern-block-print"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <ShoppingBag className="w-6 h-6 text-ochre" />
              <p className="text-sm uppercase tracking-widest text-ochre">
                {t.webshop.subtitle}
              </p>
            </div>
            <h1 className="text-6xl lg:text-7xl font-serif font-medium text-indigo mb-6">
              {t.webshop.title}
            </h1>
            <div className="w-24 h-1 bg-ochre mx-auto mb-8"></div>
            <p className="text-lg text-graphite max-w-2xl mx-auto leading-relaxed font-light">
              {t.webshop.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-medium text-indigo mb-6">
              {t.webshop.shopByCategory}
            </h2>
            <div className="w-24 h-1 bg-ochre mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, idx) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Link 
                  href={`/webshop/${category.slug}`}
                  className="group block"
                >
                  <div className="relative bg-warmIvory border border-warmOchre/20 hover:border-warmOchre transition-all duration-500 overflow-hidden">
                    {/* Icon Section */}
                    <div className="relative h-64 flex items-center justify-center pattern-quilted bg-gradient-textile group-hover:bg-warmOchre/5 transition-all duration-500">
                      <div className="text-warmOchre group-hover:text-deepIndigo group-hover:scale-110 transition-all duration-500">
                        {categoryIcons[category.icon]}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 bg-cream">
                      <h3 className="text-xl font-serif text-deepIndigo mb-3 group-hover:text-warmOchre transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-softCharcoal leading-relaxed mb-4">
                        {category.description}
                      </p>
                      <div className="flex items-center gap-2 text-deepIndigo group-hover:text-warmOchre transition-colors text-sm">
                        <span className="uppercase tracking-widest font-medium">Shop Now</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 bg-warmIvory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-warmOchre/10">
                <svg className="w-8 h-8 text-warmOchre" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3 className="text-lg font-serif text-deepIndigo mb-2">Unique & Handcrafted</h3>
              <p className="text-sm text-softCharcoal">
                Every piece is one-of-a-kind, made from antique textiles
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-mutedRose/10">
                <svg className="w-8 h-8 text-mutedRose" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>
                  <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/>
                </svg>
              </div>
              <h3 className="text-lg font-serif text-deepIndigo mb-2">Worldwide Shipping</h3>
              <p className="text-sm text-softCharcoal">
                We ship internationally to your door
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-terracotta/10">
                <svg className="w-8 h-8 text-terracotta" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3 className="text-lg font-serif text-deepIndigo mb-2">Secure Payment</h3>
              <p className="text-sm text-softCharcoal">
                Safe and secure payment processing
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-deepIndigo text-ivory overflow-hidden">
        <div className="absolute inset-0 pattern-quilted opacity-20"></div>
        
        <div className="relative max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h3 className="text-3xl font-serif font-medium mb-6">
              Need Help Finding Something?
            </h3>
            <p className="text-warmIvory/80 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
              Contact us for personalized assistance, custom orders, or any questions about our products
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="tel:+46706332220" 
                className="inline-flex items-center gap-3 px-8 py-4 bg-warmOchre text-deepIndigo hover:bg-antiqueGold transition-all duration-300 font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>Call Us</span>
              </a>
              <a 
                href="/contact" 
                className="inline-flex items-center gap-3 px-8 py-4 border-2 border-ivory text-ivory hover:bg-ivory hover:text-deepIndigo transition-all duration-300 font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <span>Contact Us</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
