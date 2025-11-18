# API Key Configuration for Inventory Sync

Hi Source Portal Team,

We're experiencing 401 Unauthorized errors when trying to fetch inventory from the public API endpoint. The error message indicates "Invalid API key".

## Current Situation

**Error:**
```
Inventory API returned 401 for product: ljsf-001
{
  status: 401,
  statusText: 'Unauthorized',
  errorPreview: '{"success":false,"message":"Invalid API key","code":"INVALID_API_KEY"}'
}
```

**Endpoint being called:**
```
GET https://source-database.onrender.com/api/inventory/public/tanjaunlimited/{productId}
Headers: Authorization: Bearer {apiKey}
```

## Required Configuration

### In Customer Portal (TenantConfig)

Please verify that the `inventorySync.apiKey` is correctly configured for tenant `tanjaunlimited`:

```javascript
{
  tenantId: "tanjaunlimited",
  inventorySync: {
    enabled: true,
    syncUrl: "https://tanja-unlimited.onrender.com",
    apiKey: "<THE_API_KEY_VALUE>",  // ← This must match our FRONTEND_API_KEY
    sendVariants: true,
    lastSyncedAt: "2025-01-27T..."
  }
}
```

### In Tanja Website (Render Environment Variables)

We have the following environment variable set:
- `FRONTEND_API_KEY` = `<THE_API_KEY_VALUE>` (or `CUSTOMER_API_KEY` as fallback)

**The `inventorySync.apiKey` in your TenantConfig must exactly match our `FRONTEND_API_KEY`.**

## What We Need

1. **Confirm the API key value** that's configured in `inventorySync.apiKey` for tenant `tanjaunlimited`
2. **Verify the key matches** what we have in Render (we can share the first 5 characters to verify)
3. **Check if the key has any special characters** or encoding issues

## Testing

To verify the API key works, you can test with:

```bash
curl "https://source-database.onrender.com/api/inventory/public/tanjaunlimited/ljsf-001" \
  -H "Authorization: Bearer <THE_API_KEY_VALUE>"
```

**Expected response:**
```json
{
  "success": true,
  "productId": "ljsf-001",
  "found": true,
  "inventory": {
    "productId": "ljsf-001",
    "stock": 5,
    "status": "in_stock",
    "outOfStock": false,
    "lowStock": false
  }
}
```

**If authentication fails, you'll get:**
```json
{
  "success": false,
  "message": "Invalid API key",
  "code": "INVALID_API_KEY"
}
```

## Alternative: X-API-Key Header

The endpoint also supports `X-API-Key` header as an alternative:

```bash
curl "https://source-database.onrender.com/api/inventory/public/tanjaunlimited/ljsf-001" \
  -H "X-API-Key: <THE_API_KEY_VALUE>"
```

Our code tries both `Authorization: Bearer` and `X-API-Key` headers, but both are currently returning 401.

## Next Steps

1. Please check the `inventorySync.apiKey` value in TenantConfig for `tanjaunlimited`
2. Confirm it matches the key we're using (we can verify by comparing first/last characters)
3. If there's a mismatch, please update the TenantConfig with the correct key
4. Alternatively, if you've changed the key, please share the new value so we can update Render

## Additional Context

- **Webhook authentication works** - Our webhook endpoint at `/api/campaigns/webhook` successfully receives inventory updates using the same `FRONTEND_API_KEY`
- **Campaign API works** - Campaign price endpoints work without authentication (using only `X-Tenant` header)
- **Only inventory API fails** - The public inventory endpoint requires authentication and is returning 401

This suggests the inventory API might be using a different authentication mechanism or a different API key than the webhook endpoint.

Thank you for your help!

Tanja Unlimited Team

