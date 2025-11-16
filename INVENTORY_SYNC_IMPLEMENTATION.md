# Inventory Sync Implementation - Ready for Testing

## ✅ What We've Implemented

We've successfully implemented the inventory sync endpoint and integrated it throughout the Tanja Unlimited website. Here's what's now in place:

### 1. **Inventory Sync Endpoint** (`/api/inventory/sync`)
- ✅ Accepts POST requests from customer portal
- ✅ Uses same authentication as campaign webhooks (`FRONTEND_API_KEY`)
- ✅ Validates payload structure
- ✅ Stores inventory data (stock, status, lowStock, outOfStock flags)
- ✅ Automatically revalidates product pages when inventory updates

### 2. **Inventory Status API** (`/api/inventory/status`)
- ✅ GET endpoint to query inventory for any product
- ✅ Returns stock count, status, and flags
- ✅ Used by frontend components to display real-time stock status

### 3. **Frontend Integration**
- ✅ **StockStatus Component**: Displays stock badges on product pages
  - "I lager" (green) - In stock
  - "Snart slutsåld" (yellow) - Low stock
  - "Slutsåld" (red) - Out of stock
- ✅ **BuyNowButton**: Automatically disabled when out of stock
- ✅ **ProductPurchase**: Updated for collection pages with stock checks
- ✅ All product pages now show real-time inventory status

### 4. **Storage**
- Currently using in-memory Map for simplicity
- Can be easily upgraded to Source database or Redis if needed
- Data persists across requests until server restart

---

## 🔧 Configuration Required

### On Your Side (Customer Portal)

Please verify these settings in your `kundportal.tenantconfigs` for `tenantId: "tanjaunlimited"`:

```javascript
{
  tenantId: "tanjaunlimited",
  inventorySync: {
    enabled: true,
    syncUrl: "https://tanja-unlimited.onrender.com/api/inventory/sync",
    apiKey: "<same-value-as-FRONTEND_API_KEY>"
  }
}
```

**Important:** The `apiKey` must match the `FRONTEND_API_KEY` environment variable in Tanja's Render deployment (same key used for campaign webhooks).

---

## 📋 Expected Payload Format

The endpoint expects this payload structure:

```json
{
  "tenantId": "tanjaunlimited",
  "item": {
    "id": "ljsf-001",                    // Product ID (required)
    "sku": "LJSF-001",                   // Optional
    "name": "Long Jacket Silk Fitted",   // Optional
    "stock": 5,                           // Current stock count (required)
    "delta": -1,                          // Optional: stock change
    "status": "low_stock",                // Required: "in_stock" | "low_stock" | "out_of_stock"
    "lowStock": true,                    // Optional: boolean flag
    "outOfStock": false                  // Optional: boolean flag
  }
}
```

---

## 🧪 Testing Steps

### 1. **Verify Configuration**
- Check that `syncUrl` points to: `https://tanja-unlimited.onrender.com/api/inventory/sync`
- Verify `apiKey` matches Tanja's `FRONTEND_API_KEY`

### 2. **Test Inventory Update**
- In customer portal, update inventory for a product (e.g., `ljsf-001`)
- Check your logs - should see:
  ```
  ✅ Inventory updated for Long Jacket Silk fitted (LJSf): -1 stock
  ```
- Check Tanja's Render logs - should see:
  ```
  ✅ Inventory synced successfully: { productId: 'ljsf-001', stock: 4, status: 'low_stock' }
  ```

### 3. **Verify Frontend Display**
- Visit product page: `https://tanja-unlimited.onrender.com/webshop/tanja-jacket/ljsf-001`
- Should see stock status badge:
  - "I lager" if `status: "in_stock"`
  - "Snart slutsåld" if `status: "low_stock"`
  - "Slutsåld" if `status: "out_of_stock"`
- "Buy Now" button should be disabled if out of stock

### 4. **Test Out of Stock**
- Set a product to `stock: 0` and `status: "out_of_stock"` in customer portal
- Product page should show "Slutsåld" badge
- "Buy Now" button should be disabled and show "Slutsåld" text

---

## 🔍 Troubleshooting

### If you see `❌ Inventory sync failed: HTTP 503`

**Possible causes:**
1. **Endpoint not deployed** - Check that Tanja's site is running
2. **Wrong URL** - Verify `syncUrl` in your config
3. **Authentication failure** - Check that `apiKey` matches `FRONTEND_API_KEY`

**To debug:**
- Check Tanja's Render logs for the `/api/inventory/sync` endpoint
- Look for authentication errors (401) or validation errors (400)
- Verify the payload structure matches the expected format

### If inventory updates but frontend doesn't show changes

- Product pages are revalidated automatically
- Try hard refresh (Ctrl+F5) or wait a few seconds
- Check browser console for API errors
- Verify product ID matches between portal and website

---

## 📊 Product ID Mapping

Make sure the `item.id` in your payload matches Tanja's product IDs:

| Product ID | Product Name |
|------------|--------------|
| `sjs-001` | Short Jacket Silk (SJS) |
| `ljsf-001` | Long Jacket Silk fitted (LJSf) |
| `sjcilw-001` | Short jacket Cotton Imperial Line White |
| `njcilw-001` | Nehru Jacket Cotton imperial line White |
| `ljckils-001` | Long Jacket Cotton knee imperial line Silver |
| `ljcfils-001` | Long Jacket Cotton fitted imperial line Silver |

For products from the Source catalog (`/collection`), use the product ID from the catalog.

---

## ✅ Success Indicators

When everything is working correctly:

1. **Your logs show:**
   ```
   ✅ Inventory updated for [Product Name]: [stock change]
   ✅ Inventory sync successful (no error)
   ```

2. **Tanja's logs show:**
   ```
   ✅ Inventory synced successfully: { productId: 'xxx', stock: X, status: 'xxx' }
   ```

3. **Frontend shows:**
   - Correct stock status badge on product pages
   - "Buy Now" button disabled when out of stock
   - Stock count displayed (if available)

---

## 🚀 Next Steps

1. **Verify configuration** in customer portal
2. **Test with one product** first (e.g., `ljsf-001`)
3. **Check both logs** (yours and Tanja's) to confirm sync
4. **Verify frontend** displays correct status
5. **Roll out to all products** once confirmed working

---

## 📝 Notes

- Inventory data is currently stored in-memory (resets on server restart)
- This is fine for testing and can be upgraded to persistent storage later
- The system gracefully handles missing inventory data (assumes in stock)
- All endpoints use the same `FRONTEND_API_KEY` for consistency

---

**Status:** ✅ Ready for Testing  
**Endpoint:** `https://tanja-unlimited.onrender.com/api/inventory/sync`  
**Authentication:** `Authorization: Bearer <FRONTEND_API_KEY>`

Let us know once you've tested and we can verify everything is working correctly!

