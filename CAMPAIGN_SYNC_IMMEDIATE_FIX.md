# Immediate Fix for Campaign Sync Issue

## Problem

Campaigns are created in Stripe Connect and visible in customer portal, but:
- ❌ Not visible on tenant frontend
- ❌ Not working in checkout
- ❌ Frontend sync failing: `Frontend sync result: { success: false, reason: 'Sync not configured' }`

## Root Cause

Campaigns exist in Stripe Connect but aren't synced to tenant's local storage because frontend sync is not configured.

## Immediate Solution: Run Manual Sync

### Step 1: Run Manual Sync Endpoint

```bash
curl -X POST https://tanja-unlimited-809785351172.europe-north1.run.app/api/campaigns/manual-sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FRONTEND_API_KEY"
```

**Replace `YOUR_FRONTEND_API_KEY` with your actual API key from environment variables.**

### Step 2: Verify Sync Success

Check the response - should show:
```json
{
  "success": true,
  "message": "Manual sync completed",
  "synced": 1,
  "skipped": 0,
  "total": 1
}
```

### Step 3: Check Logs

Look for logs like:
```
✅ Synced campaign: {campaignId} - {campaignName}
✅ Manual sync completed: X synced
```

### Step 4: Test Frontend

1. Refresh product page
2. Campaign badge should appear
3. Check browser console for: `📦 CampaignBadge: API response for prod_xxx: { hasCampaignPrice: true }`

## Why This Happens

After migrating to Stripe Connect:
1. Campaign prices are created in **Stripe Connect account** (connected account)
2. Customer portal tries to sync to frontend
3. Frontend sync fails because it's not configured
4. Campaigns aren't stored in tenant's local storage
5. Campaign price API can't find campaigns

## Long-term Fix: Configure Frontend Sync

The customer portal needs to be configured to automatically sync campaigns:

1. **Set `frontendSync` in campaign configuration:**
   ```javascript
   {
     frontendSync: {
       enabled: true,
       syncUrl: "https://tanja-unlimited-809785351172.europe-north1.run.app",
       apiKey: "YOUR_FRONTEND_API_KEY"
     }
   }
   ```

2. **Verify `FRONTEND_API_KEY` is set** in tenant's environment variables

3. **Test sync endpoint:**
   ```bash
   curl -X POST https://tanja-unlimited-809785351172.europe-north1.run.app/api/campaigns/sync \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_FRONTEND_API_KEY" \
     -d '{
       "campaignId": "test",
       "name": "Test Campaign",
       "status": "active",
       "stripePriceIds": ["price_test123"]
     }'
   ```

## Troubleshooting

### If Manual Sync Returns 401 Unauthorized

- Check that `FRONTEND_API_KEY` is set in environment variables
- Verify the API key matches what you're sending in the Authorization header

### If Manual Sync Returns Empty Results

- Check that campaigns exist in Source Portal: `GET /api/campaigns?tenant=tanjaunlimited`
- Verify campaigns have `status: "active"`
- Check that campaigns have `stripePriceIds` array populated

### If Campaigns Still Don't Appear

1. Check browser console for campaign API calls
2. Verify campaign price API is being called: `/api/campaigns/price?productId=prod_xxx`
3. Check server logs for campaign price API responses
4. Verify campaigns are stored locally (check `/api/campaigns/webhook` GET endpoint)

## Next Steps

1. ✅ Run manual sync (immediate fix)
2. ⏳ Configure frontend sync in customer portal (long-term fix)
3. ⏳ Monitor logs to ensure sync works automatically

