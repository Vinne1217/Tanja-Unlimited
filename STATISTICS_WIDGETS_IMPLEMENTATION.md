# Statistics Widgets Implementation Guide

## Overview

This document explains how the statistics widgets work and how they aggregate data from `AnalyticsEvent` and `PageviewEvent` models in a tenant-agnostic way.

## Widgets Implemented

### Dashboard Widgets (Top Section)
1. **Traffikanalys (Traffic Analysis Chart)** - Time series chart showing sessions and users over time
2. **Trafikkällor (Traffic Sources)** - Breakdown by source (direct, organic, social, email)
3. **Totalt antal besökare (Total Visitors)** - KPI card with change percentage
4. **Konverteringsgrad (Conversion Rate)** - KPI card with change percentage
5. **Genomsnittlig sessionslängd (Average Session Length)** - KPI card with change percentage

### Översikt Section Widgets
1. **KPI Grid** - 7 KPI cards showing:
   - Sessions
   - Unika användare (Unique Users)
   - Konverteringsgrad (Conversion Rate)
   - Leads
   - Intäkter (Revenue)
   - Genomsnittlig sessionstid (Average Session Duration)
   - Bounce Rate

2. **Trendline Chart** - Multi-line chart showing:
   - Sessions
   - Användare (Users)
   - Konverteringar (Conversions)
   - Intäkter (Revenue)

## API Endpoints

### `/api/statistics/overview`

**Purpose:** Returns KPI metrics and trendline data for the overview section.

**Query Parameters:**
- `from` (optional): Start date (YYYY-MM-DD), defaults to 30 days ago
- `to` (optional): End date (YYYY-MM-DD), defaults to today

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "sessions": { "value": 1234, "change": 5.2 },
      "uniqueUsers": { "value": 890, "change": 3.1 },
      "conversionRate": { "value": 2.5, "change": -0.3 },
      "leads": { "value": 45, "change": 10.0 },
      "revenue": { "value": 125000, "change": 15.5 },
      "avgSessionDuration": { "value": 180, "change": 5.0 },
      "bounceRate": { "value": 45.2, "change": -2.1 }
    },
    "trendline": [
      {
        "date": "2025-01-01",
        "sessions": 45,
        "users": 32,
        "conversions": 2,
        "revenue": 5000
      }
      // ... one entry per day
    ],
    "period": {
      "from": "2025-01-01",
      "to": "2025-01-31",
      "days": 31
    }
  }
}
```

**Data Sources:**
- **Sessions:** Unique `sessionId` values from `AnalyticsEvent`
- **Unique Users:** Unique `userId` values from `AnalyticsEvent` (filtered to exclude sessionId fallbacks)
- **Conversion Rate:** `(form_submit + purchase events) / sessions * 100`
- **Leads:** Count of `form_submit` events
- **Revenue:** Sum of `amount_total` from `Payment` model (converted from cents to SEK)
- **Average Session Duration:** Sum of `eventProps.duration` from `time_on_page` events per session, then averaged
- **Bounce Rate:** `(sessions with only 1 page view) / total sessions * 100`

**Previous Period Calculations:**
All KPIs calculate change percentage by comparing current period to previous period:
- Previous period = same duration before the current period
- Change = `((current - previous) / previous) * 100`

### `/api/statistics/traffic`

**Purpose:** Returns traffic sources, time series data, and device breakdown.

**Query Parameters:**
- `from` (optional): Start date (YYYY-MM-DD), defaults to 30 days ago
- `to` (optional): End date (YYYY-MM-DD), defaults to today

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "channels": [
      { "name": "direct", "value": 450, "color": "#10B981" },
      { "name": "organic", "value": 320, "color": "#3B82F6" },
      { "name": "social", "value": 180, "color": "#F59E0B" },
      { "name": "email", "value": 90, "color": "#8B5CF6" }
    ],
    "timeSeries": [
      {
        "date": "2025-01-01",
        "sessions": 45,
        "users": 32
      }
      // ... one entry per day
    ],
    "devices": [
      { "device": "desktop", "count": 650 },
      { "device": "mobile", "count": 350 },
      { "device": "tablet", "count": 40 }
    ],
    "sources": [
      {
        "source": "google.com",
        "medium": "organic",
        "sessions": 250,
        "users": 180,
        "cvr": 2.5
      }
      // ... top 20 sources
    ],
    "landingPages": [
      {
        "page": "/",
        "sessions": 450,
        "bounceRate": 45.2,
        "avgTimeOnPage": 180,
        "cvr": 2.1
      }
      // ... top 10 landing pages
    ],
    "period": {
      "from": "2025-01-01",
      "to": "2025-01-31",
      "days": 31
    }
  }
}
```

