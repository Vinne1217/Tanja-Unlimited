'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, RefreshCw, Scissors } from 'lucide-react';

export const dynamic = 'force-dynamic';

type CollectionCategory = {
  title: string;
  slug: string;
  description: string;
  image?: string;
  accentColor: string;
  icon: React.ReactNode;
};

export default function CollectionIndex() {
  const collections: CollectionCategory[] = [
    {
      title: 'Tanja Unlimited Collection',
      slug: 'tanja-collection',
      description: 'The bestseller - The Tanja Jacket. Hand-quilted cotton and silk fabrics from Rajasthan. Each jacket is reversible with two fronts. Unique designer garments, silk dresses, pashmina shawls, and calligraphy prints.',
      accentColor: 'warmOchre',
      icon: <Sparkles className="w-8 h-8" />
    },
    {
      title: 'Tanja Unlimited Outlet',
      slug: 'outlet',
      description: 'Exclusive outlet items at special prices. High-quality scarves, unique pieces, and selected items from previous collections. Limited availability.',
      accentColor: 'mutedRose',
      icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    },
    {
      title: 'Tanja Unlimited Ragpicker Jeans',
      slug: 'ragpicker-jeans',
      description: 'Jeans adorned with handicraft from Indian wedding shawls from the 30s and 40s. Patched with old embroidered camel blankets, hand-woven door decorations and drapes from Rajasthan.',
      accentColor: 'deepIndigo',
      icon: <Scissors className="w-8 h-8" />
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative py-24 bg-gradient-editorial overflow-hidden">
        <div className="absolute inset-0 pattern-block-print"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-sm uppercase tracking-widest text-warmOchre mb-6">
              Handcrafted Textiles & Fashion
            </p>
            <h1 className="text-6xl lg:text-7xl font-serif font-medium text-deepIndigo mb-6">
              Collection
            </h1>
            <div className="w-24 h-1 bg-warmOchre mx-auto mb-8"></div>
            <p className="text-lg text-softCharcoal max-w-2xl mx-auto leading-relaxed">
              Explore our curated collections of hand-crafted textiles, reversible jackets, 
              and unique fashion pieces from Rajasthan
            </p>
          </motion.div>
        </div>
      </section>

      {/* Collection cards */}
      <section className="py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-12">
            {collections.map((collection, idx) => (
              <motion.div
                key={collection.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Link 
                  href={`/collection/${collection.slug}`}
                  className="group block"
                >
                  <div className="relative overflow-hidden bg-warmIvory border border-warmOchre/20 transition-all duration-500 hover:border-warmOchre hover:shadow-xl">
                    {/* Visual header with pattern */}
                    <div className="relative h-80 overflow-hidden pattern-quilted bg-gradient-textile">
                      {/* Decorative corner elements */}
                      <div className="absolute top-6 left-6 text-deepIndigo/10 group-hover:text-deepIndigo/20 transition-colors">
                        <div className="text-9xl font-serif font-bold leading-none">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                      </div>
                      
                      {/* Icon */}
                      <div className="absolute bottom-6 right-6 text-warmOchre group-hover:text-deepIndigo transition-all duration-300 group-hover:scale-110">
                        {collection.icon}
                      </div>
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-deepIndigo/0 group-hover:bg-deepIndigo/5 transition-all duration-500"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-8 bg-cream">
                      <h2 className="text-2xl font-serif text-deepIndigo mb-4 group-hover:text-warmOchre transition-colors">
                        {collection.title}
                      </h2>
                      <p className="text-softCharcoal leading-relaxed mb-6">
                        {collection.description}
                      </p>
                      <div className="flex items-center gap-2 text-deepIndigo group-hover:text-warmOchre transition-colors">
                        <span className="text-sm uppercase tracking-widest font-medium">Explore Collection</span>
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

      {/* Info section */}
      <section className="py-24 bg-warmIvory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-serif font-medium text-deepIndigo mb-6">
                About Our Collections
              </h3>
              <div className="w-24 h-1 bg-warmOchre mx-auto"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-warmOchre/10">
                    <Sparkles className="w-6 h-6 text-warmOchre" />
                  </div>
                  <div>
                    <h4 className="text-lg font-serif text-deepIndigo mb-2">Handcrafted Quality</h4>
                    <p className="text-softCharcoal leading-relaxed">
                      Each piece is sewn by Tanja's own seamstresses using hand-quilted fabrics that were 
                      previously worn as camel blankets or saris by the women of Rajasthan, India.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-mutedRose/10">
                    <RefreshCw className="w-6 h-6 text-mutedRose" />
                  </div>
                  <div>
                    <h4 className="text-lg font-serif text-deepIndigo mb-2">Reversible Design</h4>
                    <p className="text-softCharcoal leading-relaxed">
                      The famous Tanja Jacket is completely reversible with two different fronts—you get 
                      two unique jackets in one!
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-sage/10">
                    <svg className="w-6 h-6 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-serif text-deepIndigo mb-2">Sustainable Fashion</h4>
                    <p className="text-softCharcoal leading-relaxed">
                      We transform antique fabrics and textiles into modern, wearable art. Each piece tells 
                      a story and helps preserve traditional craftsmanship.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-terracotta/10">
                    <svg className="w-6 h-6 text-terracotta" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                      <polyline points="2 17 12 22 22 17"/>
                      <polyline points="2 12 12 17 22 12"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-serif text-deepIndigo mb-2">One-of-a-Kind</h4>
                    <p className="text-softCharcoal leading-relaxed">
                      Because we use vintage and antique materials, each item is truly unique. No two pieces 
                      are exactly alike.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


