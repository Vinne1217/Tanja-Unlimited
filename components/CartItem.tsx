'use client';

import { motion } from 'framer-motion';
import { Trash2, Plus, Minus } from 'lucide-react';
import { formatPrice } from '@/lib/products';
import { useCampaignPrice } from '@/lib/useCampaignPrice';
import { formatSubscriptionInfo, getSubscriptionIntervalDescription } from '@/lib/subscription';
import StockStatus from './StockStatus';
import type { CartItem as CartItemType } from '@/lib/cart-context';

type CartItemProps = {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number, variantKey?: string) => void;
  onRemove: (productId: string, variantKey?: string) => void;
};

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const image = item.product.image || item.product.images?.[0];
  
  // Fetch campaign price for this cart item
  // Use stripeProductId if available, otherwise fallback to product id
  const productIdForCampaign = item.product.stripeProductId || item.product.id;
  const campaignPrice = useCampaignPrice(
    productIdForCampaign,
    item.product.price || 0,
    item.product.variantPriceId
  );

  // Use campaign price if available, otherwise use regular price
  const displayPrice = campaignPrice.hasCampaign && campaignPrice.campaignPrice 
    ? campaignPrice.campaignPrice 
    : item.product.price || 0;
  const originalPrice = campaignPrice.hasCampaign && campaignPrice.campaignPrice
    ? campaignPrice.originalPrice
    : item.product.price || 0;

  // Check if this cart item is a subscription
  const isSubscription = item.product.type === 'subscription' && !!item.product.subscription;
  const subscriptionPricePerUnit = isSubscription ? (item.product.price || 0) : null;
  const subscriptionIntervalText = isSubscription && item.product.subscription
    ? getSubscriptionIntervalDescription(
        item.product.subscription.interval,
        item.product.subscription.intervalCount
      )
    : null;

  return (
    <motion.div
      key={`${item.product.id}${item.product.variantKey ? `:${item.product.variantKey}` : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-warmIvory border border-warmOchre/20 p-6 flex gap-6"
    >
      {image && (
        <img
          src={image}
          alt={item.product.name}
          className="w-24 h-24 object-cover border border-ochre/20"
        />
      )}
      <div className="flex-1">
        <h3 className="text-xl font-serif text-deepIndigo mb-1">{item.product.name}</h3>
        {isSubscription && (
          <p className="text-xs uppercase tracking-widest text-indigo mb-1">
            Prenumeration
          </p>
        )}
        {item.product.variantKey && (
          <p className="text-sm text-softCharcoal mb-2">Storlek: {item.product.variantKey}</p>
        )}
        <StockStatus productId={item.product.id} />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1, item.product.variantKey)}
              className="p-1 border border-warmOchre/20 hover:border-warmOchre transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.product.variantKey)}
              className="p-1 border border-warmOchre/20 hover:border-warmOchre transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="text-right">
            {isSubscription ? (
              <>
                <p className="text-lg font-serif text-deepIndigo">
                  {formatPrice((subscriptionPricePerUnit || 0) * item.quantity, item.product.currency)}{subscriptionIntervalText ? ` /${subscriptionIntervalText}` : ''}
                </p>
                {item.quantity > 1 && subscriptionPricePerUnit !== null && (
                  <p className="text-xs text-softCharcoal/60 mt-1">
                    {formatPrice(subscriptionPricePerUnit, item.product.currency)} per {subscriptionIntervalText || 'period'}
                  </p>
                )}
              </>
            ) : campaignPrice.hasCampaign && campaignPrice.campaignPrice ? (
              <>
                <p className="text-lg font-serif text-terracotta">
                  {formatPrice(displayPrice * item.quantity, item.product.currency)}
                </p>
                <p className="text-sm text-softCharcoal/60 line-through">
                  {formatPrice(originalPrice * item.quantity, item.product.currency)}
                </p>
                {item.quantity > 1 && (
                  <p className="text-xs text-softCharcoal/60 mt-1">
                    {formatPrice(displayPrice, item.product.currency)} each
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-lg font-serif text-deepIndigo">
                  {formatPrice(displayPrice * item.quantity, item.product.currency)}
                </p>
                {item.quantity > 1 && (
                  <p className="text-sm text-softCharcoal/60">
                    {formatPrice(displayPrice, item.product.currency)} each
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemove(item.product.id, item.product.variantKey)}
          className="mt-4 flex items-center gap-2 text-sm text-terracotta hover:text-terracotta/80 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Remove</span>
        </button>
      </div>
    </motion.div>
  );
}

