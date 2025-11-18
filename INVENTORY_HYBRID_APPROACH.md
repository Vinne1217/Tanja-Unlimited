# Inventory System - Hybrid Approach

## Overview

Inventory uses a **hybrid approach** that combines:
1. **Source API** - Primary persistent storage (same pattern as campaigns)
2. **Webhooks** - Real-time in-memory updates for immediate frontend updates
3. **In-memory fallback** - Fast access to webhook-updated inventory

This provides both persistence and real-time responsiveness.

---

## How It Works

### **Architecture:**

```
Customer Portal (Source Portal)
    ↓
    Stores inventory in Source Database (MongoDB)
    ↓
    Sends webhook: POST /api/campaigns/webhook
    Action: "inventory.updated" | "inventory.created" | "inventory.deleted"
    ↓
Tanja Webhook Handler
    ↓
    1. Validates authentication (FRONTEND_API_KEY)
    2. Maps product ID (LJSf → ljsf-001)
    3. Stores in in-memory inventory (fast access)
    4. Revalidates product pages
    ↓
Frontend Components
    ↓
    Query /api/inventory/status?productId=ljsf-001
    ↓
    Status Endpoint:
    1. Tries Source API first (persistent storage)
    2. Falls back to in-memory (webhook updates)
    3. Returns inventory data
    ↓
    Displays stock status on product page
```

**Hybrid Benefits:**
- ✅ **Real-time updates** - Webhooks update in-memory immediately
- ✅ **Persistence** - Source API provides persistent storage
- ✅ **Fast access** - In-memory cache for webhook updates
- ✅ **Resilience** - Falls back gracefully if Source API unavailable

---

## Implementation

### **1. Webhook Handler** (`app/api/campaigns/webhook/route.ts`)

Handles inventory webhooks from customer portal:

```typescript
// Webhook payload
{
  "action": "inventory.updated",
  "inventory": {
    "productId": "LJSf",  // or "ljsf-001" (auto-mapped)
    "stock": 5,
    "status": "low_stock",
    "name": "Long Jacket Silk fitted (LJSf)"
  }
}
```

**What it does:**
- Validates authentication (`FRONTEND_API_KEY`)
- Maps product IDs automatically (LJSf → ljsf-001)
- Stores in in-memory inventory (fast access)
- Revalidates product pages

### **2. Source API Integration** (`lib/inventory-source.ts`)

Fetches inventory from Source API (persistent storage):

```typescript
// Queries Source API
const inventory = await getInventoryFromSource('ljsf-001');
```

**Source API Endpoints:**
- Primary: `/v1/inventory?tenantId=tanjaunlimited&productId=ljsf-001`
- Fallback: `/v1/inventarier?tenantId=tanjaunlimited&productId=ljsf-001`
- Header: `X-Tenant: tanjaunlimited` (matches query parameter)

**Important:** The `X-Tenant` header must match the `tenantId` query parameter.

### **3. Status Endpoint** (`app/api/inventory/status/route.ts`)

Hybrid query logic:

```typescript
// 1. Try Source API first (persistent storage)
let inventory = await getInventoryFromSource(productId);

// 2. Fallback to in-memory (webhook updates)
if (!inventory) {
  inventory = getInventoryStatus(productId); // from in-memory
}

// 3. Return data with source indicator
return {
  ...inventory,
  source: 'source_api' | 'in_memory' | 'default'
};
```

**Response includes `source` field** to indicate data origin:
- `source_api` - Data from Source API (persistent)
- `in_memory` - Data from webhook updates (real-time)
- `default` - No data, assuming in stock

---

## Customer Portal Requirements

### **What Customer Portal Needs to Do:**

1. **Store inventory in Source Database** (MongoDB)
   - When inventory changes, update Source database
   - Use same database as campaigns
   - Store with `tenantId: "tanjaunlimited"` and `productId: "ljsf-001"` (Tanja product ID)

2. **Send webhook for real-time updates**
   - Send `POST /api/campaigns/webhook` with `action: "inventory.updated"`
   - This updates in-memory storage immediately
   - Triggers page revalidation

**Both are recommended:**
- Source API = Persistent storage (survives server restarts)
- Webhooks = Real-time updates (immediate frontend updates)

### **Webhook Payload Format:**

```json
{
  "action": "inventory.updated",
  "inventory": {
    "productId": "LJSf",  // Customer portal ID (auto-mapped to ljsf-001)
    "stock": 5,
    "status": "low_stock",  // "in_stock" | "low_stock" | "out_of_stock"
    "lowStock": true,
    "outOfStock": false,
    "name": "Long Jacket Silk fitted (LJSf)",
    "sku": "LJSf"
  },
  "timestamp": "2025-01-27T14:23:48.278Z"
}
```

**Authentication:**
- Header: `Authorization: Bearer <FRONTEND_API_KEY>`
- Must match `FRONTEND_API_KEY` or `CUSTOMER_API_KEY` environment variable

### **Source Database Schema (Optional - for persistence):**

```json
{
  "tenantId": "tanjaunlimited",
  "productId": "ljsf-001",
  "stock": 5,
  "status": "low_stock",
  "lowStock": true,
  "outOfStock": false,
  "name": "Long Jacket Silk fitted (LJSf)",
  "sku": "LJSf",
  "lastUpdated": "2025-01-27T14:23:48.278Z"
}
```

---

## Product ID Mapping

The webhook automatically maps customer portal product IDs to Tanja product IDs:

