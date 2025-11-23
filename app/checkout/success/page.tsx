'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { trackEvent } from '@/components/AnalyticsProvider';

// Mark as dynamic to support useSearchParams
export const dynamic = 'force-dynamic';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [purchaseTracked, setPurchaseTracked] = useState(false);

  useEffect(() => {
    // Track purchase event when page loads
    if (sessionId && !purchaseTracked) {
      // Track purchase event - customer portal will match with payment data from Stripe webhooks
      trackEvent('purchase', {
        order_id: sessionId,
        // Amount and items will be matched from Stripe webhook data in customer portal
        // We track the purchase event here so it appears in analytics
      });
      setPurchaseTracked(true);
    }
  }, [sessionId, purchaseTracked]);

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 lg:px-12 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-8 flex items-center justify-center bg-sage/10 rounded-full">
            <CheckCircle className="w-16 h-16 text-sage" />
          </div>

          <h1 className="text-5xl font-serif font-medium text-indigo mb-6">
            Thank You for Your Order!
          </h1>
          
          <div className="w-24 h-1 bg-ochre mx-auto mb-8"></div>
          
          <p className="text-lg text-graphite leading-relaxed mb-6 font-light">
            Your order has been successfully placed. We'll send you a confirmation email shortly 
            with all the details.
          </p>
          
          <p className="text-graphite mb-12 font-light">
            Since each Tanja Unlimited piece is unique and handcrafted, we'll be in touch within 
            24 hours to confirm availability and arrange delivery.
          </p>

          <div className="bg-cream border border-ochre/20 p-8 mb-12">
            <h3 className="text-xl font-serif text-indigo mb-4">What Happens Next?</h3>
            <ul className="space-y-3 text-left text-graphite font-light">
              <li className="flex items-start gap-3">
                <span className="text-ochre mt-1">1.</span>
                <span>You'll receive an order confirmation email</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-ochre mt-1">2.</span>
                <span>Tanja will personally confirm your unique piece</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-ochre mt-1">3.</span>
                <span>We'll arrange shipping or collection</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-ochre mt-1">4.</span>
                <span>Your one-of-a-kind treasure arrives!</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/webshop"
              className="inline-flex items-center gap-3 btn-primary"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/"
              className="inline-flex items-center gap-3 btn-secondary"
            >
              <span>Return to Homepage</span>
            </Link>
          </div>

          <p className="mt-12 text-sm text-graphite/60">
            Questions? Contact Tanja: <a href="tel:+46706332220" className="text-ochre hover:text-clay">+46 70 633 22 20</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

