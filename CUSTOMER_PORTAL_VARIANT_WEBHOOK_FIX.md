# Customer Portal - Variant Inventory Webhook Fix

## Issues Found

### 1. Wrong Webhook URL ❌ CRITICAL
**Current (WRONG):** `https://tanja-unlimited.onrender.com/api/inventory/sync/api/campaigns/webhook`  
**Should be:** `https://tanja-unlimited.onrender.com/api/campaigns/webhook`

**The URL is being concatenated incorrectly!** The customer portal is trying to append `/api/campaigns/webhook` to `/api/inventory/sync`, which creates an invalid URL.

**Solution:** Use `/api/campaigns/webhook` directly as the base URL. Do NOT concatenate it with `/api/inventory/sync`.

### Available Endpoints

There are TWO endpoints, but you should use ONE:

1. **`/api/campaigns/webhook`** ✅ **USE THIS ONE** - Supports both regular products AND variants
2. **`/api/inventory/sync`** ❌ **DO NOT USE** - Only supports regular products (no variants), and is being phased out

**Recommendation:** Use `/api/campaigns/webhook` for ALL inventory updates (both regular products and variants).

### 2. Wrong Product ID Format ⚠️ (Now Fixed - Fallback Added)
**Current:** `productId: 'prod_TTuM1DVrUtgru5'` (Stripe Product ID)  
**Preferred:** `productId: 'LJCfilG'` (Base SKU from Product model)

**UPDATE:** The Tanja website now supports Stripe product IDs as a fallback, but **base SKU is still preferred** for clarity. The webhook will automatically map `prod_TTuM1DVrUtgru5` → `ljcfilg-001`.

### 3. Missing Variants Array
The payload is missing the `variants` array. Variants must be included for variant products.

## Correct Webhook Configuration

### Endpoint

**IMPORTANT:** Use this URL exactly as shown. Do NOT concatenate it with any other path.

```
POST https://tanja-unlimited.onrender.com/api/campaigns/webhook
```

**Common mistake:** Customer portal code might be doing something like:
```javascript
// WRONG ❌
const baseUrl = 'https://tanja-unlimited.onrender.com/api/inventory/sync';
const webhookUrl = `${baseUrl}/api/campaigns/webhook`;  // Creates invalid URL!

// CORRECT ✅
const webhookUrl = 'https://tanja-unlimited.onrender.com/api/campaigns/webhook';
```

### Authentication
```
Authorization: Bearer <FRONTEND_API_KEY>
```

### Correct Payload Structure

```json
{
  "action": "inventory.updated",
  "inventory": {
    "productId": "LJCfilG",  // Base SKU (NOT Stripe product ID)
    "name": "Long Jacket Cotton Fitted Imperial Line Gold (LJCfilG)",
    "sku": "LJCfilG",  // Base SKU
    "stock": 0,  // Always 0 for Product model (stock is per variant)
    "status": "in_stock",  // Overall status
    "outOfStock": false,
    "lowStock": false,
    "variants": [
      {
        "key": "XS",  // Size identifier
        "size": "XS",
        "sku": "LJCfilG-XS",
        "articleNumber": "LJCfilG-XS",
        "stripePriceId": "price_1SX5xtP6vvUUervC7sVlRnoi",  // REQUIRED
        "priceId": "price_1SX5xtP6vvUUervC7sVlRnoi",  // Alternative field name
        "stock": 11,  // Actual stock for this variant
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
      {
        "key": "M",
        "size": "M",
        "sku": "LJCfilG-M",
        "articleNumber": "LJCfilG-M",
        "stripePriceId": "price_1SX5z2P6vvUUervCn7DBjW4V",
        "stock": 10,
        "status": "in_stock",
        "outOfStock": false
      },
      {
        "key": "L",
        "size": "L",
        "sku": "LJCfilG-L",
        "articleNumber": "LJCfilG-L",
        "stripePriceId": "price_1SX5zJP6vvUUervCvIIk1R0u",
        "stock": 10,
        "status": "in_stock",
        "outOfStock": false
      },
      {
        "key": "XL",
        "size": "XL",
        "sku": "LJCfilG-XL",
        "articleNumber": "LJCfilG-XL",
        "stripePriceId": "price_1SX5zUP6vvUUervCyLcMME9z",
        "stock": 10,
        "status": "in_stock",
        "outOfStock": false
      }
    ]
  },
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

## Key Points

1. **Use base SKU for productId**: `"LJCfilG"` not `"prod_TTuM1DVrUtgru5"`
2. **Include variants array**: Each variant must have `stripePriceId` and `stock`
3. **Use correct endpoint**: `/api/campaigns/webhook` (not `/api/inventory/sync/api/campaigns/webhook`)
4. **Each variant needs**: `key`, `stripePriceId`, `stock`, `status`, `outOfStock`

## Product ID Mapping

The Tanja website automatically maps base SKUs to Tanja product IDs:

| Base SKU (Customer Portal) | Tanja Product ID | Stripe Product ID |
|----------------------------|------------------|------------------|
| `LJCfilG` | `ljcfilg-001` | `prod_TTuM1DVrUtgru5` |
| `LJCkilG` | `ljckilg-001` | `prod_TTuI3y4djIk4dl` |
| `LJCkilP` | `ljckilp-001` | `prod_TTuQwJfAiYh99j` |
| `LJCfilD` | `ljcfild-001` | `prod_TTuSJQSVbUdio6` |

## Testing

After fixing the webhook:

1. Send test webhook with correct payload
2. Check Tanja website server logs for:
   ```
   📦 Processing 5 variants for product ljcfilg-001
   📦 Variant inventory updated: { key: 'XS', stripePriceId: '...', stock: 11, ... }
   ```
3. Refresh product page and verify sizes show correct stock status

## Expected Response

```json
{
  "success": true,
  "message": "Inventory updated processed",
  "productId": "ljcfilg-001",
  "originalProductId": "LJCfilG"
}
```