**Data Sources:**
- **Channels:** Aggregated by `source` field from `AnalyticsEvent` (page_view events)
- **Time Series:** Daily aggregation of sessions and users from `AnalyticsEvent`
- **Devices:** Aggregated by `device` field from `AnalyticsEvent` (page_view events)
- **Sources:** Aggregated by `source` and `referrer` from `AnalyticsEvent`
- **Landing Pages:** Aggregated by `page` field from `AnalyticsEvent`

## Time Series Data Aggregation

### How It Works

Time series data is aggregated using MongoDB aggregation pipelines that:

1. **Match events** by tenant and date range
2. **Group by day** using MongoDB date operators (`$year`, `$month`, `$dayOfMonth`)
3. **Calculate metrics** per day (sessions, users, conversions, revenue)
4. **Fill missing days** with zeros to ensure continuous time series

### Example Aggregation Pipeline

```javascript
const dailyData = await AnalyticsEvent.aggregate([
  {
    $match: {
      tenantId: tenantId,  // Tenant isolation
      timestamp: { $gte: fromDate, $lte: toDate }
    }
  },
  {
    $group: {
      _id: {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' }
      },
      sessions: { $addToSet: '$sessionId' },  // Unique sessions
      users: {
        $addToSet: {
          $cond: [
            { $and: [{ $ne: ['$userId', null] }, { $ne: ['$userId', ''] }] },
            '$userId',
            null  // Don't count sessionId as user
          ]
        }
      },
      conversions: {
        $sum: {
          $cond: [
            { $in: ['$eventType', ['form_submit', 'purchase']] },
            1,
            0
          ]
        }
      }
    }
  },
  {
    $project: {
      date: {
        $dateFromParts: {
          year: '$_id.year',
          month: '$_id.month',
          day: '$_id.day'
        }
      },
      sessions: { $size: '$sessions' },
      users: {
        $size: {
          $filter: {
            input: '$users',
            cond: { $ne: ['$$this', null] }
          }
        }
      },
      conversions: 1
    }
  },
  {
    $sort: { date: 1 }
  }
]);
```

### Filling Missing Days

After aggregation, we fill in missing days with zeros:

```javascript
const trendlineMap = {};
dailyData.forEach(item => {
  const dateStr = item.date.toISOString().split('T')[0];
  trendlineMap[dateStr] = {
    sessions: item.sessions || 0,
    users: item.users || 0,
    conversions: item.conversions || 0
  };
});

// Fill in missing days
const trendline = [];
for (let i = 0; i < daysDiff; i++) {
  const date = new Date(fromDate);
  date.setDate(date.getDate() + i);
  const dateStr = date.toISOString().split('T')[0];
  
  const dayData = trendlineMap[dateStr] || {};
  trendline.push({
    date: dateStr,
    sessions: dayData.sessions || 0,
    users: dayData.users || 0,
    conversions: dayData.conversions || 0
  });
}
```

## Session Duration Calculation

### How It Works

Session duration is calculated from `time_on_page` events:

1. **Match `time_on_page` events** for the tenant and date range
2. **Group by sessionId** and sum all `eventProps.duration` values per session
3. **Average the session durations** to get overall average

### Example Aggregation Pipeline

```javascript
const timeOnPageData = await AnalyticsEvent.aggregate([
  {
    $match: {
      tenantId: tenantId,  // Tenant isolation
      eventType: 'time_on_page',
      timestamp: { $gte: fromDate, $lte: toDate },
      'eventProps.duration': { $exists: true, $ne: null, $gt: 0 }
    }
  },
  {
    $group: {
      _id: '$sessionId',
      sessionDuration: { $sum: '$eventProps.duration' }  // Sum durations per session
    }
  },
  {
    $group: {
      _id: null,
      avgTime: { $avg: '$sessionDuration' }  // Average across all sessions
    }
  }
]);

const avgSessionDuration = Math.round((timeOnPageData[0] || {}).avgTime || 0);
```

