'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, RefreshCw, Heart, Phone } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import NewsSection from '@/components/NewsSection';
import { NewsItem } from '@/lib/news-types';

interface HomePageClientProps {
  newsItems: NewsItem[];
}

export default function HomePageClient({ newsItems }: HomePageClientProps) {
  const { t } = useTranslation();
  
  // Debug logging in client component
  console.log('HomePageClient: Received newsItems prop:', {
    count: newsItems?.length || 0,
    items: newsItems?.map(n => ({ id: n.id, title: n.title, type: n.type })) || [],
    isArray: Array.isArray(newsItems),
    type: typeof newsItems
  });
  
  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden texture-fabric">
        {/* Warm gradient background */}
        <div className="absolute inset-0 gradient-warm"></div>
        
        {/* Subtle textile pattern overlay */}
        <div className="absolute inset-0 pattern-block-print"></div>
        
        {/* Decorative elements - warm and organic */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-clay/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-10 w-80 h-80 bg-ochre/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-24">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-sm uppercase tracking-widest text-ochre mb-6">
                {t.home.subtitle}
              </p>
              <h1 className="text-6xl lg:text-7xl font-serif font-medium text-indigo mb-8 leading-tight">
                {t.home.title}
              </h1>
              <p className="text-xl text-graphite leading-relaxed mb-12 max-w-2xl font-light">
                {t.home.description}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <a 
                  href="/collection" 
                  className="group inline-flex items-center gap-3 btn-primary"
                >
                  <span className="tracking-wider">{t.home.ctaCollection}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a 
                  href="/events" 
                  className="group inline-flex items-center gap-3 btn-secondary"
                >
                  <span className="tracking-wider">{t.home.ctaExhibitions}</span>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Tanja Jacket - Featured */}
      <section className="relative py-24 bg-warmIvory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-5xl font-serif font-medium text-indigo mb-4">
                {t.home.tanjaJacket.title}
              </h2>
              <div className="divider-stitched w-24 mx-auto mb-6"></div>
              <p className="text-lg text-graphite font-light">
                {t.home.tanjaJacket.subtitle}
              </p>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-serif text-indigo">
                {t.home.tanjaJacket.heading}
              </h3>
              <p className="text-graphite leading-relaxed font-light">
                {t.home.tanjaJacket.description1}
              </p>
              <p className="text-graphite leading-relaxed font-light">
                {t.home.tanjaJacket.description2}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative bg-cream p-10 border border-ochre/20 paper-texture"
            >
              <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-ochre"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-ochre"></div>
              
              <h4 className="text-xl font-serif text-indigo mb-6">{t.home.tanjaJacket.whereToFind}</h4>
              <ul className="space-y-4 text-graphite font-light">
                <li className="flex items-start gap-3">
                  <span className="text-ochre mt-1">—</span>
                  <span>{t.home.tanjaJacket.location1}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-ochre mt-1">—</span>
                  <span>{t.home.tanjaJacket.location2}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-ochre mt-1">—</span>
                  <span>{t.home.tanjaJacket.location3}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-ochre mt-1">—</span>
                  <span>{t.home.tanjaJacket.location4}</span>
                </li>
              </ul>
              <a 
                href="/collection" 
                className="inline-flex items-center gap-2 mt-8 btn-primary"
              >
                <span>{t.home.tanjaJacket.viewCollection}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Links Grid */}
      <section className="py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.a 
              href="/collection" 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative bg-cream border border-warmOchre/20 p-10 hover:border-warmOchre transition-all duration-300"
            >
              <div className="mb-6 text-warmOchre">
                <Sparkles className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-serif text-indigo mb-3 group-hover:text-ochre transition-colors">
                {t.home.quickLinks.collection}
              </h3>
              <p className="text-graphite leading-relaxed mb-6 font-light">
                {t.home.quickLinks.collectionDesc}
              </p>
              <div className="flex items-center gap-2 text-indigo group-hover:text-ochre transition-colors">
                <span className="text-sm uppercase tracking-widest">{t.home.quickLinks.explore}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.a>
            
            <motion.a 
              href="/hand-lettering" 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative bg-cream border border-ochre/20 p-10 hover:border-ochre transition-all duration-300"
            >
              <div className="mb-6 text-ochre">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                  <path d="M2 2l7.586 7.586"/>
                </svg>
              </div>
              <h3 className="text-2xl font-serif text-indigo mb-3 group-hover:text-ochre transition-colors">
                {t.home.quickLinks.handLettering}
              </h3>
              <p className="text-graphite leading-relaxed mb-6 font-light">
                {t.home.quickLinks.handLetteringDesc}
              </p>
              <div className="flex items-center gap-2 text-indigo group-hover:text-ochre transition-colors">
                <span className="text-sm uppercase tracking-widest">{t.home.quickLinks.learnMore}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.a>
            
            <motion.a 
              href="/events" 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group relative bg-cream border border-ochre/20 p-10 hover:border-ochre transition-all duration-300"
            >
              <div className="mb-6 text-ochre">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <h3 className="text-2xl font-serif text-indigo mb-3 group-hover:text-ochre transition-colors">
                {t.home.quickLinks.exhibitions}
              </h3>
              <p className="text-graphite leading-relaxed mb-6 font-light">
                {t.home.quickLinks.exhibitionsDesc}
              </p>
              <div className="flex items-center gap-2 text-indigo group-hover:text-ochre transition-colors">
                <span className="text-sm uppercase tracking-widest">{t.home.quickLinks.viewSchedule}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.a>
          </div>
        </div>
      </section>

      {/* News Section */}
      <NewsSection newsItems={newsItems} />

      {/* Our Values Section */}
      <section className="py-24 bg-warmIvory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-serif font-medium text-indigo mb-6">
              {t.home.philosophy.title}
            </h2>
            <p className="text-lg text-graphite max-w-3xl mx-auto leading-relaxed font-light">
              {t.home.philosophy.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative bg-ivory p-8 border-l-2 border-warmOchre"
            >
              <div className="mb-4 text-ochre">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                  <path d="M2 2l7.586 7.586"/>
                </svg>
              </div>
              <h4 className="text-lg font-serif text-indigo mb-3">{t.home.philosophy.calligraphy}</h4>
              <p className="text-graphite text-sm leading-relaxed font-light">
                {t.home.philosophy.calligraphyDesc}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative bg-ivory p-8 border-l-2 border-clay"
            >
              <RefreshCw className="w-8 h-8 mb-4 text-clay" />
              <h4 className="text-lg font-serif text-indigo mb-3">{t.home.philosophy.reversible}</h4>
              <p className="text-graphite text-sm leading-relaxed font-light">
                {t.home.philosophy.reversibleDesc}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative bg-ivory p-8 border-l-2 border-terracotta"
            >
              <div className="mb-4 text-terracotta">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h4 className="text-lg font-serif text-indigo mb-3">{t.home.philosophy.heritage}</h4>
              <p className="text-graphite text-sm leading-relaxed font-light">
                {t.home.philosophy.heritageDesc}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative bg-ivory p-8 border-l-2 border-sage"
            >
              <Heart className="w-8 h-8 mb-4 text-sage" />
              <h4 className="text-lg font-serif text-indigo mb-3">{t.home.philosophy.global}</h4>
              <p className="text-graphite text-sm leading-relaxed font-light">
                {t.home.philosophy.globalDesc}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 bg-indigo text-ivory overflow-hidden">
        <div className="absolute inset-0 pattern-quilted opacity-20"></div>
        
        <div className="relative max-w-5xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl lg:text-5xl font-serif font-medium mb-6">
              {t.home.cta.title}
            </h2>
            <p className="text-ivory/80 text-lg mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              {t.home.cta.description}
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="tel:+46706332220" 
                className="inline-flex items-center gap-3 px-8 py-4 bg-ochre text-indigo hover:bg-clay transition-all duration-300 font-medium tracking-wider shadow-lg"
              >
                <Phone className="w-5 h-5" />
                <span>0706332220</span>
              </a>
              <a 
                href="/webshop" 
                className="inline-flex items-center gap-3 px-8 py-4 border-2 border-ivory text-ivory hover:bg-ivory hover:text-indigo transition-all duration-300 font-medium tracking-wider"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <span>{t.home.cta.visitWebshop}</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

