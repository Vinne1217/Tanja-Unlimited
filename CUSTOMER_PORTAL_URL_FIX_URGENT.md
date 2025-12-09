# 🚨 URGENT: Customer Portal Webhook URL Fix

## Problem

The customer portal is sending webhooks to an **invalid URL** that doesn't exist:

```
❌ WRONG: https://tanja-unlimited.onrender.com/api/inventory/sync/api/campaigns/webhook
```

This is causing **503 Service Unavailable** errors because the endpoint doesn't exist.

## Root Cause

The customer portal code is **concatenating URLs incorrectly**:
- Base URL: `/api/inventory/sync`
- Appending: `/api/campaigns/webhook`
- Result: `/api/inventory/sync/api/campaigns/webhook` ❌ (DOES NOT EXIST)

## Solution

### Use the Correct URL

**For ALL inventory updates (both regular products and variants):**

```
✅ CORRECT: https://tanja-unlimited.onrender.com/api/campaigns/webhook
```

### Code Fix Example

**Before (WRONG):**
```javascript
const baseUrl = 'https://tanja-unlimited.onrender.com/api/inventory/sync';
const webhookUrl = `${baseUrl}/api/campaigns/webhook`;  // ❌ Creates invalid URL
```

**After (CORRECT):**
```javascript
const webhookUrl = 'https://tanja-unlimited.onrender.com/api/campaigns/webhook';  // ✅
```

### Configuration Fix

Update your customer portal configuration:

```javascript
{
  tenantId: "tanjaunlimited",
  inventorySync: {
    enabled: true,
    // ❌ WRONG - Don't use this:
    // syncUrl: "https://tanja-unlimited.onrender.com/api/inventory/sync/api/campaigns/webhook",
    
    // ✅ CORRECT - Use this:
    syncUrl: "https://tanja-unlimited.onrender.com/api/campaigns/webhook",
    apiKey: "<FRONTEND_API_KEY>"
  }
}
```

## Why This Matters

1. **Current behavior:** All webhooks fail with 503 errors
2. **After fix:** Webhooks will work correctly
3. **Impact:** Inventory updates will sync properly to Tanja website

## Testing

After fixing the URL, test with a simple product update:

```bash
curl -X POST https://tanja-unlimited.onrender.com/api/campaigns/webhook \
  -H "Authorization: Bearer <FRONTEND_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "inventory.updated",
    "inventory": {
      "productId": "NJCilW",
      "name": "Nehru Jacket Cotton imperial line White",
      "stock": 45,
      "status": "in_stock",
      "outOfStock": false
    }
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Inventory updated processed",
  "productId": "njcilw-001"
}
```

## Endpoints Reference

| Endpoint | Purpose | Supports Variants |
|----------|---------|-------------------|
| `/api/campaigns/webhook` | ✅ **USE THIS** - Inventory updates with variant support | Yes |
| `/api/inventory/sync` | ❌ Legacy - Do not use | No |

**Recommendation:** Use `/api/campaigns/webhook` for everything.