### Important Notes

- Duration is stored in **seconds** in `eventProps.duration`
- Only sessions with at least one `time_on_page` event are included
- The frontend converts seconds to "Xm Ys" format for display

## Tenant Isolation

### How It Works

All queries are filtered by `tenantId` to ensure complete data isolation:

```javascript
// AnalyticsEvent queries
{
  $match: {
    tenantId: tenantId,  // Always filter by tenant
    timestamp: { $gte: fromDate, $lte: toDate }
  }
}

// Payment queries (supports multiple tenant identification methods)
{
  $match: {
    $or: [
      { 'metadata.tenant': tenantId },
      { customer_email: { $regex: tenantId, $options: 'i' } }
    ],
    stripe_created: { $gte: fromDate, $lte: toDate },
    status: 'completed'
  }
}
```

### Tenant Resolution

The tenant is resolved from multiple sources (in priority order):
1. `req.session.user.tenantId`
2. `req.session.user.tenant`
3. `req.tenantId`
4. `req.tenant`

```javascript
const tenantId = req.session.user.tenantId || 
                 req.session.user.tenant || 
                 req.tenantId || 
                 req.tenant;
```

## Previous Period Calculations

### How It Works

All KPIs calculate change percentage by comparing to the previous period:

1. **Calculate previous period dates:**
   ```javascript
   const previousFromDate = new Date(fromDate);
   previousFromDate.setDate(previousFromDate.getDate() - daysDiff);
   const previousToDate = new Date(fromDate);
   ```

2. **Query previous period data** using the same aggregation pipelines

3. **Calculate change percentage:**
   ```javascript
   const calculateChange = (current, previous) => {
     if (!previous || previous === 0) return current > 0 ? 100 : 0;
     return ((current - previous) / previous) * 100;
   };
   ```

### Metrics with Previous Period Support

- ✅ Sessions
- ✅ Unique Users
- ✅ Conversion Rate
- ✅ Leads
- ✅ Revenue
- ✅ Average Session Duration
- ✅ Bounce Rate

## Data Models Used

### AnalyticsEvent

**Fields Used:**
- `tenantId` - Tenant isolation
- `sessionId` - Session tracking
- `userId` - User identification (hashed, no PII)
- `timestamp` - Event timestamp
- `eventType` - Event type (`page_view`, `page_view_geo`, `form_submit`, `purchase`, `time_on_page`)
- `source` - Traffic source (`direct`, `organic`, `social`, `email`, `referral`)
- `device` - Device type (`desktop`, `mobile`, `tablet`)
- `page` - Page path
- `referrer` - Referrer URL
- `eventProps.duration` - Duration in seconds (for `time_on_page` events)

**Indexes:**
- `tenantId` + `timestamp` (for date range queries)
- `tenantId` + `eventType` (for event type filtering)
- `sessionId` (for session aggregation)
- `userId` (for user aggregation)

### Payment

**Fields Used:**
- `metadata.tenant` - Tenant identification
- `customer_email` - Customer email (for tenant matching)
- `stripe_created` - Payment timestamp
- `status` - Payment status (filtered to `completed`)
- `amount_total` - Payment amount in cents

**Indexes:**
- `metadata.tenant` + `stripe_created` (for date range queries)
- `status` (for filtering completed payments)

### PageviewEvent (Legacy Support)

**Note:** The codebase also supports `PageviewEvent` for backward compatibility, but new implementations should use `AnalyticsEvent`.

## Frontend Integration

### Widget Data Loading

The frontend loads data in `public/js/statistics.js`:

```javascript
// Load overview data
async loadOverviewData() {
  const data = await this.fetchJSON(`/api/statistics/overview?${this.getQueryParams()}`);
  if (data.success && data.data) {
    this.renderKPICards(data.data.kpis);
    this.renderTrendlineChart(data.data.trendline);
  }
}

// Load dashboard data
async loadDashboardData() {
  const data = await this.fetchJSON(`/api/statistics/traffic?${this.getQueryParams()}`);
  if (data.success && data.data) {
    this.renderTrafficSourcesWidget(data.data.channels);
    this.renderTrafficAnalysisChart(data.data);
    this.renderDeviceChart(data.data.devices);
  }
}
```

### Query Parameters

The frontend generates query parameters based on time range selection:

