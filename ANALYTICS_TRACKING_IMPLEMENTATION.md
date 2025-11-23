# Analytics Tracking Implementation

## Overview

This document describes the analytics tracking implementation for Tanja Unlimited website, following the customer portal's statistics tracking requirements.

## Implementation Summary

✅ **Complete analytics tracking system implemented** following the customer portal guide.

### Components Created/Updated

1. **`components/AnalyticsProvider.tsx`** - Main tracking component
   - Session tracking (localStorage)
   - Device type detection (desktop/mobile/tablet)
   - Traffic source detection (direct/organic/social/email/referral)
   - Automatic page view tracking
   - Automatic time-on-page tracking
   - Automatic form submission tracking
   - SPA navigation support (Next.js App Router)

2. **`lib/analytics.client.ts`** - Updated tracking utilities
   - Enhanced `trackEvent()` function matching customer portal format
   - Session, device, and traffic source helpers
   - Compatible with existing codebase

3. **`app/api/analytics/route.ts`** - API route updated
   - Transforms events to match customer portal `AnalyticsEvent` format
   - Maps client-side event format to server-side format:
     - `type` → `eventType`
     - `session_id` → `sessionId`
     - `user_id` → `userId`
     - `event_props` → `eventProps`
   - Includes `X-Tenant` header for tenant isolation
   - Error handling and validation

4. **`app/layout.tsx`** - Root layout updated
   - Wrapped with `AnalyticsProvider` for automatic tracking

5. **`app/checkout/success/page.tsx`** - Purchase tracking
   - Tracks `purchase` events when checkout succeeds
   - Uses session ID from URL parameters

## Event Types Tracked

| Event Type | When Tracked | Description |
|------------|--------------|-------------|
| `page_view` | Automatically on page load/route change | Tracks page views with title and load time |
| `time_on_page` | Automatically on page unload | Tracks time spent on page (in seconds) |
| `form_submit` | Automatically on form submission | Tracks form submissions with form details |
| `purchase` | Manually on checkout success | Tracks completed purchases with order ID |

## Event Format

### Client-Side Format (sent to `/api/analytics`)

```typescript
{
  type: string,              // Event type (page_view, purchase, etc.)
  url: string,               // Full URL
  page: string,              // Page path
  referrer: string,          // Referrer URL
  source: string,            // Traffic source (direct/organic/social/email/referral)
  device: string,            // Device type (desktop/mobile/tablet)
  timestamp: string,         // ISO timestamp
  session_id: string,        // Session ID from localStorage
  user_id: string | null,   // User ID (null if not logged in)
  user_agent: string,        // User agent string
  event_props: {            // Event-specific properties
    page_title?: string,
    load_time?: number,
    duration?: number,       // For time_on_page
    form_id?: string,       // For form_submit
    order_id?: string,      // For purchase
    amount?: number,        // For purchase
    currency?: string,      // For purchase
    items?: array          // For purchase
  }
}
```

### Server-Side Format (sent to customer portal)

The API route transforms events to match `AnalyticsEvent` model:

```typescript
{
  eventType: string,         // Mapped from 'type'
  sessionId: string,         // Mapped from 'session_id'
  userId: string | null,     // Mapped from 'user_id'
  timestamp: Date,           // Parsed from ISO string
  source: string,            // Traffic source
  device: string,            // Device type
  page: string,              // Page path
  referrer: string,          // Referrer URL
  eventProps: {              // Mapped from 'event_props'
    url: string,
    page_title?: string,
    load_time?: number,
    duration?: number,
    form_id?: string,
    order_id?: string,
    amount?: number,
    currency?: string,
    items?: array
  }
}
```

## Tenant Configuration

- **Tenant ID**: `tanjaunlimited` (from `SOURCE_TENANT_ID` environment variable)
- **Portal URL**: `https://source-database.onrender.com` (from `SOURCE_DATABASE_URL`)
- **X-Tenant Header**: Automatically included in API requests

