# Customer Portal Webhook URL Update

## ⚠️ IMPORTANT: Website URL Changed

The Tanja website has moved from Render to **Google Cloud Run**.

## Updated Webhook URL

**Old URL (Render - NO LONGER VALID):**
```
❌ https://tanja-unlimited.onrender.com/api/campaigns/webhook
```

**New URL (Google Cloud Run - USE THIS):**
```
✅ https://tanja-unlimited-809785351172.europe-north1.run.app/api/campaigns/webhook
```

---

## What Needs to Be Updated

### 1. Customer Portal Configuration

Update the webhook URL in your customer portal settings:

**Before:**
```javascript
{
  tenantId: "tanjaunlimited",
  inventorySync: {
    enabled: true,
    syncUrl: "https://tanja-unlimited.onrender.com/api/campaigns/webhook", // ❌ OLD
    apiKey: "<FRONTEND_API_KEY>"
  }
}
```

**After:**
```javascript
{
  tenantId: "tanjaunlimited",
  inventorySync: {
    enabled: true,
    syncUrl: "https://tanja-unlimited-809785351172.europe-north1.run.app/api/campaigns/webhook", // ✅ NEW
    apiKey: "<FRONTEND_API_KEY>"
  }
}
```

---

## Testing the New Webhook URL

### Test 1: Ping Test

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

### Test 2: Inventory Update Test

```bash
curl -X POST "https://tanja-unlimited-809785351172.europe-north1.run.app/api/campaigns/webhook" \
  -H "Authorization: Bearer YOUR_FRONTEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "inventory.updated",
    "inventory": {
      "productId": "LJCfilG",
      "name": "Test Product",
      "stock": 10,
      "status": "in_stock",
      "outOfStock": false
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Inventory updated processed",
  "productId": "ljcfilg-001",
  "originalProductId": "LJCfilG"
}
```

---

## Important Notes

1. **Source Database API is now on Google Cloud Run:**
   - ✅ `https://source-database-809785351172.europe-north1.run.app` - Updated URL
   - This is where products are stored and fetched from

2. **Only the Tanja Website moved:**
   - ❌ Old: `https://tanja-unlimited.onrender.com` (no longer exists)
   - ✅ New: `https://tanja-unlimited-809785351172.europe-north1.run.app` (Google Cloud Run)

3. **Webhook endpoint path is the same:**
   - Path: `/api/campaigns/webhook` (unchanged)
   - Only the base URL changed

4. **API Key is unchanged:**
   - Use the same `FRONTEND_API_KEY` as before
   - No need to regenerate

---

## Verification Checklist

- [ ] Updated webhook URL in customer portal configuration
- [ ] Tested ping endpoint (returns "Pong")
- [ ] Tested inventory update (returns success)
- [ ] Verified products appear on website after update
- [ ] Checked Google Cloud Run logs for webhook activity

---

## Troubleshooting

### Issue: 404 Not Found

**Cause:** Still using old Render URL  
**Solution:** Update to Google Cloud Run URL

### Issue: 401 Unauthorized

**Cause:** Wrong or missing API key  
**Solution:** Verify `FRONTEND_API_KEY` is correct in customer portal

### Issue: Connection Timeout

**Cause:** Google Cloud Run service might be sleeping  
**Solution:** Make a request to wake it up, then retry webhook

---

## Contact

If you encounter any issues, check:
1. Google Cloud Run service is running
2. Webhook URL is exactly: `https://tanja-unlimited-809785351172.europe-north1.run.app/api/campaigns/webhook`
3. API key matches `FRONTEND_API_KEY` environment variable

