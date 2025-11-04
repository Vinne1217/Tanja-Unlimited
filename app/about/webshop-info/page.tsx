'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, FileText, CreditCard, RotateCcw } from 'lucide-react';

// Mark as dynamic to support client-side rendering
export const dynamic = 'force-dynamic';

export default function WebshopInfoPage() {
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
              Terms & Conditions
            </p>
            <h1 className="text-6xl lg:text-7xl font-serif font-medium text-deepIndigo mb-6">
              Webshop Information
            </h1>
            <div className="w-24 h-1 bg-warmOchre mx-auto"></div>
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 bg-ivory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { href: '#terms', icon: FileText, title: 'Villkor & Information', color: 'warmOchre' },
              { href: '#payment', icon: CreditCard, title: 'Betalningsmetoder', color: 'mutedRose' },
              { href: '#returns', icon: RotateCcw, title: 'Returer', color: 'terracotta' }
            ].map((item, idx) => (
              <motion.a
                key={idx}
                href={item.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group bg-cream border border-warmOchre/20 p-8 text-center hover:border-warmOchre hover:shadow-lg transition-all duration-300"
              >
                <item.icon className={`w-10 h-10 text-${item.color} mx-auto mb-4 group-hover:text-deepIndigo transition-colors`} />
                <h3 className="text-lg font-serif text-deepIndigo">{item.title}</h3>
              </motion.a>
            ))}
          </div>

          {/* Terms & Information */}
          <motion.div
            id="terms"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto mb-16 bg-warmIvory border border-warmOchre/20 p-10"
          >
            <div className="mb-6">
              <FileText className="w-10 h-10 text-warmOchre" />
            </div>
            <h2 className="text-3xl font-serif text-deepIndigo mb-6">Villkor & Information</h2>
            <div className="space-y-4 text-softCharcoal leading-relaxed">
              <p>
                All items in our webshop are unique, handcrafted pieces. Due to the nature of upcycled 
                materials, each product is one-of-a-kind and may vary slightly from photos.
              </p>
              <ul className="space-y-3 ml-6">
                <li className="flex items-start gap-3">
                  <span className="text-warmOchre mt-1">—</span>
                  <span>All prices are in SEK and include Swedish VAT</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-warmOchre mt-1">—</span>
                  <span>Orders are processed within 1-3 business days</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-warmOchre mt-1">—</span>
                  <span>Shipping times vary by destination</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-warmOchre mt-1">—</span>
                  <span>For custom orders, please allow additional time</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Payment Methods */}
          <motion.div
            id="payment"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto mb-16 bg-cream border border-mutedRose/20 p-10"
          >
            <div className="mb-6">
              <CreditCard className="w-10 h-10 text-mutedRose" />
            </div>
            <h2 className="text-3xl font-serif text-deepIndigo mb-6">Betalningsmetoder</h2>
            <p className="text-softCharcoal leading-relaxed mb-8">
              We accept the following payment methods for your convenience:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Credit/Debit Cards', desc: 'Visa, Mastercard, American Express' },
                { title: 'Bank Transfer', desc: 'Direct bank transfer available' },
                { title: 'Swish', desc: 'Swedish mobile payment' },
                { title: 'Invoice', desc: 'Available for Swedish customers' }
              ].map((method, idx) => (
                <div key={idx} className="bg-ivory border border-mutedRose/10 p-6">
                  <p className="font-serif text-deepIndigo mb-2">{method.title}</p>
                  <p className="text-sm text-softCharcoal">{method.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Returns */}
          <motion.div
            id="returns"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto bg-warmIvory border border-terracotta/20 p-10"
          >
            <div className="mb-6">
              <RotateCcw className="w-10 h-10 text-terracotta" />
            </div>
            <h2 className="text-3xl font-serif text-deepIndigo mb-6">Returer</h2>
            <p className="text-softCharcoal leading-relaxed mb-6">
              We want you to be completely satisfied with your purchase. If you need to return an item:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-softCharcoal">
                <span className="text-terracotta mt-1">—</span>
                <span>14-day return policy from delivery date</span>
              </li>
              <li className="flex items-start gap-3 text-softCharcoal">
                <span className="text-terracotta mt-1">—</span>
                <span>Items must be unworn and in original condition</span>
              </li>
              <li className="flex items-start gap-3 text-softCharcoal">
                <span className="text-terracotta mt-1">—</span>
                <span>
                  Contact us before returning:{' '}
                  <a href="mailto:info@tanjaunlimited.se" className="text-terracotta font-medium hover:text-deepIndigo transition-colors">
                    info@tanjaunlimited.se
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3 text-softCharcoal">
                <span className="text-terracotta mt-1">—</span>
                <span>Return shipping costs are the customer's responsibility</span>
              </li>
              <li className="flex items-start gap-3 text-softCharcoal">
                <span className="text-terracotta mt-1">—</span>
                <span>Refunds processed within 7 days of receiving return</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Contact CTA */}
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
              Questions?
            </h3>
            <p className="text-warmIvory/80 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
              Contact us for any questions about orders, shipping, or returns
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="tel:+46706332220" 
                className="inline-flex items-center gap-3 px-8 py-4 bg-warmOchre text-deepIndigo hover:bg-antiqueGold transition-all duration-300 font-medium"
              >
                <Phone className="w-5 h-5" />
                <span>+46 70 633 22 20</span>
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
