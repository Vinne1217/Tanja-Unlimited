# Gift Card Checkout Implementation Status

## ✅ Frontend Implementation - CORRECT

The tenant frontend is **already correctly implemented** and follows best practices:

### ✅ What's Working:

1. **Backend Endpoint Usage**
   - Frontend calls: `POST /api/checkout` (tenant backend endpoint)
   - Tenant backend proxies to: `POST /storefront/{tenant}/checkout` (Source Portal backend)
   - **NO direct Stripe.js checkout calls** ✅

2. **Gift Card Code Handling**
   - Gift card code is verified before checkout ✅
   - Gift card code is included in request body as direct property ✅
   - Gift card code is also included in metadata (backup) ✅
   - Code is formatted as uppercase (GC-XXXX-XXXX) ✅

3. **Response Handling**
   - Frontend waits for backend response ✅
   - Uses `data.url` from response to redirect ✅
   - Proper error handling ✅

### Code Verification:

**Cart Checkout (`app/cart/page.tsx`):**
```typescript
// ✅ CORRECT: Calls backend endpoint
const response = await fetch('/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [...],
    giftCardCode: giftCardCodeToSend, // ✅ Included
    successUrl: '...',
    cancelUrl: '...',
    metadata: { giftCardCode: giftCardCodeToSend } // ✅ Also in metadata
  })
});

// ✅ CORRECT: Uses response URL
if (data.url) {
  window.location.href = data.url;
}
```

**Tenant Backend (`app/api/checkout/route.ts`):**
```typescript
// ✅ CORRECT: Proxies to Source Portal backend
const backendRequestBody = {
  items: backendItems,
  customerEmail: customerEmail,
  successUrl: successUrl,
  cancelUrl: cancelUrl,
  ...(giftCardCode && { giftCardCode: giftCardCode }), // ✅ Direct property
  metadata: sessionMetadata // ✅ Also in metadata
};

const backendResponse = await fetch(`${SOURCE_BASE}/storefront/${tenantId}/checkout`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Tenant': tenantId },
  body: JSON.stringify(backendRequestBody)
});
```

## ❌ Backend Issue - DISCOUNT NOT APPLIED

The Source Portal backend (`/storefront/{tenant}/checkout`) is:
- ✅ Receiving the gift card code
- ✅ Creating checkout sessions successfully
- ❌ **NOT applying the discount to Stripe line items**

### Evidence from Logs:

**Tenant Frontend Logs:**
```
✅ Gift card verified: { remainingAmount: 25000, currency: 'SEK' }
✅ Gift card code found: GC-C****WAFC
✅ Including giftCardCode in backend request body: GC-C****WAFC
✅ Backend request body keys: ['items', 'customerEmail', 'successUrl', 'cancelUrl', 'giftCardCode', 'metadata']
✅ Checkout session created via backend: cs_test_...
```

**What's Missing in Backend Logs:**
- No logs showing gift card verification in checkout service
- No logs showing discount calculation
- No logs showing adjusted line items
- No logs showing discount line item creation

## 🔍 Root Cause

The Source Portal backend endpoint needs to:

1. **Read gift card code from request body:**
   ```javascript
   const { items, giftCardCode, ... } = req.body;
   ```

2. **Verify gift card and get balance:**
   ```javascript
   if (giftCardCode) {
     const verification = await verifyGiftCard(giftCardCode, tenantId);
     const balance = verification.data.remainingAmount; // in öre
   }
   ```

3. **Calculate discount:**
   ```javascript
   const lineItemsTotal = calculateTotal(items);
   const discount = Math.min(balance, lineItemsTotal);
   const finalTotal = Math.max(50, lineItemsTotal - discount);
   ```

4. **Apply discount to Stripe line items:**
   ```javascript
   // Option A: Add discount line item
   lineItems.push({
     price_data: {
       currency: 'sek',
       product_data: { name: 'Gift Card Discount' },
       unit_amount: -discountAmount
     },
     quantity: 1
   });
   
   // Option B: Adjust existing line items
   ```

5. **Create Stripe session with adjusted line items:**
   ```javascript
   const session = await stripe.checkout.sessions.create({
     line_items: adjustedLineItems,
     allow_promotion_codes: false, // When gift card used
     metadata: { giftCardCode, giftCardDiscount: discountAmount }
   });
   ```

## 📋 Request Body Being Sent

The tenant frontend sends this exact structure:

```json
{
  "items": [
    {
      "variantId": "JACK-1234",
      "quantity": 1,
      "stripePriceId": "price_1SmchQ1fkdOqt85xhAcJUQuN"
    }
  ],
  "customerEmail": undefined,
  "successUrl": "https://tanja-unlimited-809785351172.europe-north1.run.app/checkout/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://tanja-unlimited-809785351172.europe-north1.run.app/cart",
  "giftCardCode": "GC-CWSJ-WAFC",  // ✅ TOP-LEVEL PROPERTY
  "metadata": {
    "tenant": "tanjaunlimited",
    "source": "tanja_website",
    "website": "tanja-unlimited-809785351172.europe-north1.run.app",
    "giftCardCode": "GC-CWSJ-WAFC"  // ✅ Also in metadata
  }
}
```

## ✅ Conclusion

**Frontend Status:** ✅ **CORRECT** - No changes needed

**Backend Status:** ❌ **NEEDS FIX** - Source Portal backend must implement gift card discount logic

The tenant frontend is correctly sending the gift card code to the backend. The backend needs to read it, verify it, calculate the discount, and apply it to the Stripe checkout session.

## 📝 Next Steps

1. ✅ Tenant frontend: Already correct - no changes needed
2. ⏳ Source Portal backend: Implement gift card discount logic in `/storefront/{tenant}/checkout` endpoint
3. ⏳ Test: Verify discount appears in Stripe Checkout after backend fix

---

**Last Updated:** 2026-01-13
**Status:** Frontend ✅ | Backend ❌

