# Inventory Webhook Implementation - Complete

## ✅ Implementation Status

The inventory webhook system is now fully implemented and ready for testing.

---

## How It Works

### **Webhook Flow:**

```
Customer Portal
    ↓
    Sends: POST /api/campaigns/webhook
    Action: "inventory.updated" | "inventory.created" | "inventory.deleted"
    ↓
Tanja Webhook Handler
    ↓
    1. Validates authentication (FRONTEND_API_KEY)
    2. Maps product ID (LJSf → ljsf-001)
    3. Stores in in-memory inventory
    4. Revalidates product pages
    ↓
Frontend Components
    ↓
    Query /api/inventory/status
    ↓
    Returns inventory from in-memory storage
    ↓
    Displays stock status on product page
```

---

## Webhook Endpoint

**URL:** `POST https://tanja-unlimited.onrender.com/api/campaigns/webhook`  
**Authentication:** `Authorization: Bearer <FRONTEND_API_KEY>`

### **Supported Actions:**

- `inventory.updated` - Stock level changed
- `inventory.created` - New product added to inventory
- `inventory.deleted` - Product removed from inventory

### **Payload Format:**

```json
{
  "action": "inventory.updated",
  "inventory": {
    "productId": "ljsf-001",  // or "LJSf" (will be mapped automatically)
    "name": "Long Jacket Silk fitted (LJSf)",
    "sku": "LJSf",
    "stock": 5,
    "status": "low_stock",  // "in_stock" | "low_stock" | "out_of_stock"
    "outOfStock": false,
    "lowStock": true,
    "lowStockThreshold": 10,
    "isActive": true,
    "imageUrl": "https://...",
    "stripePriceId": "price_...",
    "variants": []
  },
  "timestamp": "2025-01-27T14:23:48.278Z"
}
```

### **Response:**

```json
{
  "success": true,
  "message": "Inventory updated processed",
  "productId": "ljsf-001",
  "originalProductId": "LJSf"
}
```

---

## Product ID Mapping

The webhook automatically maps customer portal product IDs to Tanja product IDs:

| Customer Portal ID | Tanja Product ID |
|-------------------|-----------------|
| `LJSf` | `ljsf-001` |
| `SJS` | `sjs-001` |
| `SJCilW` | `sjcilw-001` |
| `NJCilW` | `njcilw-001` |
| `LJCkilS` | `ljckils-001` |
| `LJCfilS` | `ljcfils-001` |

**Note:** If no mapping is found, the original product ID is used (for catalog products).

---

## Implementation Details

### **1. Webhook Handler** (`app/api/campaigns/webhook/route.ts`)

- ✅ Handles `action.startsWith('inventory.')`
- ✅ Maps product IDs automatically
- ✅ Stores inventory in in-memory storage
- ✅ Revalidates product pages
- ✅ Supports `inventory.updated`, `inventory.created`, `inventory.deleted`

### **2. Inventory Storage** (`lib/inventory.ts`)

- ✅ In-memory Map storage (fast access)
- ✅ Persists until server restart
- ✅ Can be upgraded to Source database later

### **3. Status Endpoint** (`app/api/inventory/status/route.ts`)

- ✅ Queries in-memory storage first
- ✅ Falls back to Source API if no in-memory data
- ✅ Returns inventory status to frontend

### **4. Frontend Components**

- ✅ `StockStatus` component displays stock badges
- ✅ `BuyNowButton` disables when out of stock
- ✅ `ProductPurchase` component checks stock

---

## Testing

### **1. Test Webhook Endpoint**

```bash
curl -X POST https://tanja-unlimited.onrender.com/api/campaigns/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FRONTEND_API_KEY" \
  -d '{
    "action": "inventory.updated",
    "inventory": {
      "productId": "ljsf-001",
      "stock": 0,
      "status": "out_of_stock",
      "outOfStock": true,
      "name": "Long Jacket Silk fitted (LJSf)"
    },
    "timestamp": "2025-01-27T14:23:48.278Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Inventory updated processed",
  "productId": "ljsf-001",
  "originalProductId": "ljsf-001"
}
```

### **2. Test with Product ID Mapping**

```bash
curl -X POST https://tanja-unlimited.onrender.com/api/campaigns/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FRONTEND_API_KEY" \
  -d '{
    "action": "inventory.updated",
    "inventory": {
      "productId": "LJSf",
      "stock": 5,
      "status": "low_stock",
      "lowStock": true,
      "name": "Long Jacket Silk fitted (LJSf)"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Inventory updated processed",
  "productId": "ljsf-001",
  "originalProductId": "LJSf"
}
```

### **3. Test Status Endpoint**

After sending webhook, test status:

```bash
curl "https://tanja-unlimited.onrender.com/api/inventory/status?productId=ljsf-001"
```

**Expected Response:**
```json
{
  "productId": "ljsf-001",
  "stock": 0,
  "status": "out_of_stock",
  "outOfStock": true,
  "hasData": true
}
```

### **4. Test Product Page**

Visit: `https://tanja-unlimited.onrender.com/webshop/tanja-jacket/ljsf-001`

**Should see:**
- Stock badge: "Slutsåld" (red)
- "Buy Now" button disabled
- Button text: "Slutsåld"

---

## Logs to Check

### **Render Logs (After Webhook):**

```
📦 Inventory updated received: {
  originalProductId: "LJSf",
  mappedProductId: "ljsf-001",
  stock: 0,
  status: "out_of_stock"
}
✅ Inventory updated processed for ljsf-001
```

### **Render Logs (After Status Request):**

```
📊 Inventory status requested for product: ljsf-001
✅ Inventory status for ljsf-001: {
  stock: 0,
  status: "out_of_stock",
  outOfStock: true
}
```

---

## Status Values

### **Status Calculation:**

- If `status` is provided → use it
- If `stock === 0` → `status = "out_of_stock"`
- If `lowStock === true` → `status = "low_stock"`
- Otherwise → `status = "in_stock"`

### **outOfStock Flag:**

- If `outOfStock` is provided → use it
- If `status === "out_of_stock"` → `outOfStock = true`
- If `stock === 0` → `outOfStock = true`
- Otherwise → `outOfStock = false`

---

## Summary

**✅ Implementation Complete:**
- Webhook handler supports inventory actions
- Product ID mapping works automatically
- Inventory stored in-memory (fast access)
- Frontend components ready to display stock status
- Page revalidation triggers on updates

**✅ Ready for Testing:**
- Customer portal can send inventory webhooks
- Webhook processes and stores inventory
- Frontend displays stock status immediately
- All product ID mappings configured

**Status:** ✅ Ready for Production Testing

---

Last Updated: January 27, 2025


