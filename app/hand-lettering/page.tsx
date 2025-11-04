'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

// Mark as dynamic to support useSearchParams
export const dynamic = 'force-dynamic';

export default function HandLetteringPage() {
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
              {t.handLettering.subtitle}
            </p>
            <h1 className="text-6xl lg:text-7xl font-serif font-medium text-indigo mb-6">
              {t.handLettering.title}
            </h1>
            <div className="w-24 h-1 bg-ochre mx-auto mb-8"></div>
            <p className="text-lg text-graphite max-w-2xl mx-auto leading-relaxed font-light">
              {t.handLettering.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-warmIvory border border-warmOchre/20 p-10"
            >
              <div className="mb-6">
                <svg className="w-12 h-12 text-warmOchre" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                  <path d="M2 2l7.586 7.586"/>
                </svg>
              </div>
              <h2 className="text-3xl font-serif text-deepIndigo mb-4">
                Uppdrag Handtextning
              </h2>
              <div className="w-16 h-1 bg-warmOchre mb-6"></div>
              <p className="text-softCharcoal leading-relaxed mb-6">
                Professional hand lettering for special projects, invitations, logos, and custom designs. 
                Each piece is carefully crafted with attention to detail and artistic flair.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-warmOchre flex-shrink-0 mt-0.5" />
                  <span>Wedding invitations</span>
                </li>
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-warmOchre flex-shrink-0 mt-0.5" />
                  <span>Event signage</span>
                </li>
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-warmOchre flex-shrink-0 mt-0.5" />
                  <span>Logo design</span>
                </li>
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-warmOchre flex-shrink-0 mt-0.5" />
                  <span>Custom artwork</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-cream border border-mutedRose/20 p-10"
            >
              <div className="mb-6">
                <svg className="w-12 h-12 text-mutedRose" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <h2 className="text-3xl font-serif text-deepIndigo mb-4">
                Distansutbildning i Reklamtexning
              </h2>
              <div className="w-16 h-1 bg-mutedRose mb-6"></div>
              <p className="text-softCharcoal leading-relaxed mb-6">
                Distance learning course in commercial hand lettering. Learn the art of beautiful 
                handwriting and calligraphy from anywhere.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-mutedRose flex-shrink-0 mt-0.5" />
                  <span>Online instruction</span>
                </li>
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-mutedRose flex-shrink-0 mt-0.5" />
                  <span>Flexible schedule</span>
                </li>
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-mutedRose flex-shrink-0 mt-0.5" />
                  <span>Personal feedback</span>
                </li>
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-mutedRose flex-shrink-0 mt-0.5" />
                  <span>Certificate upon completion</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section className="py-24 bg-warmIvory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-medium text-deepIndigo mb-6">
              Our Calligraphy Designs
            </h2>
            <div className="w-24 h-1 bg-warmOchre mx-auto mb-8"></div>
            <p className="text-softCharcoal leading-relaxed max-w-3xl mx-auto">
              Tanja Unlimited prints our own designs, which we then tailor or transform into high-quality 
              products. The motifs are mainly taken from Tanja Kisker's calligraphy. These designs can be found on:
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: 'Blouses & Tunics', color: 'warmOchre' },
              { title: 'Handbags', color: 'mutedRose' },
              { title: 'Phone & iPad Cases', color: 'terracotta' },
              { title: 'Scarves & Pillows', color: 'sage' }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-ivory border border-warmOchre/20 p-8 text-center hover:border-warmOchre transition-all duration-300"
              >
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gradient-textile">
                  <div className={`w-8 h-8 border-2 border-${item.color}`}></div>
                </div>
                <p className="font-serif text-deepIndigo">{item.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="relative py-24 bg-deepIndigo text-ivory overflow-hidden">
        <div className="absolute inset-0 pattern-quilted opacity-20"></div>
        
        <div className="relative max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h3 className="text-4xl font-serif font-medium mb-6">
              Interested in Hand Lettering Services?
            </h3>
            <p className="text-warmIvory/80 text-lg mb-12 leading-relaxed max-w-2xl mx-auto">
              Contact Tanja Kisker to discuss your project or enroll in our distance learning course
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="tel:+46706332220" 
                className="inline-flex items-center gap-3 px-8 py-4 bg-warmOchre text-deepIndigo hover:bg-antiqueGold transition-all duration-300 font-medium"
              >
                <Phone className="w-5 h-5" />
                <span>Call +46 70 633 22 20</span>
              </a>
              <a 
                href="mailto:info@tanjaunlimited.se" 
                className="inline-flex items-center gap-3 px-8 py-4 border-2 border-ivory text-ivory hover:bg-ivory hover:text-deepIndigo transition-all duration-300 font-medium"
              >
                <Mail className="w-5 h-5" />
                <span>Email Us</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
