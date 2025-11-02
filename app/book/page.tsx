'use client';

import ContactForm from '@/components/ContactForm';
import { motion } from 'framer-motion';
import { Calendar, Sparkles, Phone, CheckCircle } from 'lucide-react';

export default function BookPage() {
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
              Private Appointments
            </p>
            <h1 className="text-6xl lg:text-7xl font-serif font-medium text-deepIndigo mb-6">
              Book an Appointment
            </h1>
            <div className="w-24 h-1 bg-warmOchre mx-auto mb-8"></div>
            <p className="text-lg text-softCharcoal max-w-2xl mx-auto leading-relaxed">
              Schedule a private viewing, atelier visit, or consultation with Tanja Kisker
            </p>
          </motion.div>
        </div>
      </section>

      {/* Service Options */}
      <section className="py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-warmIvory border border-warmOchre/20 p-10"
            >
              <div className="mb-6">
                <Calendar className="w-12 h-12 text-warmOchre" />
              </div>
              <h2 className="text-3xl font-serif text-deepIndigo mb-4">
                Private Viewing
              </h2>
              <div className="w-16 h-1 bg-warmOchre mb-6"></div>
              <p className="text-softCharcoal leading-relaxed mb-6">
                Book a private appointment to see our collection in person at our Göteborg atelier
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-warmOchre flex-shrink-0 mt-0.5" />
                  <span>One-on-one attention</span>
                </li>
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-warmOchre flex-shrink-0 mt-0.5" />
                  <span>Try on garments</span>
                </li>
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-warmOchre flex-shrink-0 mt-0.5" />
                  <span>Expert styling advice</span>
                </li>
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-warmOchre flex-shrink-0 mt-0.5" />
                  <span>Flexible scheduling</span>
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
                <Sparkles className="w-12 h-12 text-mutedRose" />
              </div>
              <h2 className="text-3xl font-serif text-deepIndigo mb-4">
                Consultation
              </h2>
              <div className="w-16 h-1 bg-mutedRose mb-6"></div>
              <p className="text-softCharcoal leading-relaxed mb-6">
                Discuss custom orders, hand lettering projects, or special commissions
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-mutedRose flex-shrink-0 mt-0.5" />
                  <span>Custom designs</span>
                </li>
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-mutedRose flex-shrink-0 mt-0.5" />
                  <span>Bespoke tailoring</span>
                </li>
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-mutedRose flex-shrink-0 mt-0.5" />
                  <span>Calligraphy projects</span>
                </li>
                <li className="flex items-start gap-3 text-softCharcoal">
                  <CheckCircle className="w-5 h-5 text-mutedRose flex-shrink-0 mt-0.5" />
                  <span>Corporate orders</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Booking Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-warmIvory border border-warmOchre/20 p-10">
              <h3 className="text-2xl font-serif text-deepIndigo mb-6 text-center">
                Request a Booking
              </h3>
              <ContactForm />
              <p className="text-center text-sm text-softCharcoal mt-6">
                Or call/WhatsApp directly:{' '}
                <a href="tel:+46706332220" className="text-warmOchre font-medium hover:text-deepIndigo transition-colors">
                  +46 70 633 22 20
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Opening Hours CTA */}
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
              Opening Hours
            </h3>
            <p className="text-warmIvory/80 text-lg mb-6">
              By appointment only
            </p>
            <p className="text-warmIvory/60 leading-relaxed max-w-2xl mx-auto">
              Contact us to schedule your visit at a time that works for you. We're flexible and happy 
              to accommodate your schedule.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
