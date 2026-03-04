# Shipping Behavior Error Fix

## Problem

When purchasing a gift card in the web shop, the following error occurs:

```
Kunde inte slutföra köpet: Received unknown parameter: shipping_behavior. Did you mean shipping_options?
```

## Root Cause

The Source Portal backend (`POST /storefront/{tenant}/checkout`) is trying to use `shipping_behavior` when creating a Stripe checkout session. However, `shipping_behavior` is **not a valid Stripe API parameter**.

Stripe's error message suggests using `shipping_options` instead, but for gift cards, shipping should be **disabled entirely**.

## Solution

### Tenant Backend Changes (✅ Completed)

The tenant backend (`app/api/checkout/route.ts`) now includes a `disableShipping: true` flag in the request body when purchasing gift cards:

```typescript
const backendRequestBody = {
  items: backendItems,
  customerEmail: customerEmail || undefined,
  successUrl: successUrl,
  cancelUrl: cancelUrl,
  ...(giftCardCode && { giftCardCode: giftCardCode }),
  ...(isGiftCardPurchase && { disableShipping: true }), // ✅ Added
  metadata: sessionMetadata
};
```

### Source Portal Backend Changes (⚠️ Required)

The Source Portal backend needs to be updated to:

1. **Remove `shipping_behavior` parameter** - This parameter doesn't exist in Stripe's API
2. **Check for `disableShipping` flag** - When `disableShipping: true`, skip all shipping-related parameters
3. **For gift cards, disable shipping** - Set `shipping_address_collection: null` or omit shipping parameters entirely

#### Correct Stripe Checkout Session Creation for Gift Cards

```typescript
// ❌ WRONG - This causes the error
const session = await stripe.checkout.sessions.create({
  // ... other params
  shipping_behavior: 'default' // ❌ This parameter doesn't exist
});

// ✅ CORRECT - For gift cards (disable shipping)
const session = await stripe.checkout.sessions.create({
  // ... other params
  shipping_address_collection: null, // ✅ Disable shipping address collection
  // OR simply omit shipping parameters entirely
});

// ✅ CORRECT - For regular products (with shipping)
const session = await stripe.checkout.sessions.create({
  // ... other params
  shipping_address_collection: {
    allowed_countries: ['SE', 'NO', 'DK', ...]
  },
  shipping_options: [ // ✅ Use shipping_options, not shipping_behavior
    {
      shipping_rate_data: {
        // ... shipping rate configuration
      }
    }
  ]
});
```

## Detection Logic

The Source Portal backend can detect gift card purchases in two ways:

1. **`disableShipping` flag** - Explicitly set to `true` in request body
2. **Metadata `product_type`** - Set to `'giftcard'` in session metadata

## Testing

After the Source Portal backend is updated:

1. ✅ Gift card purchase should work without errors
2. ✅ Regular product purchase should still work with shipping
3. ✅ No `shipping_behavior` parameter should be sent to Stripe

## Related Files

- `app/api/checkout/route.ts` - Tenant backend (updated)
- Source Portal backend: `POST /storefront/{tenant}/checkout` - **Needs update**
