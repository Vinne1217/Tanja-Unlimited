# API Endpoint Testing Guide

## Overview

This guide helps you test the product API endpoints to verify they're working correctly after the recent updates.

## Prerequisites

- Access to Google Cloud Console (to check environment variables)
- Access to Source Database API
- Terminal/command line access

---

## Step 1: Verify Environment Variables in Google Cloud Run

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Run** → **tanja-unlimited** service
3. Check these environment variables:
   - `SOURCE_TENANT_ID` should be `tanjaunlimited`
   - `SOURCE_DATABASE_URL` should be `https://source-database-809785351172.europe-north1.run.app` (Source Database API - Google Cloud Run)
   - `NEXT_PUBLIC_BASE_URL` should be `https://tanja-unlimited-809785351172.europe-north1.run.app` (Tanja website - Google Cloud Run)

**Important:** 
- ✅ Source Database API is on Google Cloud Run (`source-database-809785351172.europe-north1.run.app`)
- ✅ Tanja Website is on Google Cloud Run (`tanja-unlimited-809785351172.europe-north1.run.app`)

---

## Step 2: Test Storefront Endpoints (New API)

### Test 2.1: Get All Products

```bash
curl -X GET "https://source-database-809785351172.europe-north1.run.app/storefront/tanjaunlimited/products" \
  -H "X-Tenant: tanjaunlimited" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "...",
      "title": "...",
      "baseSku": "...",
      "priceRange": { "min": 219800, "max": 399800 },
      "inStock": true,
      "images": [...]
    }
  ]
}
```

**If this works:** ✅ Storefront API is available, website will use it  
**If this fails (404/500):** ⚠️ Storefront API not available, will fallback to catalog API

### Test 2.2: Get Single Product by SKU

```bash
# Replace LJCfilG with an actual product SKU from your customer portal
curl -X GET "https://source-database-809785351172.europe-north1.run.app/storefront/tanjaunlimited/product/LJCfilG" \
  -H "X-Tenant: tanjaunlimited" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "product": {
    "id": "...",
    "title": "...",
    "baseSku": "LJCfilG",
    "variants": [...],
    "images": [...]
  }
}
```

### Test 2.3: Get Categories

```bash
curl -X GET "https://source-database-809785351172.europe-north1.run.app/storefront/tanjaunlimited/categories?locale=sv" \
  -H "X-Tenant: tanjaunlimited" \
  -H "Content-Type: application/json"
```

---

## Step 3: Test Catalog Endpoints (Fallback API)

### Test 3.1: Get All Products (Catalog)

```bash
curl -X GET "https://source-database-809785351172.europe-north1.run.app/v1/tenants/tanjaunlimited/catalog/products?locale=sv&limit=10" \
  -H "X-Tenant: tanjaunlimited" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "items": [
    {
      "id": "...",
      "name": "...",
      "price": 219800,
      "currency": "SEK",
      "images": [...]
    }
  ],
  "nextCursor": "..."
}
```

**If this works:** ✅ Catalog API is available as fallback  
**If this fails:** ❌ Need to check with Source Database team

### Test 3.2: Get Single Product (Catalog)

```bash
# Replace with actual product ID
curl -X GET "https://source-database-809785351172.europe-north1.run.app/v1/tenants/tanjaunlimited/catalog/products/ljsf-001?locale=sv" \
  -H "X-Tenant: tanjaunlimited" \
  -H "Content-Type: application/json"
```

### Test 3.3: Get Categories (Catalog)

```bash
curl -X GET "https://source-database-809785351172.europe-north1.run.app/v1/tenants/tanjaunlimited/catalog/categories?locale=sv" \
  -H "X-Tenant: tanjaunlimited" \
  -H "Content-Type: application/json"
```

---

## Step 4: Test Website Endpoints

**Website URL:** `https://tanja-unlimited-809785351172.europe-north1.run.app` (Google Cloud Run)

### Test 4.1: Test Product Listing Page

Visit: `https://tanja-unlimited-809785351172.europe-north1.run.app/webshop/tanja-jacket`

**What to check:**
- ✅ Products are displayed (not "0 products available")
- ✅ Product images load correctly
- ✅ Product names and prices are shown
- ✅ No console errors in browser DevTools

### Test 4.2: Check Browser Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Visit `/webshop/tanja-jacket`
4. Look for API calls:
   - Should see calls to `/storefront/tanjaunlimited/products` OR
   - Should see calls to `/v1/tenants/tanjaunlimited/catalog/products`
5. Check response status:
   - ✅ `200 OK` = Success
   - ❌ `404 Not Found` = Endpoint doesn't exist
   - ❌ `401 Unauthorized` = Missing/invalid X-Tenant header
   - ❌ `500 Internal Server Error` = Server error

### Test 4.3: Test Product Detail Page

Visit: `https://tanja-unlimited-809785351172.europe-north1.run.app/webshop/tanja-jacket/[product-id]`

### Test 4.4: Test Webhook Endpoint (for Customer Portal)

The customer portal should send webhooks to:

```bash
curl -X POST "https://tanja-unlimited-809785351172.europe-north1.run.app/api/campaigns/webhook" \
  -H "Authorization: Bearer YOUR_FRONTEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "ping"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Pong"
}
```

**This is the URL the customer portal should use for webhooks!**

