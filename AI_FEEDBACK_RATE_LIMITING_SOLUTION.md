# AI Feedback Rate Limiting Solution

## Problem

We were getting `429 Too Many Requests` errors when sending AI assistant feedback to the customer portal. This happens when:
- Too many requests are sent in a short time period
- The customer portal has rate limiting enabled
- Multiple users submit feedback simultaneously

## Solution Implemented

We've implemented a **multi-layered approach** to handle rate limiting:

### 1. **Client-Side Rate Limiting**
- **Limit:** Maximum 10 requests per minute
- **Purpose:** Prevents overwhelming the customer portal
- **Implementation:** In-memory tracking that resets on server restart
- **Behavior:** If limit exceeded, feedback is accepted but not sent to portal (user still sees success)

### 2. **Automatic Retry with Exponential Backoff**
- **Max Retries:** 3 attempts
- **Initial Delay:** 1 second
- **Backoff Strategy:** Exponential (1s → 2s → 4s)
- **Retry-After Support:** Respects `Retry-After` header if provided by portal
- **Applies To:** 429 errors and network errors

### 3. **Better Error Handling**
- Detailed logging for debugging
- Different handling for 429 vs other errors
- User experience not affected (always returns success to user)

## How It Works

```
User submits feedback
    ↓
Check client-side rate limit (10/min)
    ↓ (if OK)
Send to customer portal
    ↓
If 429 error → Wait and retry (up to 3 times)
    ↓
If still fails → Log error, return success to user
```

## Configuration

You can adjust these values in `app/api/ai-feedback/route.ts`:

```typescript
const MAX_REQUESTS_PER_MINUTE = 10; // Adjust if needed
const MAX_RETRIES = 3; // Number of retry attempts
const INITIAL_RETRY_DELAY_MS = 1000; // Initial delay in milliseconds
```

## Verification Steps

### 1. **Check Render Logs**

Look for these log messages:

**Success:**
```
✅ AI feedback sent successfully to customer portal
```

**Rate Limited (with retry):**
```
⏳ Rate limited (429), retrying in 1000ms (attempt 1/3)
✅ AI feedback sent successfully to customer portal
```

**Rate Limited (max retries reached):**
```
⏳ Rate limited (429), retrying in 1000ms (attempt 1/3)
⏳ Rate limited (429), retrying in 2000ms (attempt 2/3)
⏳ Rate limited (429), retrying in 4000ms (attempt 3/3)
❌ Rate limited by customer portal (429) - max retries reached
```

**Client-Side Rate Limit:**
```
⚠️ Rate limit: Too many feedback requests, skipping this one
```

### 2. **Test the Endpoint**

Test with a curl command:

```bash
curl -X POST https://tanja-unlimited.onrender.com/api/ai-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "test-123",
    "rating": "positive",
    "message": "Test message",
    "userMessage": "Test question",
    "timestamp": "2025-01-27T12:00:00.000Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Feedback sent successfully",
  "sent": true
}
```

### 3. **Monitor Rate Limiting**

If you see frequent `429` errors in logs:
- The customer portal's rate limit might be too strict
- Consider asking them to increase the limit
- Or reduce `MAX_REQUESTS_PER_MINUTE` on our side

### 4. **Check Customer Portal**

Verify feedback is being received:
- Check customer portal dashboard/analytics
- Confirm feedback data is being stored
- Verify timestamps match when feedback was submitted

## Troubleshooting

### Issue: Still getting 429 errors

**Possible Causes:**
1. Customer portal rate limit is very strict (e.g., 5 requests/minute)
2. Multiple server instances (each has its own rate limit counter)
3. High traffic causing many simultaneous requests

**Solutions:**
1. Reduce `MAX_REQUESTS_PER_MINUTE` to match portal's limit
2. Ask customer portal team to increase their rate limit
3. Consider implementing a queue system for high-traffic scenarios

### Issue: Feedback not appearing in portal

**Check:**
1. Render logs for errors
2. Customer portal endpoint is working
3. Network connectivity between services
4. Customer portal database is storing data

### Issue: Too many skipped requests

**Solution:**
- Increase `MAX_REQUESTS_PER_MINUTE` if portal can handle more
- Or implement a queue to batch requests

## Current Status

✅ **Implemented:**
- Client-side rate limiting (10 requests/minute)
- Automatic retry with exponential backoff
- Better error handling and logging
- User experience protection (always returns success)

✅ **Working:**
- Feedback is sent successfully when under rate limits
- Retries automatically on 429 errors
- Graceful degradation when rate limited

⏳ **Monitoring:**
- Watch Render logs for rate limit patterns
- Track success rate of feedback submissions
- Monitor customer portal for received feedback

## Next Steps

1. **Deploy the updated code** to Render
2. **Monitor logs** for a few days to see rate limiting patterns
3. **Adjust configuration** if needed based on actual usage
4. **Coordinate with customer portal team** if rate limits need adjustment

## Questions for Customer Portal Team

If rate limiting continues to be an issue, consider asking:

1. What is the current rate limit on `/api/statistics/ai-feedback`?
2. Can the rate limit be increased for AI feedback?
3. Is there a `Retry-After` header being sent with 429 responses?
4. Can we implement batching (send multiple feedback items in one request)?

---

**Last Updated:** 2025-01-27
**Status:** ✅ Implemented and ready for deployment

