# Variant Inventory Troubleshooting Guide

## Problem
All sizes show "Slutsåld" (Sold out) even though customer portal shows stock available.

## Root Cause
The `BuyNowButton` component was checking static `stock` values from the product definition (hardcoded to 0) instead of synced inventory from the customer portal.

## Solution Implemented

### 1. Updated Inventory Status API
- Now supports querying by `stripePriceId` for variant inventory
- Endpoint: `/api/inventory/status?productId=ljcfilg-001&stripePriceId=price_1SX5xtP6vvUUervC7sVlRnoi`

### 2. Updated BuyNowButton Component
- Now fetches inventory for each variant by `stripePriceId`
- Uses synced inventory data instead of static product definition values
- Shows correct stock status for each size

### 3. Updated Webhook Handler
- Now supports both `stripePriceId` and `priceId` fields (customer portal may send either)
- Better logging to help troubleshoot variant processing
- Handles `articleNumber`, `sku`, `key`, and `size` fields from customer portal

### 4. Updated Inventory Mapping
- Added mapping for LJCfilG → ljcfilg-001
- Added mappings for other new products (LJCkilG, LJCkilP, LJCfilD)

## How to Verify Inventory is Synced

### Step 1: Check if Webhook is Receiving Variant Data

The customer portal should send inventory updates with variants array. The webhook handler supports multiple field names:

**Customer Portal can send:**
- `productId`: "LJCfilG" (base SKU) - will be mapped to "ljcfilg-001"
- `variants[]` array with:
  - `stripePriceId` OR `priceId` (either field works)
  - `key` OR `size` (size identifier: "XS", "S", "M", "L", "XL")
  - `sku` OR `articleNumber` (variant SKU)
  - `stock`: number (stock level)
  - `status`: "in_stock" | "low_stock" | "out_of_stock"
  - `outOfStock`: boolean
  - `lowStock`: boolean

**Example payload:**
```json
{
  "action": "inventory.updated",
  "inventory": {
    "productId": "LJCfilG",
    "name": "Long Jacket Cotton Fitted Imperial Line Gold (LJCfilG)",
    "variants": [
      {
        "key": "XS",
        "size": "XS",
        "sku": "LJCfilG-XS",
        "articleNumber": "LJCfilG-XS",
        "stripePriceId": "price_1SX5xtP6vvUUervC7sVlRnoi",
        "priceId": "price_1SX5xtP6vvUUervC7sVlRnoi",
        "stock": 10,
        "status": "in_stock",
        "outOfStock": false,
        "lowStock": false
      },
      {
        "key": "S",
        "size": "S",
        "sku": "LJCfilG-S",
        "articleNumber": "LJCfilG-S",
        "stripePriceId": "price_1SX5yeP6vvUUervC41kmP3Oo",
        "stock": 10,
        "status": "in_stock",
        "outOfStock": false
      },
      // ... M, L, XL
    ]
  }
}
```

### Step 2: Check Server Logs

After sending webhook, check server logs for:

**Expected log messages:**
```
📦 Processing 5 variants for product ljcfilg-001
📦 Variant inventory updated: {
  key: 'XS',
  stripePriceId: 'price_1SX5xtP6vvUUervC7sVlRnoi',
  stock: 10,
  status: 'in_stock',
  outOfStock: false,
  inventoryId: 'price_price_1SX5xtP6vvUUervC7sVlRnoi'
}
```

**If variant is missing stripePriceId:**
```
⚠️ Variant missing stripePriceId/priceId: {
  key: 'XS',
  sku: 'LJCfilG-XS',
  articleNumber: 'LJCfilG-XS',
  size: 'XS'
}
```

### Step 3: Test Inventory API Directly

Test variant inventory endpoint:
```bash
GET /api/inventory/status?productId=ljcfilg-001&stripePriceId=price_1SX5xtP6vvUUervC7sVlRnoi
```

Expected response:
```json
{
  "productId": "ljcfilg-001",
  "stripePriceId": "price_1SX5xtP6vvUUervC7sVlRnoi",
  "stock": 10,
  "status": "in_stock",
  "outOfStock": false,
  "hasData": true,
  "source": "in_memory"
}
```

### Step 4: Check Browser Console

Open browser console on product page and check for:
- Network requests to `/api/inventory/status` with `stripePriceId` parameter
- Any errors fetching variant inventory

## Troubleshooting Steps

### If variants still show "Slutsåld":

1. **Verify webhook is being sent**
   - Check customer portal logs
   - Verify webhook endpoint: `POST /api/campaigns/webhook`
   - Verify authentication header: `Authorization: Bearer <FRONTEND_API_KEY>`

2. **Verify webhook payload format**
   - Ensure `variants` array is included
   - Each variant must have `stripePriceId` and `stock` fields
   - `stock` should be > 0

3. **Check server logs**
   - Look for "Variant inventory updated" messages
   - Verify no errors processing variants

4. **Verify Stripe Price IDs match**
   - Compare `stripePriceId` in webhook payload with product definition
   - Ensure they match exactly (case-sensitive)

5. **Clear browser cache**
   - Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
   - Check if inventory updates after refresh

6. **Check if inventory is stored**
   - Inventory is stored in-memory by key: `price_${stripePriceId}`
   - Server restart will clear in-memory inventory
   - Need to send webhook again after restart

## Expected Behavior After Fix

✅ Each size shows correct stock status based on synced inventory  
✅ Sizes with stock > 0 are selectable  
✅ Sizes with stock = 0 show "— Slutsåld" and are disabled  
✅ Add to Cart button enables/disables based on selected variant stock

## Next Steps

1. Send inventory webhook from customer portal with variant data
2. Verify webhook is received and processed (check server logs)
3. Refresh product page and verify sizes show correct stock status
4. If still showing "Slutsåld", follow troubleshooting steps above

