'use client';

import ContactForm from '@/components/ContactForm';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

export default function ContactPage() {
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
              {t.contact.subtitle}
            </p>
            <h1 className="text-6xl lg:text-7xl font-serif font-medium text-indigo mb-6">
              {t.contact.title}
            </h1>
            <div className="w-24 h-1 bg-ochre mx-auto mb-8"></div>
            <p className="text-lg text-graphite max-w-2xl mx-auto leading-relaxed font-light">
              {t.contact.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-10"
            >
              <div>
                <h2 className="text-3xl font-serif text-deepIndigo mb-8">
                  Contact Information
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-warmOchre/10">
                      <Phone className="w-6 h-6 text-warmOchre" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-deepIndigo mb-2">Phone</h3>
                      <a href="tel:+46706332220" className="text-softCharcoal hover:text-warmOchre transition-colors">
                        +46 70 633 22 20
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-mutedRose/10">
                      <Mail className="w-6 h-6 text-mutedRose" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-deepIndigo mb-2">Email</h3>
                      <a href="mailto:info@tanjaunlimited.se" className="text-softCharcoal hover:text-warmOchre transition-colors">
                        info@tanjaunlimited.se
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-terracotta/10">
                      <MapPin className="w-6 h-6 text-terracotta" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-deepIndigo mb-2">Address</h3>
                      <p className="text-softCharcoal leading-relaxed">
                        Molinsgatan 13<br />
                        411 33 Göteborg<br />
                        Sweden
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-cream border border-warmOchre/20 p-8">
                <h3 className="text-xl font-serif text-deepIndigo mb-4">Opening Hours</h3>
                <p className="text-softCharcoal leading-relaxed">
                  By appointment only. Please contact us to schedule your visit at a time that works for you.
                </p>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-warmIvory border border-warmOchre/20 p-10"
            >
              <h2 className="text-2xl font-serif text-deepIndigo mb-6">Send Us a Message</h2>
              <ContactForm />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