## Automatic Tracking

The `AnalyticsProvider` component automatically tracks:

1. **Page Views**
   - On initial page load
   - On route changes (Next.js App Router)
   - Includes page title and load time

2. **Time on Page**
   - When user leaves page (beforeunload)
   - Duration in seconds
   - Only tracks if time > 0

3. **Form Submissions**
   - All form submissions on the site
   - Includes form ID, action, and field count
   - Works with ContactForm and any other forms

## Manual Tracking

### Purchase Events

Purchase events are tracked in `app/checkout/success/page.tsx`:

```typescript
import { trackEvent } from '@/components/AnalyticsProvider';

trackEvent('purchase', {
  order_id: sessionId,
  // Amount and items matched from Stripe webhook data in customer portal
});
```

### Custom Events

You can track custom events anywhere in the app:

```typescript
import { trackEvent } from '@/components/AnalyticsProvider';

trackEvent('custom_event', {
  custom_property: 'value'
});
```

## GDPR Compliance

✅ **No PII stored**: User IDs are hashed (currently null for anonymous users)  
✅ **No IP tracking**: IP addresses are hashed on the server side  
✅ **Session-based**: Uses localStorage session IDs, not persistent user tracking  
✅ **Opt-out ready**: Can be easily disabled if needed

## Testing

### Verify Tracking is Working

1. **Open Developer Tools** → Console
2. **Navigate pages** - Should see no errors
3. **Submit a form** - Should track `form_submit` event
4. **Complete a purchase** - Should track `purchase` event
5. **Check Network tab** - Should see POST requests to `/api/analytics`

### Verify in Customer Portal

1. Go to Customer Portal → Statistics
2. Wait 1-2 minutes for data to appear
3. Check that:
   - Page views are tracked
   - Sessions are counted
   - Form submissions appear as leads
   - Purchases appear in conversion rate

## Troubleshooting

### No Data Appearing

1. **Check tenant ID**: Verify `SOURCE_TENANT_ID` is set to `tanjaunlimited`
2. **Check portal URL**: Verify `SOURCE_DATABASE_URL` is correct
3. **Check Network tab**: Verify requests are being sent to `/api/analytics`
4. **Check Console**: Look for any JavaScript errors
5. **Wait**: Data can take 1-2 minutes to appear in customer portal

### Events Not Tracking

1. **Check AnalyticsProvider**: Verify it's wrapped in `layout.tsx`
2. **Check browser support**: Verify localStorage is available
3. **Check errors**: Look in Console for tracking errors
4. **Check API route**: Verify `/api/analytics` is responding correctly

### Purchase Events Not Appearing

1. **Check session ID**: Verify `session_id` is in URL parameters
2. **Check checkout success page**: Verify purchase tracking code is running
3. **Check Stripe webhooks**: Purchase data is matched from Stripe webhook data

## Environment Variables Required

```env
SOURCE_TENANT_ID=tanjaunlimited
SOURCE_DATABASE_URL=https://source-database.onrender.com
```

## Files Modified

- ✅ `components/AnalyticsProvider.tsx` (new)
- ✅ `lib/analytics.client.ts` (updated)
- ✅ `app/api/analytics/route.ts` (updated)
- ✅ `app/layout.tsx` (updated)
- ✅ `app/checkout/success/page.tsx` (updated)

## Next Steps

1. ✅ **Deploy to production** - Tracking will work automatically
2. ✅ **Monitor customer portal** - Verify data appears in Statistics
3. ✅ **Test purchase flow** - Complete a test purchase and verify tracking
4. ✅ **Test form submissions** - Submit contact form and verify tracking

## Support

If you need help:
1. Check Developer Tools Console for errors
2. Check Network tab for failed requests
3. Verify environment variables are set correctly
4. Contact Source.database support with tenant ID and error details

---

**Status**: ✅ **Complete and Ready for Production**

All tracking is implemented according to the customer portal guide and ready to use!

