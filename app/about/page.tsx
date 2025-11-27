'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Newspaper, ShoppingBag, MapPin, Users } from 'lucide-react';
import { useTranslation } from '../../lib/useTranslation';

// Mark as dynamic to support useSearchParams
export const dynamic = 'force-dynamic';

export default function AboutPage() {
  const { t } = useTranslation();
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
            <p className="text-sm uppercase tracking-widest text-ochre mb-6">
              {t.about.subtitle}
            </p>
            <h1 className="text-6xl lg:text-7xl font-serif font-medium text-indigo mb-6">
              {t.about.title}
            </h1>
            <div className="w-24 h-1 bg-ochre mx-auto mb-8"></div>
            <p className="text-lg text-graphite max-w-2xl mx-auto leading-relaxed font-light">
              {t.about.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 bg-ivory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Link 
                href="/about/press" 
                className="group block bg-cream border border-ochre/20 p-8 hover:border-ochre hover:shadow-lg transition-all duration-300"
              >
                <Newspaper className="w-10 h-10 text-ochre mb-4 group-hover:text-indigo transition-colors" />
                <h3 className="text-xl font-serif text-indigo mb-2 group-hover:text-ochre transition-colors">
                  {t.about.press}
                </h3>
                <p className="text-sm text-graphite font-light">{t.about.pressDesc}</p>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link 
                href="/about/webshop-info" 
                className="group block bg-cream border border-ochre/20 p-8 hover:border-ochre hover:shadow-lg transition-all duration-300"
              >
                <ShoppingBag className="w-10 h-10 text-clay mb-4 group-hover:text-indigo transition-colors" />
                <h3 className="text-xl font-serif text-indigo mb-2 group-hover:text-ochre transition-colors">
                  {t.about.webshopInfo}
                </h3>
                <p className="text-sm text-graphite font-light">{t.about.webshopInfoDesc}</p>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link 
                href="/about/tanja-in-india" 
                className="group block bg-cream border border-ochre/20 p-8 hover:border-ochre hover:shadow-lg transition-all duration-300"
              >
                <MapPin className="w-10 h-10 text-terracotta mb-4 group-hover:text-indigo transition-colors" />
                <h3 className="text-xl font-serif text-indigo mb-2 group-hover:text-ochre transition-colors">
                  {t.about.tanjaInIndia}
                </h3>
                <p className="text-sm text-graphite font-light">{t.about.tanjaInIndiaDesc}</p>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link 
                href="/sister-unlimited" 
                className="group block bg-cream border border-ochre/20 p-8 hover:border-ochre hover:shadow-lg transition-all duration-300"
              >
                <Users className="w-10 h-10 text-sage mb-4 group-hover:text-indigo transition-colors" />
                <h3 className="text-xl font-serif text-indigo mb-2 group-hover:text-ochre transition-colors">
                  {t.about.sisterUnlimited}
                </h3>
                <p className="text-sm text-graphite font-light">{t.about.sisterUnlimitedDesc}</p>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 bg-warmIvory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-serif font-medium text-indigo">
                {t.about.ourStory}
              </h2>
              <div className="w-16 h-1 bg-ochre"></div>
              <p className="text-graphite leading-relaxed font-light">
                {t.about.storyP1}
              </p>
              <p className="text-graphite leading-relaxed font-light">
                {t.about.storyP2}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="aspect-[4/5] bg-gradient-textile pattern-quilted border border-ochre/20"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-medium text-indigo mb-6">
              {t.about.ourValues}
            </h2>
            <div className="w-24 h-1 bg-ochre mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-ochre/10">
                <svg className="w-10 h-10 text-ochre" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3 className="text-xl font-serif text-indigo mb-4">{t.about.sustainability}</h3>
              <p className="text-graphite leading-relaxed font-light">
                {t.about.sustainabilityDesc}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-clay/10">
                <svg className="w-10 h-10 text-clay" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3 className="text-xl font-serif text-indigo mb-4">{t.about.handcrafted}</h3>
              <p className="text-graphite leading-relaxed font-light">
                {t.about.handcraftedDesc}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-terracotta/10">
                <svg className="w-10 h-10 text-terracotta" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                  <path d="M2 2l7.586 7.586"/>
                </svg>
              </div>
              <h3 className="text-xl font-serif text-indigo mb-4">{t.about.artistic}</h3>
              <p className="text-graphite leading-relaxed font-light">
                {t.about.artisticDesc}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="relative py-24 bg-indigo text-ivory overflow-hidden">
        <div className="absolute inset-0 pattern-block-print opacity-50"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h3 className="text-3xl font-serif font-medium mb-6">{t.about.visitAtelier}</h3>
              <div className="w-16 h-1 bg-ochre mb-8"></div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium mb-3 text-ochre">{t.about.goteborgStore}</h4>
                  <p className="text-ivory/80 mb-4 leading-relaxed font-light">
                    Molinsgatan 13<br/>
                    411 33 Göteborg<br/>
                    Sweden
                  </p>
                  <a 
                    href="http://maps.google.se/maps?q=Molinsgatan+13,+Göteborg" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-ochre text-indigo hover:bg-clay transition-all duration-300 tracking-wider"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{t.events.viewMap}</span>
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h4 className="text-lg font-medium mb-6 text-ochre">{t.about.whereToFind}</h4>
              <ul className="space-y-4 text-ivory/80 font-light">
                <li className="flex items-start gap-3">
                  <span className="text-ochre mt-1">—</span>
                  <span>Bra Under i Focus, Göteborg</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-ochre mt-1">—</span>
                  <span>European Trade Fairs</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-ochre mt-1">—</span>
                  <span>Online at shop.tanjaunlimited.se</span>
                </li>
              </ul>
              <p className="mt-8 text-ivory/80 font-light">
                Ring Tanja Kisker: <a href="tel:+46706332220" className="text-ochre font-medium hover:text-clay transition-colors">0706332220</a>
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
