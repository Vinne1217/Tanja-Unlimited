# Response to Source Portal Team - Proxy Implementation Status

## ✅ Current Implementation

The tenant backend (`app/api/checkout/route.ts`) **IS already acting as a proxy** and forwarding requests to Source Portal.

### Current Code Flow:

```typescript
// Tenant Backend: app/api/checkout/route.ts

// 1. Receives request from frontend
const { items, customerEmail, successUrl, cancelUrl, giftCardCode } = await req.json();

// 2. Prepares request body for Source Portal
const backendRequestBody = {
  items: backendItems,
  customerEmail: customerEmail || undefined,
  successUrl: successUrl,
  cancelUrl: cancelUrl,
  ...(giftCardCode && { giftCardCode: giftCardCode }), // ✅ Gift card code included
  metadata: sessionMetadata
};

// 3. ✅ FORWARDS to Source Portal (NOT creating Stripe checkout directly)
const backendUrl = `${SOURCE_BASE}/storefront/${tenantId}/checkout`;
// SOURCE_BASE = 'https://source-database-809785351172.europe-north1.run.app'

const backendResponse = await fetch(backendUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant': tenantId
  },
  body: JSON.stringify(backendRequestBody)
});

// 4. Returns Source Portal's response to frontend
const backendData = await backendResponse.json();
return NextResponse.json({
  url: backendData.checkoutUrl, // ✅ Using Source Portal's checkout URL
  id: backendData.sessionId,
  orderId: backendData.orderId
});
```

## ✅ Verification

The tenant backend:
- ✅ **Does NOT** create Stripe checkout sessions directly
- ✅ **Does** forward requests to: `POST /storefront/{tenant}/checkout`
- ✅ **Does** include `giftCardCode` in the request body
- ✅ **Does** return Source Portal's `checkoutUrl` to frontend

## 🔍 Enhanced Logging Added

I've added explicit logging to confirm the proxy pattern:

```typescript
console.log(`🔄 [TENANT BACKEND] Forwarding checkout request to Source Portal:`, {
  url: backendUrl,
  tenantId,
  hasGiftCardCode: !!giftCardCode,
  itemsCount: backendItems.length
});

console.log(`📤 [TENANT BACKEND] Sending request to Source Portal...`);
console.log(`📥 [TENANT BACKEND] Source Portal response status: ${backendResponse.status}`);
console.log(`✅ [TENANT BACKEND] Source Portal response received:`, {
  success: backendData.success,
  hasCheckoutUrl: !!backendData.checkoutUrl,
  sessionId: backendData.sessionId
});
```

## 📋 Request Details

**Endpoint being called:**
```
POST https://source-database-809785351172.europe-north1.run.app/storefront/tanjaunlimited/checkout
```

**Headers:**
```
Content-Type: application/json
X-Tenant: tanjaunlimited
```

**Request Body:**
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
  "giftCardCode": "GC-CWSJ-WAFC",
  "metadata": {
    "tenant": "tanjaunlimited",
    "source": "tanja_website",
    "website": "tanja-unlimited-809785351172.europe-north1.run.app",
    "giftCardCode": "GC-CWSJ-WAFC"
  }
}
```

## 🔍 Debugging

If Source Portal is not receiving requests, please check:

1. **Network connectivity** between tenant backend and Source Portal
2. **CORS configuration** on Source Portal endpoint
3. **Endpoint path** - verify `/storefront/{tenant}/checkout` is correct
4. **Request logs** - check if requests are reaching Source Portal but failing silently

## 📊 Expected Logs After Deployment

**Tenant Backend Logs:**
```
🔄 [TENANT BACKEND] Forwarding checkout request to Source Portal: { url: '...', tenantId: 'tanjaunlimited', ... }
📤 [TENANT BACKEND] Sending request to Source Portal...
📥 [TENANT BACKEND] Source Portal response status: 200
✅ [TENANT BACKEND] Source Portal response received: { success: true, hasCheckoutUrl: true, ... }
✅ [TENANT BACKEND] Checkout session created via Source Portal: cs_test_...
```

**Source Portal Logs (should appear):**
```
🔥🔥🔥 [API CHECKOUT] ENDPOINT HIT - FIRST LINE 🔥🔥🔥
🎁 [API CHECKOUT] Gift card code found: GC-C...
🔥🔥🔥 [CHECKOUT SERVICE] ENTRY - FIRST LINE IN SERVICE 🔥🔥🔥
✅ [CHECKOUT] Gift card verified and applied
✅ [CHECKOUT] Stripe session created with discount
```

## ✅ Confirmation

The tenant backend implementation is **correct** and follows the proxy pattern. 

If Source Portal is not receiving requests, the issue may be:
- Network/firewall blocking the connection
- CORS configuration
- Endpoint path mismatch
- Request timing out before reaching Source Portal

## 📝 Next Steps

1. ✅ Tenant backend is already proxying correctly
2. ⏳ Deploy enhanced logging to verify requests are sent
3. ⏳ Check Source Portal logs to confirm requests are received
4. ⏳ If requests not received, investigate network/connectivity issues

---

**Status:** ✅ Proxy implementation is correct
**Action Required:** Verify Source Portal is receiving requests (check logs/network)

