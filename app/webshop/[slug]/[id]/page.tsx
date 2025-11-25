'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Heart, Share2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getCategoryBySlug, getProductById, formatPrice } from '@/lib/products';
import BuyNowButton from '@/components/BuyNowButton';
import CampaignBadge from '@/components/CampaignBadge';
import StockStatus from '@/components/StockStatus';
import { use } from 'react';

// Mark as dynamic to support client-side rendering
export const dynamic = 'force-dynamic';

export default function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string; id: string }> 
}) {
  const { slug, id } = use(params);
  const category = getCategoryBySlug(slug);
  const product = getProductById(id);
  const [campaignPrice, setCampaignPrice] = useState<number | null>(null);

  if (!product || !category) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-deepIndigo mb-4">Product Not Found</h1>
          <Link href="/webshop" className="text-warmOchre hover:text-deepIndigo">
            ← Back to Webshop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Breadcrumb */}
      <section className="py-6 bg-warmIvory border-b border-warmOchre/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-3 text-sm text-softCharcoal">
            <Link href="/webshop" className="hover:text-warmOchre transition-colors">
              Webshop
            </Link>
            <span>/</span>
            <Link href={`/webshop/${slug}`} className="hover:text-warmOchre transition-colors">
              {category.name}
            </Link>
            <span>/</span>
            <span className="text-warmOchre">{product.name}</span>
          </div>
        </div>
      </section>

      {/* Product Detail */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <Link 
            href={`/webshop/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-warmOchre hover:text-deepIndigo transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {category.name}</span>
          </Link>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="relative aspect-square border border-ochre/20 overflow-hidden bg-warmIvory">
                {/* Sale Badge */}
                {product.salePrice && (
                  <div className="absolute top-6 right-6 px-4 py-2 bg-terracotta text-ivory text-sm uppercase tracking-widest font-medium z-10">
                    On Sale
                  </div>
                )}
                
                {/* Product Image or Placeholder */}
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-textile pattern-quilted flex items-center justify-center">
                    <div className="text-ochre/20">
                      <svg className="w-48 h-48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              {/* Title */}
              <div>
                <h1 className="text-4xl lg:text-5xl font-serif font-medium text-deepIndigo mb-6">
                  {product.name}
                </h1>
                
                {/* Campaign Badge & Price (if campaign exists) */}
                {/* API automatically handles variant detection - campaigns will show if they exist */}
                <CampaignBadge 
                  productId={product.id}
                  defaultPrice={product.price}
                  currency={product.currency || 'SEK'}
                  onCampaignFound={setCampaignPrice}
                />
                
                {/* Regular Price Display (if no campaign) */}
                {!campaignPrice && (
                  <div className="flex items-baseline gap-3 mb-6">
                    {product.salePrice ? (
                      <>
                        <span className="text-4xl font-serif text-terracotta">
                          {formatPrice(product.salePrice, product.currency)}
                        </span>
                        <span className="text-2xl text-softCharcoal/50 line-through">
                          {formatPrice(product.price, product.currency)}
                        </span>
                        <span className="px-3 py-1 bg-terracotta/10 text-terracotta text-sm font-medium">
                          Save {formatPrice(product.price - product.salePrice, product.currency)}
                        </span>
                      </>
                    ) : (
                      <span className="text-4xl font-serif text-deepIndigo">
                        {formatPrice(product.price, product.currency)}
                      </span>
                    )}
                  </div>
                )}

                {/* Stock Status */}
                <div className="mt-6">
                  <StockStatus productId={product.id} />
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="border-t border-warmOchre/20 pt-6">
                  <h3 className="text-lg font-serif text-deepIndigo mb-3">Description</h3>
                  <p className="text-softCharcoal leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Features */}
              <div className="border-t border-warmOchre/20 pt-6">
                <h3 className="text-lg font-serif text-deepIndigo mb-4">Product Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-warmOchre flex-shrink-0 mt-0.5" />
                    <span className="text-softCharcoal">Hand-crafted by skilled artisans</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-warmOchre flex-shrink-0 mt-0.5" />
                    <span className="text-softCharcoal">One-of-a-kind unique piece</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-warmOchre flex-shrink-0 mt-0.5" />
                    <span className="text-softCharcoal">Sustainable & eco-friendly</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-warmOchre flex-shrink-0 mt-0.5" />
                    <span className="text-softCharcoal">Made from antique textiles</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="border-t border-ochre/20 pt-6 space-y-4">
                {product.stripePriceId ? (
                  <>
                    <BuyNowButton product={product} />
                    <p className="text-xs text-graphite/60 text-center">
                      Secure checkout powered by Stripe
                    </p>
                  </>
                ) : (
                  <>
                    <a 
                      href="tel:+46706332220"
                      className="flex items-center justify-center gap-3 w-full px-8 py-4 bg-indigo text-ivory hover:bg-indigoDeep transition-all duration-300 font-medium"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Call to Order</span>
                    </a>
                    
                    <a 
                      href="mailto:info@tanjaunlimited.se"
                      className="flex items-center justify-center gap-3 w-full px-8 py-4 border-2 border-indigo text-indigo hover:bg-indigo hover:text-ivory transition-all duration-300 font-medium"
                    >
                      <span>Email for Details</span>
                    </a>
                  </>
                )}

                <div className="flex gap-4">
                  <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-warmOchre/20 text-softCharcoal hover:border-warmOchre hover:text-warmOchre transition-all duration-300">
                    <Heart className="w-5 h-5" />
                    <span>Add to Wishlist</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-warmOchre/20 text-softCharcoal hover:border-warmOchre hover:text-warmOchre transition-all duration-300">
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-warmIvory border border-warmOchre/20 p-6">
                <h4 className="font-serif text-deepIndigo mb-3">Shipping & Returns</h4>
                <ul className="space-y-2 text-sm text-softCharcoal">
                  <li>• Free shipping on orders over SEK 1,000</li>
                  <li>• 14-day return policy</li>
                  <li>• International shipping available</li>
                  <li>• Contact us for custom orders</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative py-16 bg-deepIndigo text-ivory overflow-hidden">
        <div className="absolute inset-0 pattern-quilted opacity-20"></div>
        
        <div className="relative max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h3 className="text-2xl font-serif font-medium mb-4">
            Ready to Purchase?
          </h3>
          <p className="text-warmIvory/80 mb-8">
            Contact us to complete your order or for any questions
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="tel:+46706332220" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-warmOchre text-deepIndigo hover:bg-antiqueGold transition-all duration-300 font-medium"
            >
              <span>Call: +46 70 633 22 20</span>
            </a>
            <a 
              href="https://wa.me/46706332220" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-ivory text-ivory hover:bg-ivory hover:text-deepIndigo transition-all duration-300 font-medium"
            >
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

