'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, Globe, CheckCircle } from 'lucide-react';

// Mark as dynamic to support client-side rendering
export const dynamic = 'force-dynamic';

export default function PressPage() {
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
              Media & Communications
            </p>
            <h1 className="text-6xl lg:text-7xl font-serif font-medium text-deepIndigo mb-6">
              Press & Media
            </h1>
            <div className="w-24 h-1 bg-warmOchre mx-auto"></div>
          </motion.div>
        </div>
      </section>

      {/* Media Contact */}
      <section className="py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-cream border border-warmOchre/20 p-10"
            >
              <h2 className="text-3xl font-serif text-deepIndigo mb-6">Media Contact</h2>
              <p className="text-softCharcoal leading-relaxed mb-8">
                For press inquiries, interviews, or media collaborations, please contact:
              </p>
              
              <div className="bg-ivory border-l-2 border-warmOchre p-8">
                <p className="text-xl font-serif text-deepIndigo mb-2">Tanja Kisker</p>
                <p className="text-softCharcoal mb-6">Founder & Creative Director</p>
                
                <div className="space-y-3">
                  <a 
                    href="mailto:info@tanjaunlimited.se" 
                    className="flex items-center gap-3 text-softCharcoal hover:text-warmOchre transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span>info@tanjaunlimited.se</span>
                  </a>
                  <a 
                    href="tel:+46706332220" 
                    className="flex items-center gap-3 text-softCharcoal hover:text-warmOchre transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    <span>+46 70 633 22 20</span>
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-warmIvory border border-warmOchre/20 p-10"
            >
              <h3 className="text-2xl font-serif text-deepIndigo mb-6">About Tanja Unlimited</h3>
              <div className="space-y-4 text-softCharcoal leading-relaxed">
                <p>
                  Tanja Unlimited creates unique, sustainable fashion from handcrafted textiles sourced from 
                  Rajasthan, India. Each piece tells a story, transforming antique camel blankets and wedding 
                  saris into modern, reversible jackets and designer garments.
                </p>
                <p>
                  Founded by Swedish designer and calligrapher Tanja Kisker, the brand bridges traditional 
                  Indian craftsmanship with Scandinavian design sensibility, creating one-of-a-kind pieces 
                  that celebrate cultural heritage and sustainability.
                </p>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: 'International Presence', desc: 'Showcased at major European trade fairs and exhibitions', color: 'warmOchre', icon: Globe },
                { title: 'SCCI Member', desc: 'Swedish Chamber of Commerce India member', color: 'mutedRose', icon: CheckCircle },
                { title: 'Sustainable', desc: 'Upcycling antique textiles into modern fashion', color: 'terracotta', icon: CheckCircle },
                { title: 'Handcrafted', desc: 'Each piece individually made by skilled artisans', color: 'sage', icon: CheckCircle }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-cream border border-warmOchre/20 p-6"
                >
                  <div className="mb-4">
                    <item.icon className={`w-6 h-6 text-${item.color}`} />
                  </div>
                  <h4 className="text-lg font-serif text-deepIndigo mb-2">{item.title}</h4>
                  <p className="text-sm text-softCharcoal">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