**What to check:**
- ✅ Product details load correctly
- ✅ Product image displays
- ✅ Price and description shown
- ✅ Variants (if any) are selectable

---

## Step 5: Check Server Logs

### In Google Cloud Run:

1. Go to **Cloud Run** → **tanja-unlimited** → **Logs**
2. Look for:
   - ✅ `Storefront endpoint failed, trying catalog endpoint` = Fallback working
   - ✅ `Failed to fetch products: 404` = Endpoint doesn't exist
   - ✅ `Failed to fetch products: 401` = Authentication issue
   - ✅ `Failed to fetch products: 500` = Server error

### What the logs tell you:

- **If you see "Storefront endpoint failed":** The storefront API doesn't exist yet, but fallback is working
- **If you see "Failed to fetch products: 404":** Both endpoints failed, need to check with Source Database team
- **If you see no errors:** ✅ Everything is working!

---

## Step 6: Verify Products Are Created in Customer Portal

1. Log into Source Customer Portal
2. Check that products exist:
   - Products should have `baseSku` (e.g., `LJCfilG`)
   - Products should be published/active
   - Products should have images
3. Verify tenant ID matches:
   - Products should be associated with tenant `tanjaunlimited`

---

## Troubleshooting

### Issue: "0 products available" on website

**Possible causes:**
1. ❌ API endpoints returning empty arrays
2. ❌ Wrong tenant ID in API calls
3. ❌ Products not created in customer portal
4. ❌ Products not published/active

**Solution:**
- Run Step 2 and Step 3 tests above
- Check server logs (Step 5)
- Verify products exist in customer portal (Step 6)

### Issue: 401 Unauthorized errors

**Possible causes:**
1. ❌ Missing `X-Tenant` header
2. ❌ Wrong tenant ID value

**Solution:**
- Verify `SOURCE_TENANT_ID=tanjaunlimited` in Google Cloud Run
- Check that `X-Tenant: tanjaunlimited` header is being sent

### Issue: 404 Not Found errors

**Possible causes:**
1. ❌ Storefront endpoints don't exist yet (expected, will fallback)
2. ❌ Catalog endpoints have wrong path
3. ❌ Wrong tenant ID in URL path

**Solution:**
- Check if catalog endpoints work (Step 3)
- Verify tenant ID in URL matches `tanjaunlimited`

---

## Expected Behavior After Fix

✅ **Website should:**
1. Try storefront endpoints first (`/storefront/tanjaunlimited/products`)
2. Automatically fallback to catalog endpoints if storefront fails
3. Display products from customer portal
4. Show correct product counts (not "0 products available")

✅ **Logs should show:**
- Either successful storefront API calls, OR
- "Storefront endpoint failed, trying catalog endpoint" followed by successful catalog calls

---

## Next Steps After Testing

1. **If storefront endpoints work:** ✅ No changes needed, website will use them
2. **If only catalog endpoints work:** ✅ Website will use catalog endpoints (fallback)
3. **If both fail:** ❌ Contact Source Database team to verify:
   - API endpoints are available
   - Tenant ID `tanjaunlimited` is configured correctly
   - Products exist in the database

## Important: Update Customer Portal Webhook URL

**The customer portal needs to be updated to use the new Google Cloud Run URL:**

- ❌ Old: `https://tanja-unlimited.onrender.com/api/campaigns/webhook`
- ✅ New: `https://tanja-unlimited-809785351172.europe-north1.run.app/api/campaigns/webhook`

See `CUSTOMER_PORTAL_WEBHOOK_URL_UPDATE.md` for detailed instructions.

---

## Quick Test Script

Save this as `test-endpoints.sh`:

```bash
#!/bin/bash

TENANT="tanjaunlimited"
BASE_URL="https://source-database-809785351172.europe-north1.run.app"

echo "Testing Storefront Endpoints..."
echo "================================"

echo -e "\n1. Testing /storefront/$TENANT/products"
curl -s -X GET "$BASE_URL/storefront/$TENANT/products" \
  -H "X-Tenant: $TENANT" \
  -H "Content-Type: application/json" | jq '.success, .products | length' 2>/dev/null || echo "Failed or invalid JSON"

echo -e "\n2. Testing /storefront/$TENANT/categories"
curl -s -X GET "$BASE_URL/storefront/$TENANT/categories?locale=sv" \
  -H "X-Tenant: $TENANT" \
  -H "Content-Type: application/json" | jq '.success' 2>/dev/null || echo "Failed or invalid JSON"

echo -e "\n\nTesting Catalog Endpoints (Fallback)..."
echo "=========================================="

echo -e "\n3. Testing /v1/tenants/$TENANT/catalog/products"
curl -s -X GET "$BASE_URL/v1/tenants/$TENANT/catalog/products?locale=sv&limit=5" \
  -H "X-Tenant: $TENANT" \
  -H "Content-Type: application/json" | jq '.items | length' 2>/dev/null || echo "Failed or invalid JSON"

echo -e "\n4. Testing /v1/tenants/$TENANT/catalog/categories"
curl -s -X GET "$BASE_URL/v1/tenants/$TENANT/catalog/categories?locale=sv" \
  -H "X-Tenant: $TENANT" \
  -H "Content-Type: application/json" | jq 'length' 2>/dev/null || echo "Failed or invalid JSON"

echo -e "\n\nDone!"
```

Run with: `chmod +x test-endpoints.sh && ./test-endpoints.sh`

