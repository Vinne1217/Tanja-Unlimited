# Analytics Tracking Debugging Guide

## How to Verify Tracking is Working

### 1. Browser Console (F12 → Console Tab)

After deploying, you should see logs like:

```
📊 Tracking event: page_view { page: "/", session: "sess_...", source: "direct", device: "desktop" }
✅ Event tracked successfully: page_view
```

**If you see errors:**
- `❌ Analytics API error (400):` - Check event format
- `❌ Analytics API error (500):` - Check server logs
- `❌ Analytics tracking error:` - Network/CORS issue

### 2. Network Tab (F12 → Network Tab)

1. Filter by `/api/analytics`
2. Click on a request
3. Check:
   - **Request Payload**: Should have `events` array
   - **Response Status**: Should be `200 OK`
   - **Response Body**: Should show success message

### 3. Render Logs

Look for these log messages:

**Success logs:**
```
📊 Analytics API: Processing 1 event(s) for tenant: tanjaunlimited
  📤 Event: page_view | Session: sess_... | Page: /
🌐 Sending to customer portal: https://source-database.onrender.com/api/ingest/analytics
📥 Customer portal response: 200 OK
✅ Successfully sent 1 event(s) to customer portal
```

**Error logs:**
```
❌ Analytics API: Events array is required
❌ Customer portal error: [error message]
❌ Analytics API error: [error details]
```

### 4. Test Tracking Manually

Open browser console and run:

```javascript
// Test page view tracking
fetch('/api/analytics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    events: [{
      type: 'page_view',
      url: window.location.href,
      page: window.location.pathname,
      referrer: document.referrer,
      source: 'direct',
      device: 'desktop',
      timestamp: new Date().toISOString(),
      session_id: 'test_' + Date.now(),
      user_id: null,
      user_agent: navigator.userAgent,
      event_props: { test: true }
    }]
  })
}).then(r => r.text()).then(console.log).catch(console.error);
```

Expected response: Success message from customer portal

### 5. Verify Environment Variables

Check Render dashboard → Environment:
- `SOURCE_TENANT_ID=tanjaunlimited` ✅
- `SOURCE_DATABASE_URL=https://source-database.onrender.com` ✅

### 6. Check Customer Portal

1. Go to Customer Portal → Statistics
2. Wait 1-2 minutes after tracking events
3. Check if:
   - Page views appear
   - Sessions are counted
   - Form submissions appear as leads

## Common Issues

### Issue: No logs in browser console

**Possible causes:**
- AnalyticsProvider not loaded
- JavaScript errors blocking execution
- Browser console filters hiding logs

**Solution:**
- Check if `AnalyticsProvider` is in `app/layout.tsx`
- Check for JavaScript errors in console
- Clear console filters

### Issue: 400 Bad Request

**Possible causes:**
- Missing `events` array
- Invalid event format

**Solution:**
- Check Network tab → Request Payload
- Verify events array structure
- Check Render logs for detailed error

### Issue: 500 Internal Server Error

**Possible causes:**
- Missing environment variables
- Customer portal API error
- Network connectivity issue

**Solution:**
- Check Render logs for error details
- Verify environment variables
- Test customer portal API directly

### Issue: Events not appearing in customer portal

**Possible causes:**
- Wrong tenant ID
- Customer portal processing delay
- Customer portal API error

**Solution:**
- Verify tenant ID matches customer portal
- Wait 2-3 minutes for processing
- Check customer portal logs
- Verify `tenantId` is in each event object

## Verification Checklist

- [ ] Browser console shows `📊 Tracking event` logs
- [ ] Browser console shows `✅ Event tracked successfully` logs
- [ ] Network tab shows POST requests to `/api/analytics`
- [ ] Network requests return 200 OK
- [ ] Render logs show `📊 Analytics API: Processing` messages
- [ ] Render logs show `✅ Successfully sent` messages
- [ ] Environment variables are set correctly
- [ ] Customer portal shows data after 2-3 minutes

## Quick Test Script

Add this to any page temporarily to test:

```typescript
'use client';
import { useEffect } from 'react';
import { trackEvent } from '@/components/AnalyticsProvider';

export default function TestAnalytics() {
  useEffect(() => {
    // Test tracking after 2 seconds
    setTimeout(() => {
      console.log('🧪 Testing analytics tracking...');
      trackEvent('page_view', { test: true, timestamp: new Date().toISOString() });
    }, 2000);
  }, []);
  
  return <div>Check console for tracking logs</div>;
}
```

## Support

If tracking still doesn't work after checking all above:

1. **Collect logs:**
   - Browser console logs
   - Network tab requests/responses
   - Render logs (last 100 lines)

2. **Test manually:**
   - Run test script above
   - Check response from `/api/analytics`

3. **Contact support with:**
   - Tenant ID: `tanjaunlimited`
   - Logs from above
   - Screenshot of Network tab



