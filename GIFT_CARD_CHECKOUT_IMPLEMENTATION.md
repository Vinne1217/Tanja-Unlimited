# Gift Card Checkout Implementation

## Overview

This implementation enables gift card purchases through Stripe Checkout for test tenants. Gift cards are purchased like normal products, with metadata that allows the webhook to identify and process them correctly.

## Implementation Details

### 1. Tenant Configuration

**Feature Flag:** `giftCardsEnabled`

- **Location:** Stored in customer portal's `tenantconfigs` collection
- **Default:** `false` (disabled by default)
- **Access:** Fetched server-side via `/api/tenants/{tenantId}/config` endpoint
- **Safety:** Only enabled manually for test tenants

**Configuration Example:**
```json
{
  "tenantId": "tanjaunlimited",
  "giftCardsEnabled": true
}
```

### 2. Checkout Integration

**File:** `app/api/checkout/route.ts`

**Changes:**
- Added `getTenantConfig()` call to check `giftCardsEnabled` flag
- Added gift card detection (`item.type === 'gift_card'`)
- Added safety checks:
  - ✅ Stripe test mode only (`sk_test_` key required)
  - ✅ Tenant feature flag check
  - ✅ Tenant isolation (uses server-side `tenantId`)

**Cart Item Type:**
```typescript
type CartItem = {
  quantity: number;
  stripePriceId: string;
  productId?: string;
  // Gift card fields
  type?: 'gift_card' | 'product';
  giftCardAmount?: number; // Amount in cents (e.g., 50000 = 500 SEK)
};
```

**Checkout Flow:**
1. Frontend sends cart items with `type: 'gift_card'` and `giftCardAmount`
2. Server checks `giftCardsEnabled` flag for tenant
3. Server verifies Stripe test mode
4. Server skips inventory checks for gift cards
5. Server adds gift card metadata to checkout session
6. Stripe Checkout processes payment
7. Webhook receives payment with gift card metadata

### 3. Stripe Checkout Metadata

**Required Metadata Fields:**

When `type === 'gift_card'`, the checkout session includes:

```json
{
  "type": "gift_card",
  "tenantId": "tanjaunlimited",
  "giftCardAmount": "50000",
  "tenant": "tanjaunlimited",
  "source": "tanja_website",
  "website": "tanja-unlimited.onrender.com"
}
```

**Field Descriptions:**
- `type`: **Required** - Must be exactly `"gift_card"` for webhook detection
- `tenantId`: **Required** - Tenant ID (trusted server-side, not from client)
- `giftCardAmount`: **Required** - Amount in cents (e.g., `"50000"` = 500 SEK)

**Note:** `tenantId` is set server-side from `process.env.SOURCE_TENANT_ID` or defaults to `'tanjaunlimited'`. It is **never** taken from client input.

### 4. Webhook Compatibility

**Existing Webhook Handler:** `/webhooks/stripe-payments` (in customer portal)

**Expected Behavior:**

The existing webhook handler should detect gift card purchases by checking:

```typescript
if (checkoutSession.metadata?.type === 'gift_card') {
  // Create GiftCard record
  // Use metadata.tenantId for tenant identification
  // Use metadata.giftCardAmount for initial amount
}
```

**Webhook Processing Flow:**

1. **Event:** `checkout.session.completed` or `payment_intent.succeeded`
2. **Extract Metadata:**
   - `metadata.type` → Must be `"gift_card"`
   - `metadata.tenantId` → Tenant ID (server-validated)
   - `metadata.giftCardAmount` → Initial amount in cents
3. **Create GiftCard Record:**
   - `initialAmount`: From `metadata.giftCardAmount`
   - `remainingAmount`: Same as `initialAmount` initially
   - `tenantId`: From `metadata.tenantId`
   - `stripePaymentIntentId`: From payment intent
4. **Idempotency:** Check for existing gift card by payment intent ID to prevent duplicates
5. **Email:** Send gift card email once after successful creation

**No Changes Required:**

