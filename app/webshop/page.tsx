'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, MessageCircle, ArrowRight } from 'lucide-react';

export default function WebshopPage() {
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
              Shop Online
            </p>
            <h1 className="text-6xl lg:text-7xl font-serif font-medium text-deepIndigo mb-6">
              Webshop
            </h1>
            <div className="w-24 h-1 bg-warmOchre mx-auto mb-8"></div>
            <p className="text-lg text-softCharcoal max-w-2xl mx-auto leading-relaxed">
              Browse our unique handcrafted items and contact us to place your order
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact for Orders */}
      <section className="py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-medium text-deepIndigo mb-6">
              Buy Online
            </h2>
            <div className="w-24 h-1 bg-warmOchre mx-auto"></div>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-cream border border-warmOchre/20 p-8"
            >
              <p className="text-sm uppercase tracking-widest text-warmOchre mb-3">English</p>
              <p className="text-softCharcoal leading-relaxed">
                For orders and enquiries in the webshop, please contact Tanja Kisker at{' '}
                <a href="mailto:info@tanjaunlimited.se" className="text-warmOchre font-medium hover:text-deepIndigo transition-colors">
                  info@tanjaunlimited.se
                </a>{' '}
                or{' '}
                <a href="tel:+46706332220" className="text-warmOchre font-medium hover:text-deepIndigo transition-colors">
                  +46706332220
                </a>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-warmIvory border border-mutedRose/20 p-8"
            >
              <p className="text-sm uppercase tracking-widest text-mutedRose mb-3">Deutsch</p>
              <p className="text-softCharcoal leading-relaxed">
                Für Bestellungen und Anfragen im Webshop kontaktieren Sie bitte Tanja Kisker unter{' '}
                <a href="mailto:info@tanjaunlimited.se" className="text-mutedRose font-medium hover:text-deepIndigo transition-colors">
                  info@tanjaunlimited.se
                </a>{' '}
                oder{' '}
                <a href="tel:+46706332220" className="text-mutedRose font-medium hover:text-deepIndigo transition-colors">
                  +46706332220
                </a>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-cream border border-terracotta/20 p-8"
            >
              <p className="text-sm uppercase tracking-widest text-terracotta mb-3">Svenska</p>
              <p className="text-softCharcoal leading-relaxed">
                För beställningar och frågor om köp i webbshoppen, kontakta Tanja Kisker på{' '}
                <a href="mailto:info@tanjaunlimited.se" className="text-terracotta font-medium hover:text-deepIndigo transition-colors">
                  info@tanjaunlimited.se
                </a>{' '}
                eller{' '}
                <a href="tel:+46706332220" className="text-terracotta font-medium hover:text-deepIndigo transition-colors">
                  +46706332220
                </a>
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 flex flex-wrap justify-center gap-4"
          >
            <a 
              href="tel:+46706332220" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-deepIndigo text-ivory hover:bg-indigoDeep transition-all duration-300 font-medium"
            >
              <Phone className="w-5 h-5" />
              <span>Call Us</span>
            </a>
            <a 
              href="mailto:info@tanjaunlimited.se" 
              className="inline-flex items-center gap-3 px-8 py-4 border-2 border-deepIndigo text-deepIndigo hover:bg-deepIndigo hover:text-ivory transition-all duration-300 font-medium"
            >
              <Mail className="w-5 h-5" />
              <span>Email Us</span>
            </a>
            <a 
              href="https://wa.me/46706332220" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-warmOchre text-deepIndigo hover:bg-antiqueGold transition-all duration-300 font-medium"
            >
              <MessageCircle className="w-5 h-5" />
              <span>WhatsApp</span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Browse Collections CTA */}
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
              Browse Our Collections
            </h3>
            <p className="text-warmIvory/80 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
              Explore our unique handcrafted items and contact us to place your order
            </p>
            <a 
              href="/collection" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-warmOchre text-deepIndigo hover:bg-antiqueGold transition-all duration-300 font-medium"
            >
              <span>View Collections</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
