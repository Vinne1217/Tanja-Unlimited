# Campaign Sync - Stripe Connect Verification

## Current Implementation Status

### ✅ Sync Endpoint (`/api/campaigns/sync`)

**Status:** Updated and verified

**Features:**
- ✅ Authorization header validation (`Bearer {FRONTEND_API_KEY}`)
- ✅ Idempotency key support
- ✅ Campaign upsert/delete handling
- ✅ Stripe price IDs validation and logging
- ✅ Error handling and logging
- ✅ Page revalidation

**Request Format:**
```json
{
  "campaignId": "campaign_123",
  "name": "Campaign Name",
  "type": "discount",
  "discountType": "percentage",
  "discountValue": 20,
  "products": ["prod_xxx", "prod_yyy"],
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-12-31T23:59:59.999Z",
  "status": "active",
  "stripeCouponId": "coupon_xxx",
  "stripePromotionCodeId": "promo_xxx",
  "stripePriceIds": ["price_xxx", "price_yyy"]  // ⚠️ Stripe Connect account prices
}
```

**Headers:**
- `Authorization: Bearer {FRONTEND_API_KEY}` ✅ Required
- `Content-Type: application/json` ✅ Required
- `Idempotency-Key: {campaignId}` ✅ Optional but recommended
- `X-Signature: sha256=...` ⚠️ Optional (HMAC not yet implemented)

### ✅ Campaign Storage (`lib/campaigns.ts`)

**Status:** Supports `stripePriceIds` field

**Features:**
- ✅ Campaign storage with `stripePriceIds` array
- ✅ Campaign lookup by Stripe price ID
- ✅ Active campaign filtering (status, dates)
- ✅ Product-level campaign matching

### ✅ Checkout Integration (`app/api/checkout/route.ts`)

**Status:** Uses backend endpoint (Stripe Connect)

**Current Flow:**
1. Checkout calls backend: `POST /storefront/{tenant}/checkout`
2. Backend handles campaign price lookup
3. Backend creates Stripe Connect checkout session
4. Campaign prices are automatically applied

**Note:** The checkout route still checks for campaign prices via API (`/api/campaigns/price/{productId}`) as a fallback, but the backend endpoint should handle this automatically.

## Stripe Connect Considerations

### ⚠️ Important: Price IDs are in Connected Account

After Stripe Connect migration:
- Campaign `stripePriceIds` are created in the **connected account**
- These price IDs are **not** in the platform account
- Backend checkout endpoint handles the account context automatically

### ✅ Verification Checklist

- [x] Sync endpoint accepts `stripePriceIds` array
- [x] Sync endpoint logs price ID count
- [x] Campaign storage supports `stripePriceIds`
- [x] Checkout uses backend endpoint (Stripe Connect)
- [ ] Verify backend creates prices in connected account
- [ ] Verify backend uses correct account context in checkout

## Debugging Steps

### Step 1: Verify Sync Endpoint

Test the sync endpoint:
```bash
curl -X POST https://yourstore.com/api/campaigns/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Idempotency-Key: test-123" \
  -d '{
    "campaignId": "test",
    "name": "Test Campaign",
    "status": "active",
    "stripePriceIds": ["price_test123"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Campaign synced successfully",
  "campaignId": "test",
  "idempotencyKey": "test-123",
  "stripePriceIdsCount": 1
}
```

### Step 2: Check Backend Logs

When creating a campaign in admin portal, check backend logs for:
```
Frontend sync result: { success: true }
```

### Step 3: Verify Price IDs in Stripe

1. Check campaign `stripePriceIds` in admin portal
2. Verify prices exist in Stripe Dashboard → Connected Accounts → Your Account → Products
3. If prices are missing, check backend campaign creation logs

### Step 4: Test Checkout

1. Add product with campaign to cart
2. Go to checkout
3. Verify campaign price is applied OR promotion code field is visible
4. Check backend logs for campaign price lookup

## Common Issues

### Issue 1: Price IDs Missing

**Symptom:** Campaign syncs but `stripePriceIds` is empty

**Possible Causes:**
- Backend failed to create prices in connected account
- Campaign created before Stripe Connect migration
- Stripe API error during price creation

**Solution:**
- Check backend campaign creation logs
- Recreate campaign in admin portal
- Verify Stripe Connect account is properly configured

### Issue 2: Prices in Wrong Account

**Symptom:** Campaign prices exist but checkout fails

**Possible Causes:**
- Prices created in platform account instead of connected account
- Backend not using correct account context

**Solution:**
- Verify backend uses `stripeAccount` parameter
- Recreate campaign prices in connected account
- Check backend checkout endpoint uses correct account

### Issue 3: Sync Endpoint Not Called

**Symptom:** Campaign created but not syncing to frontend

**Possible Causes:**
- Backend sync URL misconfigured
- API key mismatch
- Network/firewall issue

**Solution:**
- Verify `frontendSync.syncUrl` in admin portal
- Verify `frontendSync.apiKey` matches `FRONTEND_API_KEY`
- Check backend logs for sync attempts
- Test sync endpoint manually

## Next Steps

1. ✅ Sync endpoint updated with better logging
2. ⏳ Verify backend creates prices in connected account
3. ⏳ Verify backend checkout uses correct account context
4. ⏳ Test end-to-end campaign flow
5. ⏳ Monitor logs for sync issues

## Testing Checklist

- [ ] Create campaign in admin portal
- [ ] Verify backend logs show sync success
- [ ] Verify frontend logs show sync received
- [ ] Verify campaign stored with `stripePriceIds`
- [ ] Verify prices exist in Stripe Connect account
- [ ] Add product to cart
- [ ] Verify checkout uses campaign price
- [ ] Complete test purchase
- [ ] Verify order shows campaign discount

