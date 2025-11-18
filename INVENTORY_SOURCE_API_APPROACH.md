# Inventory System - Source API Approach (Option 2)

## Overview

Inventory is now fetched directly from Source API (same pattern as campaigns). No separate webhook endpoint needed - the frontend queries Source database when needed.

---

## How It Works

### **Architecture:**

```
Customer Portal (Source Portal)
    ↓
    Stores inventory in Source Database
    ↓
Source Database (source-database.onrender.com)
    ↓
    Frontend queries: GET /v1/inventory?tenantId=tanjaunlimited&productId=ljsf-001
    ↓
    Returns inventory data
    ↓
    Product page displays stock status
```

**No webhook needed!** Just like campaigns, inventory is stored in Source database and fetched on-demand.

---

## Implementation

### **1. Source API Integration**

**File:** `lib/inventory-source.ts`

```typescript
// Fetches inventory from Source API
const inventory = await getInventoryFromSource('ljsf-001');
```

**Source API Endpoint:**
- Primary: `/v1/inventory?tenantId=tanjaunlimited&productId=ljsf-001`
- Fallback: `/v1/inventarier?tenantId=tanjaunlimited&productId=ljsf-001`

### **2. Frontend Status Endpoint**

**File:** `app/api/inventory/status/route.ts`

- Queries Source API first
- Falls back to in-memory storage (for backwards compatibility)
- Returns inventory status to frontend

### **3. Optional Webhook Support**

**File:** `app/api/campaigns/webhook/route.ts`

- Added support for `action: "inventory.updated"` or `"inventory.sync"`
- Used for revalidation only (inventory is already in Source DB)
- Same authentication as campaigns (`FRONTEND_API_KEY`)

---

## Customer Portal Requirements

### **What Customer Portal Needs to Do:**

1. **Store inventory in Source Database**
   - When inventory changes, update Source database
   - Use same database as campaigns
   - Store with `tenantId: "tanjaunlimited"` and `productId: "ljsf-001"`

2. **Optional: Send webhook for revalidation**
   - Can send `POST /api/campaigns/webhook` with `action: "inventory.updated"`
   - This triggers page revalidation (inventory already in Source DB)
   - Not required - frontend will fetch fresh data on next page load

### **Source Database Schema (Expected):**

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
  "lastUpdated": "2025-11-17T14:23:48.278Z"
}
```

---

## Frontend Usage

### **StockStatus Component**

**File:** `components/StockStatus.tsx`

```typescript
// Fetches from /api/inventory/status
// Which queries Source API
<StockStatus productId="ljsf-001" />
```

**Flow:**
1. Component calls `/api/inventory/status?productId=ljsf-001`
2. API queries Source database
3. Returns inventory data
4. Component displays stock badge

### **BuyNowButton Component**

**File:** `components/BuyNowButton.tsx`

- Fetches inventory status
- Disables button if `outOfStock: true`
- Shows "Slutsåld" text when out of stock

---

## Benefits of This Approach

✅ **Same pattern as campaigns** - Consistent architecture  
✅ **No separate endpoint needed** - Uses existing infrastructure  
✅ **Persistent storage** - Data in Source database (not in-memory)  
✅ **Real-time updates** - Frontend fetches fresh data on each page load  
✅ **Graceful fallback** - Falls back to in-memory if Source API unavailable  
✅ **No webhook required** - Customer portal just stores in Source DB  

---

## API Endpoints

### **GET /api/inventory/status?productId=ljsf-001**

**Response:**
```json
{
  "productId": "ljsf-001",
  "stock": 5,
  "status": "low_stock",
  "lowStock": true,
  "outOfStock": false,
  "name": "Long Jacket Silk fitted (LJSf)",
  "hasData": true
}
```

**Or if no data:**
```json
{
  "productId": "ljsf-001",
  "stock": null,
  "status": "in_stock",
  "lowStock": false,
  "outOfStock": false,
  "hasData": false
}
```

### **POST /api/campaigns/webhook (Optional)**

**For revalidation only:**
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

**Response:**
```json
{
  "success": true,
  "message": "Inventory update acknowledged (data in Source DB)",
  "productId": "ljsf-001"
}
```

---

## Migration from Webhook Approach

### **What Changed:**

1. ✅ **Primary method:** Fetch from Source API (like campaigns)
2. ✅ **Fallback:** In-memory storage still works (backwards compatible)
3. ✅ **Webhook:** Optional - only for revalidation, not storage

### **What Stays the Same:**

- Frontend components work the same way
- `/api/inventory/status` endpoint still exists
- Stock badges and button disabling work the same

---

## Testing

### **1. Test Source API Query**

```bash
curl "https://source-database.onrender.com/v1/inventory?tenantId=tanjaunlimited&productId=ljsf-001" \
  -H "X-Tenant: tanjaunlimited"
```

### **2. Test Frontend Endpoint**

```bash
curl "https://tanja-unlimited.onrender.com/api/inventory/status?productId=ljsf-001"
```

### **3. Test on Product Page**

- Visit: `/webshop/tanja-jacket/ljsf-001`
- Check browser console for API calls
- Verify stock badge displays correctly

---

## Summary

**New Approach:**
- ✅ Fetch inventory from Source API (like campaigns)
- ✅ No separate webhook endpoint needed
- ✅ Customer portal stores in Source database
- ✅ Frontend queries Source API on-demand

**Benefits:**
- Simpler architecture
- Consistent with campaigns
- Persistent storage
- Real-time data

**Status:** ✅ Implemented and ready to use

---

Last Updated: November 17, 2025


