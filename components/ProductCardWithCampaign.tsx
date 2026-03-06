'use client';

import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/products';
import { useCampaignPrice } from '@/lib/useCampaignPrice';
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
  variants?: {
    stripePriceId?: string;
    price?: number;
  }[];
};

type ProductCardWithCampaignProps = {
  product: Product;
  slug: string;
  idx: number;
};

export default function ProductCardWithCampaign({ product, slug, idx }: ProductCardWithCampaignProps) {
  // Debug: log exactly what this card receives from the client component
  console.log('PRODUCT CARD RECEIVED', {
    id: product.id,
    stripeProductId: product.stripeProductId,
    variantCount: product.variants?.length,
    firstVariantStripePriceId: product.variants?.[0]?.stripePriceId
  });

  // Välj primär variant för pris/kampanj (samma logik som på serversidan)
  const variants = product.variants || [];
  const primaryVariant =
    variants.length > 0
      ? variants.reduce((best, v) => {
          const bestPrice = best?.price ?? Number.POSITIVE_INFINITY;
          const currentPrice = v.price ?? Number.POSITIVE_INFINITY;
          return currentPrice < bestPrice ? v : best;
        }, variants[0])
      : undefined;

  const displayBasePrice = primaryVariant?.price ?? product.price;

  // Fetch campaign price for this product
  // CRITICAL: Use stripeProductId if available (Stripe Product ID like "prod_...")
  // Only fall back to product.id (baseSku/slug) if stripeProductId is missing
  const productIdForCampaign = product.stripeProductId || product.id;
  
  // CRITICAL: Use variant's stripePriceId if available (Stripe Price ID like "price_...")
  // This must match the originalPriceId that campaigns are linked to
  const variantPriceIdForCampaign = primaryVariant?.stripePriceId || product.stripePriceId;

  console.log(`🎨 ProductCardWithCampaign: Product ${product.id}`, {
    stripeProductId: product.stripeProductId,
    productIdForCampaign,
    price: product.price,
    displayBasePrice,
    stripePriceId: product.stripePriceId,
    variantPriceIdForCampaign,
    primaryVariantStripePriceId: primaryVariant?.stripePriceId,
    hasVariants: variants.length,
    variantCount: variants.length,
    allVariantStripePriceIds: variants.map(v => v.stripePriceId).filter(Boolean),
    type: product.type,
    subscription: product.subscription
  });
  
  // Warn if we're using fallback IDs (not Stripe IDs)
  if (!product.stripeProductId || !product.stripeProductId.startsWith('prod_')) {
    console.warn(`⚠️ ProductCardWithCampaign: Product ${product.id} missing valid stripeProductId (prod_...), using fallback: ${productIdForCampaign}`);
  }
  if (!variantPriceIdForCampaign || !variantPriceIdForCampaign.startsWith('price_')) {
    console.warn(`⚠️ ProductCardWithCampaign: Product ${product.id} missing valid stripePriceId (price_...), campaign lookup may fail`);
  }
  
  const campaignPrice = useCampaignPrice(
    productIdForCampaign,
    displayBasePrice,
    variantPriceIdForCampaign
  );

  console.log('💰 ProductCardWithCampaign: campaignPrice for', product.id, campaignPrice);
  
  // Use subscription detection with Stripe Price fallback
  const { subscriptionInfo: detectedSubscriptionInfo } = useSubscriptionDetection(
    product,
    product.stripePriceId
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
          {product.type !== 'subscription' && (campaignPrice.hasCampaign || product.salePrice) && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-terracotta text-ivory text-xs uppercase tracking-widest font-medium z-10">
              {campaignPrice.discountPercent ? `${campaignPrice.discountPercent}% OFF` : 'Sale'}
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

              // Regular product pricing med kampanjstöd
              if (campaignPrice.hasCampaign && typeof campaignPrice.campaignPrice === 'number') {
                console.log('💰 ProductCardWithCampaign: rendering CAMPAIGN price for', product.id, {
                  campaignPrice: campaignPrice.campaignPrice,
                  originalPrice: campaignPrice.originalPrice,
                  discountPercent: campaignPrice.discountPercent,
                });
                  return (
                    <>
                      <span className="text-2xl font-serif text-terracotta">
                        {formatPrice(campaignPrice.campaignPrice, product.currency)}
                      </span>
                      <span className="text-lg text-graphite/50 line-through">
                        {formatPrice(campaignPrice.originalPrice, product.currency)}
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
                      {formatPrice(displayBasePrice, product.currency)}
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

