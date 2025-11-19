# Copy-Paste Message for Customer Portal Team - 500 Error Follow-up

---

**Subject:** AI Feedback Endpoint - 500 Error "Error saving feedback" - Database Issue?

---

Hi Customer Portal Team,

We're still experiencing 500 errors when sending AI feedback, even after implementing all the requirements. The error message indicates a database/server issue on your side.

## Current Error

**Status:** 500 Internal Server Error  
**Error Message:** `{"success":false,"message":"Error saving feedback"}`

**Example Log:**
```
❌ Failed to send feedback to customer portal: {
  status: 500,
  response: '{"success":false,"message":"Error saving feedback"}',
  messageId: '1763578172669',
  tenantId: 'tanjaunlimited'
}
```

## What We're Sending

**Headers:**
```
Content-Type: application/json
X-Tenant: tanjaunlimited
```

**Payload:**
```json
{
  "messageId": "1763578172669",
  "rating": "positive",
  "message": "AI assistant's response text (non-empty, validated)",
  "userMessage": "User's original question",
  "tenantId": "tanjaunlimited",
  "timestamp": "2025-01-27T16:00:00.000Z",
  "source": "tanja-unlimited-website",
  "type": "ai-assistant-feedback"
}
```

## Our Implementation

✅ **All Validations in Place:**
- Rating is lowercase and exactly "positive" or "negative"
- Message field is not empty (validated before sending)
- All required fields are present
- X-Tenant header is included

✅ **Retry Logic:**
- We retry 500 errors 3 times with exponential backoff (5s, 10s, 20s)
- All retries are also returning 500 errors

## What We Need

The error "Error saving feedback" suggests a database or server issue. Could you please check:

1. **Database Connection:**
   - Is the database connection working?
   - Are there any connection pool issues?
   - Is the database accessible?

2. **Database Schema:**
   - Does the `ai_feedback` collection/table exist?
   - Are all required fields in the schema?
   - Is there a schema mismatch?

3. **Server Logs:**
   - What is the actual error in your server logs?
   - Is there a stack trace we can review?
   - Are there any database constraint violations?

4. **Request Format:**
   - Is our request format correct?
   - Are we missing any required fields?
   - Is the X-Tenant header being processed correctly?

## Impact

- Users can submit feedback (we handle it gracefully)
- But feedback is not being saved to your portal
- We're retrying automatically, but all retries fail with 500
- This prevents us from collecting analytics

## Request

Could you please:
1. Check your server logs for the actual error when receiving our requests
2. Verify the database connection and schema
3. Test the endpoint with our exact payload format
4. Let us know what the actual issue is so we can adjust if needed

## Test Payload

You can test with this exact payload:

```bash
curl -X POST https://admin-portal-rn5z.onrender.com/api/statistics/ai-feedback \
  -H "Content-Type: application/json" \
  -H "X-Tenant: tanjaunlimited" \
  -d '{
    "messageId": "test-500-debug-123",
    "rating": "positive",
    "message": "Test message to debug 500 error",
    "userMessage": "Test question",
    "tenantId": "tanjaunlimited",
    "timestamp": "2025-01-27T16:00:00.000Z",
    "source": "tanja-unlimited-website",
    "type": "ai-assistant-feedback"
  }'
```

## Next Steps

Once you've identified the issue:
1. Let us know what needs to be fixed (on our side or yours)
2. We'll adjust our implementation if needed
3. We'll test again once the issue is resolved

Thanks for your help!

Tanja Unlimited Team

---

