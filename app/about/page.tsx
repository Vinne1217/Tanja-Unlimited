'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Newspaper, ShoppingBag, MapPin, Users } from 'lucide-react';

export default function AboutPage() {
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
            <p className="text-sm uppercase tracking-widest text-warmOchre mb-6">
              Our Story & Philosophy
            </p>
            <h1 className="text-6xl lg:text-7xl font-serif font-medium text-deepIndigo mb-6">
              About Tanja Unlimited
            </h1>
            <div className="w-24 h-1 bg-warmOchre mx-auto mb-8"></div>
            <p className="text-lg text-softCharcoal max-w-2xl mx-auto leading-relaxed">
              Discover our story, values, and commitment to sustainable fashion and craftsmanship
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
                className="group block bg-cream border border-warmOchre/20 p-8 hover:border-warmOchre hover:shadow-lg transition-all duration-300"
              >
                <Newspaper className="w-10 h-10 text-warmOchre mb-4 group-hover:text-deepIndigo transition-colors" />
                <h3 className="text-xl font-serif text-deepIndigo mb-2 group-hover:text-warmOchre transition-colors">
                  Press
                </h3>
                <p className="text-sm text-softCharcoal">Media coverage and press releases</p>
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
                className="group block bg-cream border border-warmOchre/20 p-8 hover:border-warmOchre hover:shadow-lg transition-all duration-300"
              >
                <ShoppingBag className="w-10 h-10 text-mutedRose mb-4 group-hover:text-deepIndigo transition-colors" />
                <h3 className="text-xl font-serif text-deepIndigo mb-2 group-hover:text-warmOchre transition-colors">
                  Webshop Info
                </h3>
                <p className="text-sm text-softCharcoal">How to shop and order</p>
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
                className="group block bg-cream border border-warmOchre/20 p-8 hover:border-warmOchre hover:shadow-lg transition-all duration-300"
              >
                <MapPin className="w-10 h-10 text-terracotta mb-4 group-hover:text-deepIndigo transition-colors" />
                <h3 className="text-xl font-serif text-deepIndigo mb-2 group-hover:text-warmOchre transition-colors">
                  Tanja in India
                </h3>
                <p className="text-sm text-softCharcoal">Our connection to Rajasthan</p>
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
                className="group block bg-cream border border-warmOchre/20 p-8 hover:border-warmOchre hover:shadow-lg transition-all duration-300"
              >
                <Users className="w-10 h-10 text-sage mb-4 group-hover:text-deepIndigo transition-colors" />
                <h3 className="text-xl font-serif text-deepIndigo mb-2 group-hover:text-warmOchre transition-colors">
                  Sister Unlimited
                </h3>
                <p className="text-sm text-softCharcoal">Our sister brand</p>
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
              <h2 className="text-4xl font-serif font-medium text-deepIndigo">
                Our Story
              </h2>
              <div className="w-16 h-1 bg-warmOchre"></div>
              <p className="text-softCharcoal leading-relaxed">
                Tanja Unlimited offers unique fashion pieces handcrafted from textiles with a rich history. 
                Our signature piece, The Tanja Jacket, is sewn by our own seamstresses from hand-quilted 
                cotton or silk fabrics that were previously worn by the women of Rajasthan, India, as camel 
                blankets or saris.
              </p>
              <p className="text-softCharcoal leading-relaxed">
                Each Tanja jacket is completely reversible with two different fronts—giving you two unique 
                jackets in one. We also create the Tanja rug from recycled antique camel blankets, featuring 
                several layers of hand-quilted, beautifully worn cotton fabrics.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="aspect-[4/5] bg-gradient-textile pattern-quilted border border-warmOchre/20"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-medium text-deepIndigo mb-6">
              Our Values
            </h2>
            <div className="w-24 h-1 bg-warmOchre mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-warmOchre/10">
                <svg className="w-10 h-10 text-warmOchre" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3 className="text-xl font-serif text-deepIndigo mb-4">Sustainability</h3>
              <p className="text-softCharcoal leading-relaxed">
                We give new life to antique fabrics and textiles, reducing waste while preserving 
                traditional craftsmanship and cultural heritage.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-mutedRose/10">
                <svg className="w-10 h-10 text-mutedRose" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3 className="text-xl font-serif text-deepIndigo mb-4">Handcrafted</h3>
              <p className="text-softCharcoal leading-relaxed">
                Every piece is carefully made by skilled artisans, ensuring exceptional quality and 
                attention to detail in each unique item.
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
              <h3 className="text-xl font-serif text-deepIndigo mb-4">Artistic</h3>
              <p className="text-softCharcoal leading-relaxed">
                Our designs blend traditional Indian textiles with modern Scandinavian aesthetics, 
                featuring Tanja's original calligraphy artwork.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="relative py-24 bg-deepIndigo text-ivory overflow-hidden">
        <div className="absolute inset-0 pattern-block-print opacity-50"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h3 className="text-3xl font-serif font-medium mb-6">Visit Our Atelier</h3>
              <div className="w-16 h-1 bg-warmOchre mb-8"></div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium mb-3 text-warmOchre">Göteborg Store</h4>
                  <p className="text-warmIvory/80 mb-4 leading-relaxed">
                    Molinsgatan 13<br/>
                    411 33 Göteborg<br/>
                    Sweden
                  </p>
                  <a 
                    href="http://maps.google.se/maps?q=Molinsgatan+13,+Göteborg" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-warmOchre text-deepIndigo hover:bg-antiqueGold transition-all duration-300"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>View on Map</span>
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
              <h4 className="text-lg font-medium mb-6 text-warmOchre">Where to Find Us</h4>
              <ul className="space-y-4 text-warmIvory/80">
                <li className="flex items-start gap-3">
                  <span className="text-warmOchre mt-1">—</span>
                  <span>Bra Under i Focus, Göteborg</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-warmOchre mt-1">—</span>
                  <span>European Trade Fairs</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-warmOchre mt-1">—</span>
                  <span>Online at shop.tanjaunlimited.se</span>
                </li>
              </ul>
              <p className="mt-8 text-warmIvory/80">
                Ring Tanja Kisker: <a href="tel:+46706332220" className="text-warmOchre font-medium hover:text-antiqueGold transition-colors">0706332220</a>
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
