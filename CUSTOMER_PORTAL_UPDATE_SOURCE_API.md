# Update to Customer Portal Team - Inventory System Changes

Hi Source Portal Team,

We've updated our inventory system to use a simpler approach that matches how our campaign system works. Here's what changed:

---

## ✅ New Approach: Source API Direct Fetch (Like Campaigns)

**What Changed:**
- We now fetch inventory directly from Source API (same pattern as campaigns)
- No separate webhook endpoint needed
- Uses the same infrastructure as campaigns

**Why This Is Better:**
- ✅ Simpler architecture
- ✅ Consistent with campaigns
- ✅ Persistent storage in Source database
- ✅ Real-time data on each page load

---

## 📋 What You Need to Do

### **Required: Store Inventory in Source Database**

When inventory changes (purchase, restock, etc.), store the data in Source database:

**Database Location:** Same database as campaigns  
**Tenant ID:** `tanjaunlimited`  
**Product ID:** Use Tanja product IDs (e.g., `ljsf-001`, `sjs-001`)

**Expected Data Structure:**
```json
{
  "tenantId": "tanjaunlimited",
  "productId": "ljsf-001",  // Tanja product ID (not LJSf)
  "stock": 5,
  "status": "low_stock",  // "in_stock" | "low_stock" | "out_of_stock"
  "lowStock": true,
  "outOfStock": false,
  "name": "Long Jacket Silk fitted (LJSf)",
  "sku": "LJSf",
  "lastUpdated": "2025-11-17T14:23:48.278Z"
}
```

**Source API Endpoint (for storage):**
- `/v1/inventory` or `/v1/inventarier` (whichever you use)
- Store with `tenantId: "tanjaunlimited"` and `productId: "ljsf-001"`

### **Optional: Send Webhook for Page Revalidation**

You can optionally send a webhook to trigger page revalidation (inventory is already in Source DB):

**Endpoint:** `POST https://tanja-unlimited.onrender.com/api/campaigns/webhook`  
**Authentication:** `Authorization: Bearer <FRONTEND_API_KEY>` (same as campaigns)

**Payload:**
```json
{
  "action": "inventory.updated",
  "inventory": {
    "productId": "ljsf-001",
    "stock": 5,
    "status": "low_stock"
  }
}
```

**Note:** This is optional - the frontend will fetch fresh data on the next page load anyway. The webhook just triggers immediate page revalidation.

---

## 🔄 How It Works Now

**Flow:**
1. Customer makes purchase → Inventory updated in Source Portal
2. Source Portal stores inventory in Source Database
3. (Optional) Source Portal sends webhook for revalidation
4. Customer visits product page → Frontend queries Source API
5. Source API returns inventory data
6. Product page displays stock status ("I lager", "Snart slutsåld", "Slutsåld")

**No separate endpoint needed!** Just store in Source database and we'll fetch it.

---

## 📊 Product ID Mapping

**Important:** Use Tanja product IDs (not your SKU format):

| Your SKU | Tanja Product ID | Product Name |
|----------|-----------------|--------------|
| `LJSf` | `ljsf-001` | Long Jacket Silk fitted (LJSf) |
| `SJS` | `sjs-001` | Short Jacket Silk (SJS) |
| `SJCilW` | `sjcilw-001` | Short jacket Cotton Imperial Line White |
| `NJCilW` | `njcilw-001` | Nehru Jacket Cotton imperial line White |
| `LJCkilS` | `ljckils-001` | Long Jacket Cotton knee imperial line Silver |
| `LJCfilS` | `ljcfils-001` | Long Jacket Cotton fitted imperial line Silver |

**Store inventory with Tanja product IDs** (e.g., `productId: "ljsf-001"`).

---

## 🧪 Testing Steps

### **1. Store Test Inventory**

Store inventory in Source database for `ljsf-001`:
```json
{
  "tenantId": "tanjaunlimited",
  "productId": "ljsf-001",
  "stock": 0,
  "status": "out_of_stock",
  "outOfStock": true
}
```

### **2. Verify Source API Returns Data**

Test that Source API returns the inventory:
```bash
curl "https://source-database.onrender.com/v1/inventory?tenantId=tanjaunlimited&productId=ljsf-001" \
  -H "X-Tenant: tanjaunlimited"
```

Expected: Returns inventory data for `ljsf-001`

### **3. Test Frontend Display**

Visit product page: `https://tanja-unlimited.onrender.com/webshop/tanja-jacket/ljsf-001`

**Should see:**
- Stock badge: "Slutsåld" (red)
- "Buy Now" button disabled
- Button text: "Slutsåld"

### **4. Test Status Endpoint**

```bash
curl "https://tanja-unlimited.onrender.com/api/inventory/status?productId=ljsf-001"
```

Expected:
```json
{
  "productId": "ljsf-001",
  "stock": 0,
  "status": "out_of_stock",
  "outOfStock": true,
  "hasData": true
}
```

---

## 📝 Summary of Changes

**What We Changed:**
- ✅ Now fetch inventory from Source API (like campaigns)
- ✅ No separate `/api/inventory/sync` endpoint needed
- ✅ Uses same infrastructure as campaigns

**What You Need to Do:**
- ✅ Store inventory in Source database with Tanja product IDs
- ✅ (Optional) Send webhook to `/api/campaigns/webhook` for revalidation

**What Stays the Same:**
- ✅ Same authentication (`FRONTEND_API_KEY`)
- ✅ Same webhook endpoint (just add inventory action)
- ✅ Product ID mapping (we handle it)

---

## 🚀 Next Steps

1. **Update your inventory storage** to use Tanja product IDs (`ljsf-001` instead of `LJSf`)
2. **Store inventory in Source database** when inventory changes
3. **Test with one product** first (e.g., `ljsf-001`)
4. **Verify frontend displays** correct stock status
5. **Roll out to all products** once confirmed working

---

## ❓ Questions?

If you need clarification on:
- Source API endpoint structure
- Product ID mapping
- Data format
- Testing

Just let us know!

---

**Status:** ✅ Ready for Implementation  
**Timeline:** Can start storing inventory in Source database immediately  
**Dependencies:** None - just store in Source DB and we'll fetch it

Thanks!  
Tanja Unlimited Team