The webhook handler in the customer portal should already support this metadata format. If it doesn't, it needs to be updated to:
- Check `metadata.type === 'gift_card'`
- Extract `metadata.tenantId` (not `metadata.tenant`)
- Extract `metadata.giftCardAmount` as integer

### 5. Safety & Compliance

**Test Mode Only:**
- ✅ Gift cards blocked if Stripe key doesn't start with `sk_test_`
- ✅ Returns 403 error if production Stripe key detected

**Tenant Isolation:**
- ✅ `tenantId` set server-side only (from environment variable)
- ✅ Never accepts `tenantId` from client input
- ✅ Feature flag checked per tenant

**No CSRF Bypass:**
- ✅ All checks performed server-side
- ✅ No client-side feature flags

**GDPR Compliance:**
- ✅ Gift card codes never exposed in logs or UI
- ✅ Only masked codes shown to users

### 6. Shipping Configuration

**Gift Cards:**
- ✅ Shipping address collection **disabled** (gift cards are digital)
- ✅ Phone number collection still enabled
- ✅ Promotion codes allowed

**Regular Products:**
- ✅ Shipping address collection enabled (unchanged)
- ✅ All existing behavior preserved

## Testing Checklist

### Prerequisites
- [ ] Tenant config has `giftCardsEnabled: true` for test tenant
- [ ] Stripe is in test mode (`sk_test_` key)
- [ ] Gift card product exists in Stripe with a price ID
- [ ] Webhook endpoint configured in Stripe Dashboard

### Test Scenarios

1. **Gift Card Purchase**
   - [ ] Add gift card to cart with `type: 'gift_card'` and `giftCardAmount`
   - [ ] Complete checkout
   - [ ] Verify Stripe payment succeeds
   - [ ] Verify webhook receives `type: 'gift_card'` metadata
   - [ ] Verify GiftCard record created in database
   - [ ] Verify email sent once
   - [ ] Verify gift card appears in admin UI

2. **Safety Checks**
   - [ ] Production Stripe key → Returns 403 error
   - [ ] `giftCardsEnabled: false` → Returns 403 error
   - [ ] Wrong tenant → Blocked by tenant isolation

3. **Redemption**
   - [ ] Gift card can be redeemed (partial)
   - [ ] Gift card can be redeemed (full)
   - [ ] Expired cards rejected
   - [ ] Wrong tenant redemption blocked

4. **Idempotency**
   - [ ] Multiple webhook calls don't create duplicate gift cards
   - [ ] Same payment intent ID → Single gift card record

## Code Changes Summary

### Files Modified

1. **`lib/source.ts`**
   - Added `TenantConfig` type
   - Added `getTenantConfig()` function

2. **`app/api/checkout/route.ts`**
   - Added `type` and `giftCardAmount` to `CartItem` type
   - Added tenant config check
   - Added Stripe test mode check
   - Added gift card detection
   - Added gift card metadata to checkout session
   - Disabled shipping for gift cards
   - Skipped inventory checks for gift cards

### Files Not Modified

- ✅ No webhook handler changes (handled by customer portal)
- ✅ No frontend changes required (frontend just needs to send correct cart items)
- ✅ No database schema changes (existing GiftCard model used)

## Frontend Integration

To enable gift card purchases from the frontend, send cart items like this:

```typescript
const giftCardItem = {
  quantity: 1,
  stripePriceId: 'price_xxxxx', // Stripe Price ID for gift card product
  type: 'gift_card',
  giftCardAmount: 50000 // 500 SEK in cents
};

// Add to cart and checkout normally
await fetch('/api/checkout', {
  method: 'POST',
  body: JSON.stringify({
    items: [giftCardItem],
    successUrl: '...',
    cancelUrl: '...'
  })
});
```

## Notes

- **Amount Format:** `giftCardAmount` is in cents (e.g., 500 SEK = 50000 cents)
- **Tenant ID:** Always set server-side, never from client
- **Test Mode:** Gift cards only work with test Stripe keys
- **Shipping:** Automatically disabled for gift cards
- **Inventory:** Skipped for gift cards (they don't have stock)