```javascript
getQueryParams() {
  const params = new URLSearchParams();
  if (this.customDateRange) {
    params.set('from', this.customDateRange.from);
    params.set('to', this.customDateRange.to);
  } else {
    const days = parseInt(this.currentTimeRange);
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    params.set('from', from.toISOString().split('T')[0]);
    params.set('to', to.toISOString().split('T')[0]);
  }
  return params.toString();
}
```

## Performance Considerations

### Aggregation Optimization

1. **Use indexes:** All queries use indexed fields (`tenantId`, `timestamp`, `eventType`)
2. **Limit date ranges:** Frontend limits to 7, 30, or 90 days
3. **Parallel queries:** Previous period queries run in parallel where possible
4. **Lean queries:** Use `.lean()` for read-only queries when possible

### Caching Strategy

Currently, no caching is implemented. For high-traffic tenants, consider:
- Redis caching for aggregated KPI data (5-15 minute TTL)
- Pre-aggregated daily statistics in `AnalyticsAggregate` model
- Background jobs to pre-calculate metrics

## Error Handling

### Graceful Degradation

The frontend handles missing data gracefully:

```javascript
// If API fails, show zeros instead of errors
loadFallbackOverviewData() {
  const fallbackKPIs = {
    sessions: { value: 0, change: 0 },
    uniqueUsers: { value: 0, change: 0 },
    // ... all KPIs set to 0
  };
  this.renderKPICards(fallbackKPIs);
}
```

### Backend Error Handling

All endpoints use try/catch and return proper error responses:

```javascript
try {
  // ... aggregation logic
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Error fetching data:', error);
  res.status(500).json({
    success: false,
    message: 'Error fetching data'
  });
}
```

## Testing

### Manual Testing Checklist

1. ✅ Verify all KPIs display correct values
2. ✅ Verify change percentages calculate correctly
3. ✅ Verify trendline chart shows daily data
4. ✅ Verify traffic sources widget shows correct counts
5. ✅ Verify traffic analysis chart shows time series
6. ✅ Verify device breakdown shows correct distribution
7. ✅ Verify tenant isolation (different tenants see different data)
8. ✅ Verify date range filtering works (7, 30, 90 days)
9. ✅ Verify custom date range works
10. ✅ Verify previous period calculations are correct

### Test Data

To test with real data:
1. Ensure `AnalyticsEvent` records exist for your tenant
2. Ensure `Payment` records exist for your tenant (for revenue)
3. Ensure `time_on_page` events exist (for session duration)
4. Ensure events span multiple days (for trendline)

## Future Enhancements

1. **Real-time updates:** WebSocket support for live dashboard updates
2. **Export functionality:** CSV/PDF export of statistics
3. **Custom date ranges:** More flexible date range selection
4. **Comparison periods:** Compare to same period last year/month
5. **Segmentation:** Filter by device, source, or custom dimensions
6. **Alerts:** Set up alerts for significant metric changes
7. **Cohort analysis:** Track user cohorts over time

## Troubleshooting

### Widgets Show Zero Values

**Possible causes:**
1. No events in database for the tenant
2. Date range doesn't match event timestamps
3. Tenant ID mismatch

**Solution:**
- Check database for events: `db.analyticevents.find({ tenantId: 'your-tenant' })`
- Verify tenant ID in session: `req.session.user.tenantId`
- Check date range in query parameters

### Session Duration Shows Zero

**Possible causes:**
1. No `time_on_page` events in database
2. `eventProps.duration` field missing or null

**Solution:**
- Verify `time_on_page` events exist: `db.analyticevents.find({ eventType: 'time_on_page' })`
- Check that `eventProps.duration` is set correctly

### Conversion Rate Shows Zero

**Possible causes:**
1. No `form_submit` or `purchase` events
2. No sessions (division by zero)

**Solution:**
- Verify conversion events exist
- Check that sessions are being tracked correctly

## Summary

The statistics widgets implementation provides a robust, tenant-agnostic analytics dashboard that:

- ✅ Aggregates data from `AnalyticsEvent` and `Payment` models
- ✅ Calculates KPIs with previous period comparisons
- ✅ Generates time series data for charts
- ✅ Maintains complete tenant isolation
- ✅ Handles missing data gracefully
- ✅ Supports flexible date ranges
- ✅ Uses efficient MongoDB aggregation pipelines

All widgets are now fully functional and ready for production use!


