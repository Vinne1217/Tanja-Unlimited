# Campaign Sync Troubleshooting Guide

## Problem Summary

**Symptoms:**
- ✅ Campaigns are created in admin portal
- ✅ Stripe prices are activated in Stripe Connect account
- ❌ Campaigns not visible on tenant's website frontend
- ❌ Checkout not using campaign prices
- ❌ Frontend sync failing: `Frontend sync result: { success: false, reason: 'Sync not configured' }`

## Root Cause

The frontend sync is failing because it's not configured. This means:
1. Campaigns aren't being synced to tenant's local storage
2. Campaign price API checks Source Portal first (returns `hasCampaignPrice: false`)
3. Campaign price API checks local storage (empty because sync failed)

## Solutions

### Solution 1: Manual Campaign Sync (Quick Fix)

Use the new manual sync endpoint to fetch campaigns from Source Portal:

```bash
curl -X POST https://tanja-unlimited-809785351172.europe-north1.run.app/api/campaigns/manual-sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FRONTEND_API_KEY"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Manual sync completed",
  "synced": 1,
  "skipped": 0,
  "total": 1
}
```

**What it does:**
- Fetches all active campaigns from Source Portal
- Syncs them to local storage
- Revalidates pages to show campaigns

### Solution 2: Configure Frontend Sync (Long-term Fix)

The customer portal needs to be configured to call the sync endpoint automatically.

**Required Configuration:**
1. In customer portal, set campaign `frontendSync`:
   ```javascript
   {
     frontendSync: {
       enabled: true,
       syncUrl: "https://tanja-unlimited-809785351172.europe-north1.run.app",
       apiKey: "YOUR_FRONTEND_API_KEY" // Must match FRONTEND_API_KEY env var
     }
   }
   ```

2. Verify `FRONTEND_API_KEY` is set in tenant's environment variables

3. Test sync endpoint:
   ```bash
   curl -X POST https://tanja-unlimited-809785351172.europe-north1.run.app/api/campaigns/sync \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_FRONTEND_API_KEY" \
     -H "Idempotency-Key: test-123" \
     -d '{
       "campaignId": "test",
       "name": "Test Campaign",
       "status": "active",
       "stripePriceIds": ["price_test123"]
     }'
   ```

### Solution 3: Fix Source Portal Campaign API

If Source Portal API is returning `hasCampaignPrice: false` even though campaigns exist:

1. **Check campaign status** - Must be `"active"` (not `"draft"`)
2. **Check stripePriceIds** - Must have price IDs array
3. **Check campaign dates** - Must be within valid date range
4. **Check product matching** - Campaign must include the product ID

## How Campaign Price API Works

The `/api/campaigns/price` endpoint checks two sources:

1. **Source Portal API** (primary)
   - Calls: `GET /api/campaigns/price/{productId}?tenant={tenantId}&originalPriceId={priceId}`
   - Returns campaign price if found

2. **Local Storage** (fallback)
   - Checks campaigns synced via `/api/campaigns/sync`
   - Uses `getActiveCampaignForProduct()` to find matching campaigns
   - Returns campaign price IDs from `stripePriceIds` array

## Testing Checklist

### Step 1: Verify Campaigns Exist in Source Portal

```bash
curl "https://source-database-809785351172.europe-north1.run.app/api/campaigns?tenant=tanjaunlimited" \
  -H "X-Tenant: tanjaunlimited"
```

**Expected:** Array of campaigns with `status: "active"` and `stripePriceIds: [...]`

### Step 2: Run Manual Sync

```bash
curl -X POST https://tanja-unlimited-809785351172.europe-north1.run.app/api/campaigns/manual-sync \
  -H "Authorization: Bearer YOUR_FRONTEND_API_KEY"
```

**Check logs for:**
- `✅ Synced campaign: {campaignId} - {campaignName}`
- `✅ Manual sync completed: X synced`

### Step 3: Test Campaign Price API

```bash
curl "https://tanja-unlimited-809785351172.europe-north1.run.app/api/campaigns/price?productId=prod_Tk6vhGPrHRjLg5&originalPriceId=price_1SmchQ1fkdOqt85xhAcJUQuN"
```

**Expected Response:**
```json
{
  "success": true,
  "hasCampaignPrice": true,
  "priceId": "price_campaign_xxx",
  "campaignId": "campaign_xxx",
  "campaignName": "Campaign Name",
  "source": "local_storage"
}
```

### Step 4: Verify Frontend Display

1. Visit product page
2. Check browser console for:
   - `📦 CampaignBadge: API response for prod_xxx: { hasCampaignPrice: true }`
   - Campaign badge should appear on product

### Step 5: Test Checkout

1. Add product to cart
2. Go to checkout
3. Check backend logs for:
   - `🔍 [CHECKOUT] Checking campaign price for product prod_xxx`
   - `🎯 [CHECKOUT] Using campaign price price_xxx`

## Debugging Logs

### Tenant Frontend Logs

Look for:
```
✅ Campaign API: Found campaign in local storage for prod_xxx
✅ CampaignBadge: API response for prod_xxx: { hasCampaignPrice: true }
```

### Customer Portal Logs

Look for:
```
Frontend sync result: { success: true }
```

If you see `{ success: false, reason: 'Sync not configured' }`:
- Frontend sync is not configured
- Use manual sync endpoint instead

## Next Steps

1. **Immediate:** Run manual sync to populate local storage
2. **Short-term:** Configure frontend sync in customer portal
3. **Long-term:** Ensure Source Portal API returns campaigns correctly

## Related Files

- `/app/api/campaigns/sync/route.ts` - Sync endpoint (receives campaigns from customer portal)
- `/app/api/campaigns/manual-sync/route.ts` - Manual sync endpoint (fetches from Source Portal)
- `/app/api/campaigns/price/route.ts` - Campaign price lookup API
- `/lib/campaigns.ts` - Local campaign storage

