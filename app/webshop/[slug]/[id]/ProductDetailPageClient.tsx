'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Heart, Share2, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/products';
import { formatPrice } from '@/lib/products';
import { formatSubscriptionInfo, getSubscriptionIntervalDescription } from '@/lib/subscription';
import BuyNowButton from '@/components/BuyNowButton';
import CampaignBadge from '@/components/CampaignBadge';
import StockStatus from '@/components/StockStatus';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
};

export default function ProductDetailPageClient({
  product,
  category,
  slug
}: {
  product: Product;
  category: Category;
  slug: string;
}) {
  const [campaignPrice, setCampaignPrice] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0); // ✅ Add state for selected image
  
  // Filter variants to only those with sizes (matching BuyNowButton logic)
  const sizeVariants = product.variants?.filter(v => v.size) || [];
  const hasMultipleSizes = sizeVariants.length > 1;
  
  // Initialize selectedVariant: if multiple sizes, start with null (user must select)
  // If single size or no sizes, auto-select first variant
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    hasMultipleSizes ? null : (sizeVariants[0]?.key || product.variants?.[0]?.key || null)
  );
  
  // Get selected variant's price ID for campaign badge
  const selectedVariantData = product.variants?.find(v => v.key === selectedVariant);
  const variantPriceId = selectedVariantData?.stripePriceId;
  
  // Get images array (fallback to single image for backward compatibility)
  const images = product.images && product.images.length > 0 
    ? product.images 
    : product.image 
      ? [product.image] 
      : [];
  
  // ✅ Proxy images through our API to bypass CORS issues
  // Source Portal's /storefront/images/ endpoint exists but doesn't send CORS headers yet
  const getProxiedImageUrl = (url: string) => {
    if (!url) return url;
    // If it's already a proxy URL, return as-is
    if (url.includes('/api/images/proxy')) return url;
    // If it's from Source Portal, proxy it to bypass CORS
    if (url.includes('source-database-809785351172.europe-north1.run.app')) {
      return `/api/images/proxy?url=${encodeURIComponent(url)}`;
    }
    // Otherwise return as-is
    return url;
  };
  
  const proxiedImages = images.map(getProxiedImageUrl);
  const mainImage = proxiedImages[selectedImageIndex] || proxiedImages[0];
  
  // ✅ Add image loading diagnostics
  useEffect(() => {
    console.log('🖼️ ProductDetailPageClient: useEffect triggered', {
      productImages: product.images,
      productImage: product.image,
      imagesArray: images,
      proxiedImages,
      mainImage,
      imageCount: images.length,
      selectedImageIndex
    });
    
    // Test if images are accessible (using proxied URL to bypass CORS)
    if (proxiedImages.length > 0 && proxiedImages[0]) {
      console.log('🧪 Testing image accessibility:', {
        original: images[0],
        proxied: proxiedImages[0]
      });
      const testImg = new Image();
      testImg.onload = () => {
        console.log('✅ Image loaded successfully (test):', proxiedImages[0]);
        console.log('   Image dimensions:', testImg.width, 'x', testImg.height);
      };
      testImg.onerror = (e) => {
        console.error('❌ Image failed to load (test):', proxiedImages[0]);
        console.error('   Original URL:', images[0]);
        console.error('   Error event:', e);
        if (e instanceof Event) {
          console.error('   Error type:', e.type);
        }
        console.error('   This might be a proxy issue or invalid URL');
      };
      testImg.src = proxiedImages[0];
      
      // Also check if image element exists in DOM after a short delay
      setTimeout(() => {
        const imgElements = document.querySelectorAll(`img[src="${proxiedImages[0]}"]`);
        console.log('🔍 Image elements in DOM:', imgElements.length);
        if (imgElements.length > 0) {
          const img = imgElements[0] as HTMLImageElement;
          console.log('   Image element found:', {
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            src: img.src
          });
        }
      }, 1000);
    } else {
      console.warn('⚠️ No images found in product:', product.id);
    }
  }, [product.images, product.image, product.id, images, proxiedImages, mainImage, selectedImageIndex]);
  
  // Debug logging
  console.log(`📦 ProductDetailPageClient: Product ${product.id}`, {
    hasVariants: !!product.variants,
    variantCount: product.variants?.length || 0,
    selectedVariant,
    variantPriceId: variantPriceId || 'none',
    productPrice: product.price,
    imageCount: images.length,
    hasImages: images.length > 0,
    mainImageUrl: mainImage || 'none'
  });

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
            {/* Product Images */}
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
                
                {/* Main Product Image */}
                {mainImage ? (
                  <>
                    <img 
                      src={mainImage} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      width={600}
                      height={600}
                      onError={(e) => {
                        console.error('❌ Image render error:', {
                          src: mainImage,
                          error: e,
                          errorType: e.type,
                          productId: product.id,
                          timestamp: new Date().toISOString()
                        });
                      }}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        console.log('✅ Image rendered successfully:', {
                          src: mainImage,
                          naturalWidth: img.naturalWidth,
                          naturalHeight: img.naturalHeight,
                          productId: product.id
                        });
                      }}
                      style={{ display: 'block' }} // Ensure image is visible
                    />
                    {/* Debug indicator in development */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 break-all">
                        Image: {mainImage}
                      </div>
                    )}
                  </>
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

              {/* Thumbnail Images (if more than 1 image) */}
              {images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                  {images.map((img, index) => {
                    const proxiedImg = getProxiedImageUrl(img);
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 border-2 overflow-hidden transition-all ${
                          selectedImageIndex === index
                            ? 'border-warmOchre'
                            : 'border-ochre/20 hover:border-ochre/40'
                        }`}
                      >
                        <img 
                          src={proxiedImg}
                          alt={`${product.name} - bild ${index + 1}`}
                          className="w-full h-full object-cover"
                          width={80}
                          height={80}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
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
                
                {/* Subscription Badge */}
                {product.type === 'subscription' && product.subscription && (
                  <div className="mb-6">
                    <span className="inline-block px-4 py-2 bg-indigo text-ivory text-sm uppercase tracking-widest font-medium mb-2">
                      Prenumeration
                    </span>
                    <p className="text-softCharcoal text-sm font-medium">
                      Faktureras {getSubscriptionIntervalDescription(product.subscription.interval, product.subscription.intervalCount)}
                    </p>
                  </div>
                )}
                
                {/* Campaign Badge & Price (if campaign exists) */}
                {/* IMPORTANT: Use stripeProductId instead of id (baseSku) for campaign API */}
                {product.type !== 'subscription' && (
                  <CampaignBadge 
                  productId={product.stripeProductId || product.id}
                  defaultPrice={product.price}
                  currency={product.currency || 'SEK'}
                  onCampaignFound={setCampaignPrice}
                  variantPriceId={variantPriceId}
                  hasVariants={hasMultipleSizes}
                  />
                )}
                
                {/* Regular Price Display (if no campaign) */}
                {/* ✅ Show variant-specific price if variant is selected, otherwise show product price */}
                {!campaignPrice && (
                  <div className="flex items-baseline gap-3 mb-6">
                    {(() => {
                      // Check if this is a subscription product
                      const subscriptionInfo = formatSubscriptionInfo(product);
                      if (subscriptionInfo) {
                        return (
                          <span className="text-4xl font-serif text-deepIndigo">
                            {subscriptionInfo}
                          </span>
                        );
                      }

                      // Use variant-specific price if available and variant is selected
                      const displayPrice = selectedVariantData?.price ?? product.price;
                      const displayPriceFormatted = selectedVariantData?.priceFormatted 
                        ? selectedVariantData.priceFormatted.replace(/\.00/, '') // Remove .00 if present
                        : formatPrice(displayPrice, product.currency);
                      
                      return product.salePrice ? (
                        <>
                          <span className="text-4xl font-serif text-terracotta">
                            {formatPrice(product.salePrice, product.currency)}
                          </span>
                          <span className="text-2xl text-softCharcoal/50 line-through">
                            {displayPriceFormatted}
                          </span>
                          <span className="px-3 py-1 bg-terracotta/10 text-terracotta text-sm font-medium">
                            Save {formatPrice(displayPrice - product.salePrice, product.currency)}
                          </span>
                        </>
                      ) : (
                        <span className="text-4xl font-serif text-deepIndigo">
                          {displayPriceFormatted}
                        </span>
                      );
                    })()}
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
                {product.stripePriceId || (product.variants && product.variants.length > 0) ? (
                  <>
                    <BuyNowButton 
                      product={product} 
                      onVariantChange={setSelectedVariant}
                    />
                    {/* Direct Checkout Button (as shown in template) */}
                    {selectedVariant && (
                      <DirectCheckoutButton 
                        product={product}
                        variantKey={selectedVariant}
                      />
                    )}
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

// Direct Checkout Button Component (as shown in template)
function DirectCheckoutButton({ 
  product, 
  variantKey 
}: { 
  product: Product; 
  variantKey: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const selectedVariant = product.variants?.find(v => v.key === variantKey);
  
  const handleDirectCheckout = async () => {
    if (!selectedVariant || !selectedVariant.stripePriceId) {
      alert('Välj en variant först');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            variantId: selectedVariant.key,
            quantity: 1,
            stripePriceId: selectedVariant.stripePriceId,
            productId: product.id,
            variantKey: selectedVariant.key,
          }],
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.href,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || 'Unknown error occurred';
        alert(`Kunde inte skapa kassasession: ${errorMessage}`);
        setLoading(false);
        return;
      }
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Fel vid skapande av kassasession. Försök igen.`);
      setLoading(false);
    }
  };
  
  if (!selectedVariant || !selectedVariant.stripePriceId) {
    return null;
  }
  
  return (
    <button
      onClick={handleDirectCheckout}
      disabled={loading}
      className="flex items-center justify-center gap-3 w-full px-8 py-4 bg-sage text-deepIndigo hover:bg-sage/90 transition-all duration-300 font-medium tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Skapar kassasession...</span>
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5" />
          <span>Gå till Kassan</span>
        </>
      )}
    </button>
  );
}

