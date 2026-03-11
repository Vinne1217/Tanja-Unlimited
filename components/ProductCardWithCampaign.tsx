'use client';

import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/products';
// Removed useCampaignPrice import - now using server-injected variant.campaignPrice
import { formatSubscriptionInfo } from '@/lib/subscription';
import { useSubscriptionDetection } from '@/lib/useSubscriptionDetection';

// ✅ Proxy images through our API to bypass CORS issues
const getProxiedImageUrl = (url: string) => {
  if (!url) return url;
  if (url.includes('/api/images/proxy')) return url;
  if (url.includes('source-database-809785351172.europe-north1.run.app')) {
    return `/api/images/proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

type Variant = {
  stripePriceId?: string;
  price?: number; // Base price in SEK (legacy)
  // New pricing engine fields (all in SEK)
  originalPrice?: number;
  campaignPrice?: number;
  finalPrice?: number;
};

type Product = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  currency: string;
  salePrice?: number;
  inStock?: boolean;
  category?: string;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
  type?: 'one_time' | 'subscription';
  subscription?: { interval: string; intervalCount: number };
  variants?: Variant[];
};

type ProductCardWithCampaignProps = {
  product: Product;
  slug: string;
  idx: number;
};

export default function ProductCardWithCampaign({ product, slug, idx }: ProductCardWithCampaignProps) {
  // Välj primär variant för pris/kampanj (samma logik som på serversidan)
  const variants = product.variants || [];
  const primaryVariant =
    variants.length > 0
      ? variants.reduce((best, v) => {
          const bestPrice = best?.finalPrice ?? best?.campaignPrice ?? best?.price ?? Number.POSITIVE_INFINITY;
          const currentPrice = v.finalPrice ?? v.campaignPrice ?? v.price ?? Number.POSITIVE_INFINITY;
          return currentPrice < bestPrice ? v : best;
        }, variants[0])
      : undefined;

  const basePrice =
    primaryVariant?.originalPrice ??
    primaryVariant?.price ??
    product.price;

  // Use new pricing engine fields with correct fallback order
  const variantFinalPrice = primaryVariant?.finalPrice;
  const variantCampaignPrice = primaryVariant?.campaignPrice;
  const displayPrice =
    variantFinalPrice ??
    variantCampaignPrice ??
    basePrice;

  const hasCampaign = displayPrice !== undefined && basePrice !== undefined && displayPrice < basePrice;

  const discountPercent = hasCampaign && basePrice && basePrice > 0
    ? Math.round(((basePrice - displayPrice) / basePrice) * 100)
    : undefined;

  // Use subscription detection with Stripe Price fallback
  const { subscriptionInfo: detectedSubscriptionInfo } = useSubscriptionDetection(
    product,
    product.stripePriceId ?? undefined
  );

  return (
    <motion.div
      key={product.id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: idx * 0.1 }}
      className="group"
    >
      <div className="bg-warmIvory border border-ochre/20 hover:border-ochre transition-all duration-500 overflow-hidden h-full flex flex-col">
        {/* Product Image */}
        <div className="relative h-80 bg-warmIvory overflow-hidden">
          {product.image ? (
            <img 
              src={getProxiedImageUrl(product.image)} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                console.error('❌ Category page image error:', {
                  src: product.image,
                  proxied: product.image ? getProxiedImageUrl(product.image) : 'no image',
                  productId: product.id
                });
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-textile pattern-quilted flex items-center justify-center group-hover:bg-ochre/5 transition-all duration-500">
              <div className="text-ochre/20 group-hover:text-ochre/30 transition-colors">
                <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
              </div>
            </div>
          )}
          
          {/* Subscription Badge - Show if detected via API or Stripe Price fallback */}
          {(product.type === 'subscription' || detectedSubscriptionInfo) && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-indigo text-ivory text-xs uppercase tracking-widest font-medium z-10">
              Prenumeration
            </div>
          )}
          
          {/* Campaign/Sale Badge */}
          {product.type !== 'subscription' && (hasCampaign || product.salePrice) && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-terracotta text-ivory text-xs uppercase tracking-widest font-medium z-10">
              {discountPercent ? `${discountPercent}% OFF` : 'Sale'}
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6 bg-cream flex-1 flex flex-col">
          <h3 className="text-xl font-serif text-indigo mb-3 group-hover:text-ochre transition-colors">
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-sm text-graphite leading-relaxed mb-4 flex-1 font-light">
              {product.description}
            </p>
          )}
          
          <div className="mt-auto">
            <div className="flex items-baseline gap-2 mb-4">
              {(() => {
                // Check if this is a subscription product (use detected info with fallback)
                const subscriptionInfo = detectedSubscriptionInfo || formatSubscriptionInfo(product);
                if (subscriptionInfo) {
                  return (
                    <span className="text-2xl font-serif text-indigo">
                      {subscriptionInfo}
                    </span>
                  );
                }

              // Regular product pricing med kampanjstöd (using server-injected campaignPrice)
              const finalPrice = displayPrice;

              console.log('Price render (ProductCardWithCampaign)', {
                productId: product.id,
                basePrice,
                campaignPrice: variantCampaignPrice,
                finalPrice,
              });

              if (hasCampaign && typeof variantCampaignPrice === 'number') {
                  return (
                    <>
                      <span className="text-2xl font-serif text-terracotta">
                        {formatPrice(finalPrice, product.currency)}
                      </span>
                      <span className="text-lg text-graphite/50 line-through">
                        {formatPrice(basePrice, product.currency)}
                      </span>
                    </>
                  );
                } else if (product.salePrice) {
                  return (
                    <>
                      <span className="text-2xl font-serif text-terracotta">
                        {formatPrice(product.salePrice, product.currency)}
                      </span>
                      <span className="text-lg text-graphite/50 line-through">
                        {formatPrice(product.price, product.currency)}
                      </span>
                    </>
                  );
                } else {
                  return (
                    <span className="text-2xl font-serif text-indigo">
                      {formatPrice(displayPrice, product.currency)}
                    </span>
                  );
                }
              })()}
            </div>
            
            <Link
              href={`/webshop/${slug}/${product.id}`}
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo text-ivory hover:bg-indigoDeep transition-all duration-300 font-medium"
            >
              <span>{(product.type === 'subscription' || detectedSubscriptionInfo) ? 'Prenumerera' : 'View Details'}</span>
              <ShoppingCart className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