| Customer Portal ID | Tanja Product ID | Product Name |
|-------------------|-----------------|--------------|
| `LJSf` | `ljsf-001` | Long Jacket Silk fitted (LJSf) |
| `SJS` | `sjs-001` | Short Jacket Silk (SJS) |
| `SJCilW` | `sjcilw-001` | Short jacket Cotton Imperial Line White |
| `NJCilW` | `njcilw-001` | Nehru Jacket Cotton imperial line White |
| `LJCkilS` | `ljckils-001` | Long Jacket Cotton knee imperial line Silver |
| `LJCfilS` | `ljcfils-001` | Long Jacket Cotton fitted imperial line Silver |

**Note:** If no mapping is found, the original product ID is used (for catalog products).

---

## Frontend Usage

### **StockStatus Component**

**File:** `components/StockStatus.tsx`

```typescript
// Fetches from /api/inventory/status
// Which uses hybrid approach (Source API → in-memory → default)
<StockStatus productId="ljsf-001" />
```

**Flow:**
1. Component calls `/api/inventory/status?productId=ljsf-001`
2. API tries Source API first
3. Falls back to in-memory if Source API has no data
4. Returns inventory data with `source` indicator
5. Component displays stock badge

### **BuyNowButton Component**

**File:** `components/BuyNowButton.tsx`

- Fetches inventory status (hybrid approach)
- Disables button if `outOfStock: true`
- Shows "Slutsåld" text when out of stock

---

## API Endpoints

### **GET /api/inventory/status?productId=ljsf-001**

**Response (from Source API):**
```json
{
  "productId": "ljsf-001",
  "stock": 5,
  "status": "low_stock",
  "lowStock": true,
  "outOfStock": false,
  "name": "Long Jacket Silk fitted (LJSf)",
  "hasData": true,
  "source": "source_api"
}
```

**Response (from in-memory/webhook):**
```json
{
  "productId": "ljsf-001",
  "stock": 5,
  "status": "low_stock",
  "lowStock": true,
  "outOfStock": false,
  "hasData": true,
  "source": "in_memory"
}
```

**Response (no data - default):**
```json
{
  "productId": "ljsf-001",
  "stock": null,
  "status": "in_stock",
  "lowStock": false,
  "outOfStock": false,
  "hasData": false,
  "source": "default"
}
```

### **POST /api/campaigns/webhook**

**For inventory updates:**
```json
{
  "action": "inventory.updated",
  "inventory": {
    "productId": "LJSf",
    "stock": 5,
    "status": "low_stock"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inventory updated processed",
  "productId": "ljsf-001",
  "originalProductId": "LJSf"
}
```

---

## Logging

### **Webhook Logs:**

```
📥 Webhook received: inventory.updated
📦 Inventory updated received: {
  originalProductId: "LJSf",
  mappedProductId: "ljsf-001",
  stock: 5,
  status: "low_stock"
}
✅ Inventory updated processed for ljsf-001
```

### **Status Request Logs:**

```
📊 Inventory status requested for product: ljsf-001
📦 Using inventory from Source API for ljsf-001
✅ Inventory status for ljsf-001 (source: source_api): {
  stock: 5,
  status: "low_stock",
  outOfStock: false
}
```

**Or if using in-memory:**
```
📊 Inventory status requested for product: ljsf-001
📦 Using inventory from in-memory storage (webhook) for ljsf-001
✅ Inventory status for ljsf-001 (source: in_memory): {
  stock: 5,
  status: "low_stock",
  outOfStock: false
}
```

### **Authentication Failure Logs:**

```
❌ Unauthorized webhook attempt {
  hasAuth: true,
  authPrefix: "Bearer abc123...",
  expectedPrefix: "Bearer xyz45...",
  hasExpectedKey: true
}
```

---

## Troubleshooting

### **Issue: No inventory data showing**

**Check:**
1. Are webhooks being sent? Look for `📥 Webhook received` in logs
2. Is authentication correct? Check for `❌ Unauthorized webhook attempt`
3. Is Source API accessible? Check for `Inventory API returned [status]` warnings
4. Is product ID mapping correct? Check for `⚠️ No product ID mapping found`

### **Issue: Webhooks not received**

**Check:**
1. Verify `FRONTEND_API_KEY` matches customer portal `config.apiKey`
2. Check webhook URL: `${config.syncUrl}/api/campaigns/webhook`
3. Look for authentication errors in logs
4. Test webhook manually with curl

### **Issue: Source API returns 404**

**This is expected if:**
- Customer portal hasn't stored inventory in Source API yet
- Inventory is only updated via webhooks (in-memory)

**Solution:**
- Webhooks will still work (in-memory storage)
- Or customer portal can also store in Source API for persistence

---

## Testing

### **1. Test Webhook**

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

### **2. Test Status Endpoint**

```bash
curl "https://tanja-unlimited.onrender.com/api/inventory/status?productId=ljsf-001"
```

**Expected Response:**
```json
{
  "productId": "ljsf-001",
  "stock": 5,
  "status": "low_stock",
  "hasData": true,
  "source": "in_memory"
}
```

### **3. Test Source API (if customer portal stores there)**

```bash
curl "https://source-database.onrender.com/v1/inventory?tenantId=tanjaunlimited&productId=ljsf-001" \
  -H "X-Tenant: tanjaunlimited" \
  -H "Content-Type: application/json"
```

---

## Summary

**Hybrid Approach:**
- ✅ **Webhooks** - Real-time in-memory updates (immediate)
- ✅ **Source API** - Persistent storage (survives restarts)
- ✅ **In-memory fallback** - Fast access to webhook updates
- ✅ **Graceful degradation** - Works even if Source API unavailable

**Benefits:**
- Real-time responsiveness (webhooks)
- Data persistence (Source API)
- Fast access (in-memory cache)
- Resilient (multiple fallbacks)

**Status:** ✅ Implemented and ready to use

---

Last Updated: January 27, 2025

