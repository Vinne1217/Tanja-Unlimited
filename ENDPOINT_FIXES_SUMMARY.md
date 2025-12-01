# Endpoint Fixes Summary

## Changes Made

### 1. Fixed API Endpoint Configuration

**Files Updated:**
- ✅ `lib/source.ts` - Changed default tenant from `'tanja'` to `'tanjaunlimited'`
- ✅ `lib/catalog.ts` - Updated to use correct tenant ID and support both storefront and catalog endpoints
- ✅ `app/api/checkout/route.ts` - Updated to use Google Cloud Run URL instead of Render URL

### 2. Key Changes

#### `lib/source.ts`
- Default tenant now: `'tanjaunlimited'` (was `'tanja'`)

#### `lib/catalog.ts`
- Uses `tanjaunlimited` tenant ID (was hardcoded `tanja`)
- Tries storefront endpoints first: `/storefront/tanjaunlimited/products`
- Falls back to catalog endpoints: `/v1/tenants/tanjaunlimited/catalog/products`
- Handles different response formats from both APIs
- Adds error logging for debugging

#### `app/api/checkout/route.ts`
- Website metadata now uses `NEXT_PUBLIC_BASE_URL` or Google Cloud Run URL
- Removed hardcoded `tanja-unlimited.onrender.com`

---

## Important URLs

### Tanja Website (Google Cloud Run)
- **Base URL:** `https://tanja-unlimited-809785351172.europe-north1.run.app`
- **Webhook Endpoint:** `https://tanja-unlimited-809785351172.europe-north1.run.app/api/campaigns/webhook`
- **Product Pages:** `https://tanja-unlimited-809785351172.europe-north1.run.app/webshop/[category]/[product-id]`

### Source Database API (Google Cloud Run)
- **Base URL:** `https://source-database-809785351172.europe-north1.run.app`
- **Storefront API:** `https://source-database-809785351172.europe-north1.run.app/storefront/tanjaunlimited/products`
- **Catalog API:** `https://source-database-809785351172.europe-north1.run.app/v1/tenants/tanjaunlimited/catalog/products`

---

## What This Fixes

1. ✅ Products will now fetch from correct tenant (`tanjaunlimited` instead of `tanja`)
2. ✅ Website will try storefront API first, then fallback to catalog API
3. ✅ Checkout metadata uses correct website URL
4. ✅ Customer portal webhook URL updated to Google Cloud Run

---

## Next Steps

1. **Deploy to Google Cloud Run** - Deploy the updated code
2. **Test endpoints** - Use `ENDPOINT_TESTING_GUIDE.md` to verify everything works
3. **Update Customer Portal** - See `CUSTOMER_PORTAL_WEBHOOK_URL_UPDATE.md` for instructions
4. **Verify products appear** - Check `/webshop/tanja-jacket` shows products

---

## Testing Checklist

- [ ] Deploy updated code to Google Cloud Run
- [ ] Test storefront endpoint: `GET /storefront/tanjaunlimited/products`
- [ ] Test catalog endpoint: `GET /v1/tenants/tanjaunlimited/catalog/products`
- [ ] Visit website: `https://tanja-unlimited-809785351172.europe-north1.run.app/webshop/tanja-jacket`
- [ ] Verify products are displayed (not "0 products available")
- [ ] Test webhook: `POST /api/campaigns/webhook` with ping action
- [ ] Update customer portal webhook URL to Google Cloud Run URL

---

## Files Created/Updated

### Updated Files
- `lib/source.ts`
- `lib/catalog.ts`
- `app/api/checkout/route.ts`
- `ENDPOINT_TESTING_GUIDE.md`

### New Files
- `CUSTOMER_PORTAL_WEBHOOK_URL_UPDATE.md` - Instructions for customer portal team
- `ENDPOINT_FIXES_SUMMARY.md` - This file

