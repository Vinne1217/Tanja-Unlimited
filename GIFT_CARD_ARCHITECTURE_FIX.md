# Gift Card Architecture Fix - Read-Only Verification Only

## Problem

The tenant checkout was attempting to redeem gift cards directly via customer portal API, which correctly returned 403 Forbidden. Gift cards must never be redeemed from the frontend or tenant backend - redemption must happen server-side in the customer portal checkout flow.

## Solution

Removed all redemption logic and implemented read-only verification only. The tenant webshop now:
1. ✅ Collects gift card code in checkout
2. ✅ Verifies code via read-only public endpoint
3. ✅ Forwards code to checkout API (no redemption)

## Changes Made

### 1. `lib/gift-cards.ts` - Replaced Redeem Function

**Removed:**
- `verifyAndRedeemGiftCard()` - Attempted to redeem gift cards (caused 403 errors)

**Added:**
- `verifyGiftCard()` - Read-only verification only
- Calls: `POST /api/storefront/{tenant}/giftcards/verify`
- Returns: `{ valid: boolean, balance?: number, expiresAt?: string }`
- **NO mutation** - Only checks validity and balance

### 2. `app/api/checkout/route.ts` - Removed All Redemption Logic

**Removed:**
- ❌ Gift card redemption before Stripe session creation
- ❌ Balance deduction logic
- ❌ `giftCardAmountUsed` calculation
- ❌ `stripeChargeAmount` calculation
- ❌ Redemption metadata (`giftCardRedemptionId`, `giftCardAmountUsed`, etc.)

**Kept:**
- ✅ Gift card code collection
- ✅ Forwarding gift card code in Stripe metadata
- ✅ Basic validation

**New Behavior:**
- Accepts `giftCardCode` in request body
- Forwards code to Stripe session metadata: `metadata.giftCardCode = code`
- Customer portal backend handles all redemption server-side

### 3. `app/api/gift-cards/verify/route.ts` - New Verification Endpoint

**Created:**
- New API endpoint: `POST /api/gift-cards/verify`
- Proxies to customer portal: `POST /api/storefront/{tenant}/giftcards/verify`
- Read-only verification (no mutation)
- Returns balance and expiration info

### 4. `app/cart/page.tsx` - Updated Frontend

**Added:**
- ✅ "Verify" button for gift card code
- ✅ Shows balance when verified
- ✅ Shows expiration date if available
- ✅ Error handling for invalid codes
- ✅ Only sends verified gift card codes to checkout

**Removed:**
- ❌ No redemption attempts
- ❌ No balance adjustments
- ❌ No mutation logic

## Architecture

### Correct Flow (After Fix)

```
1. User enters gift card code in cart
   ↓
2. Frontend calls: POST /api/gift-cards/verify
   ↓
3. Tenant API proxies to: POST /api/storefront/{tenant}/giftcards/verify
   ↓
4. Customer portal returns: { valid: true, balance: 50000 }
   ↓
5. Frontend shows balance to user
   ↓
6. User clicks "Proceed to Checkout"
   ↓
7. Frontend calls: POST /api/checkout { giftCardCode: "GC-XXXX" }
   ↓
8. Tenant checkout forwards code to Stripe metadata
   ↓
9. Stripe checkout session created with metadata.giftCardCode
   ↓
10. Customer portal webhook receives checkout.session.completed
    ↓
11. Customer portal backend redeems gift card server-side
    ↓
12. Order created with gift card applied
```

### Security Rules Enforced

✅ **No API keys in frontend** - All API calls go through tenant backend  
✅ **No redeem calls** - Only verification endpoint used  
✅ **No balance mutations** - Read-only verification only  
✅ **Verify only** - Frontend only verifies validity  
✅ **Forward code only** - Checkout only forwards code in metadata  

## API Endpoints

### Frontend → Tenant API

**Verify Gift Card:**
```
POST /api/gift-cards/verify
Body: { code: "GC-XXXX-86WU" }
Response: { valid: true, balance: 50000, expiresAt: "2026-12-31" }
```

**Checkout:**
```
POST /api/checkout
Body: { 
  items: [...],
  giftCardCode: "GC-XXXX-86WU"  // Only if verified
}
```

### Tenant API → Customer Portal

**Verify (Read-Only):**
```
POST /api/storefront/{tenant}/giftcards/verify
Headers: X-Tenant: {tenant}
Body: { code: "GC-XXXX-86WU" }
Response: { valid: true, balance: 50000, expiresAt: "2026-12-31" }
```

**Checkout Metadata:**
```
Stripe Session Metadata:
{
  giftCardCode: "GC-XXXX-86WU",
  tenant: "tanjaunlimited",
  ...
}
```

## Testing Checklist

- [ ] Gift card code can be entered in cart
- [ ] Verify button works and shows balance
- [ ] Invalid codes show error message
- [ ] Verified codes are forwarded to checkout
- [ ] No 403 errors in console
- [ ] Checkout succeeds with gift card code
- [ ] Gift card code appears in Stripe metadata
- [ ] Customer portal receives code in webhook
- [ ] Customer portal redeems gift card server-side

## Files Modified

1. ✅ `lib/gift-cards.ts` - Replaced redeem with verify
2. ✅ `app/api/checkout/route.ts` - Removed redemption logic
3. ✅ `app/api/gift-cards/verify/route.ts` - New verification endpoint
4. ✅ `app/cart/page.tsx` - Added verify UI

## Files NOT Modified

- ✅ No customer portal code changes
- ✅ No webhook handler changes (handled by customer portal)
- ✅ No database schema changes

## Next Steps

1. ✅ Tenant code updated (read-only verification only)
2. ⏳ Customer portal implements `/api/storefront/{tenant}/giftcards/verify` endpoint
3. ⏳ Customer portal webhook handles redemption server-side
4. ⏳ Test end-to-end flow

## Notes

- **No Authentication Required:** The verify endpoint uses only `X-Tenant` header (same pattern as other storefront endpoints)
- **No API Keys:** Frontend never sees API keys - all calls go through tenant backend
- **Idempotency:** Handled by customer portal backend (not tenant responsibility)
- **Race Conditions:** Prevented by server-side redemption in customer portal

This architecture is secure, follows best practices, and prevents gift card abuse.

