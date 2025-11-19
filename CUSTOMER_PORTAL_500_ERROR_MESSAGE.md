# Copy-Paste Message for Customer Portal Team - 500 Error Issue

---

**Subject:** AI Feedback Endpoint - 500 Internal Server Error

---

Hi Customer Portal Team,

We've tested the AI feedback endpoint and found that it's implemented and accessible, but it's returning a 500 Internal Server Error when we try to send feedback.

## Test Results

**Endpoint:** `POST https://admin-portal-rn5z.onrender.com/api/statistics/ai-feedback`

**Status:** ✅ Endpoint exists and is accessible  
**Issue:** ❌ Returns 500 Internal Server Error

**Error Response:**
```json
{
  "success": false,
  "message": "Error saving feedback"
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
  "messageId": "unique-message-id-12345",
  "rating": "positive",
  "message": "The AI assistant's response text",
  "userMessage": "The user's original question",
  "timestamp": "2025-01-27T14:43:40.574Z",
  "source": "tanja-unlimited-website",
  "type": "ai-assistant-feedback",
  "tenantId": "tanjaunlimited"
}
```

## What We Need

The error message "Error saving feedback" suggests a database or storage issue. Could you please check:

1. **Server Logs** - What is the actual error when trying to save feedback?
2. **Database Connection** - Is the database connection working?
3. **Database Table/Collection** - Does the `ai_feedback` collection/table exist?
4. **Schema** - Does the database schema match our payload structure?

## Current Impact

- Our AI assistant is collecting feedback from users
- Feedback is being accepted on our side (users see success)
- But it's not being saved to your portal due to the 500 error
- We're also seeing some 429 (rate limit) errors, which might be related to the 500 errors

## Next Steps

Once you've fixed the 500 error, we can:
1. Re-test the endpoint to confirm it's working
2. Verify feedback is being saved correctly
3. Monitor for any remaining rate limiting issues

## Questions

1. Is the endpoint fully implemented on your side?
2. What is the expected database schema for storing feedback?
3. Are there any required fields we might be missing?
4. What is the rate limit on this endpoint? (We're seeing some 429 errors)

Please let us know once the issue is resolved, and we'll test again to confirm everything is working.

Thanks!

Tanja Unlimited Team

---

