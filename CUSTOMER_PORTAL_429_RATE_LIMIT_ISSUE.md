# Copy-Paste Message for Customer Portal Team - 429 Rate Limit Issue

---

**Subject:** AI Feedback Endpoint - Still Getting 429 Errors Despite X-Tenant Header

---

Hi Customer Portal Team,

We've implemented the X-Tenant header as requested, but we're still experiencing 429 (Rate Limit Exceeded) errors even with very conservative request rates.

## Current Status

✅ **X-Tenant Header:** Implemented and being sent  
✅ **Header Value:** `X-Tenant: tanjaunlimited`  
❌ **Issue:** Still receiving 429 errors

## What We're Seeing

**Logs show:**
```
📤 Sending AI feedback to customer portal: {
  messageId: '1763566399863',
  rating: 'positive',
  tenantId: 'tanjaunlimited',
  headers: { 
    'Content-Type': 'application/json', 
    'X-Tenant': 'tanjaunlimited'  // ✅ Header is being sent
  }
}
⏳ Rate limited (429), retrying in 5s (attempt 1/3)
⏳ Rate limited (429), retrying in 10s (attempt 2/3)
⏳ Rate limited (429), retrying in 20s (attempt 3/3)
❌ Rate limited by customer portal (429) - max retries reached
```

## Our Current Rate Limiting

We've implemented very conservative client-side rate limiting:
- **Maximum:** 5 requests per minute (reduced from 10)
- **Retry delays:** 5 seconds, 10 seconds, 20 seconds (exponential backoff)
- **X-Tenant header:** Always included in requests

## Questions

1. **Is per-tenant rate limiting fully implemented?**
   - We're sending the X-Tenant header, but still getting 429s
   - Are requests being properly isolated by tenant?

2. **What is the actual rate limit?**
   - The guide mentioned 500 requests/minute per tenant
   - But we're getting 429s with just a few requests
   - Is the limit actually lower, or is there an issue?

3. **Are there any other requirements?**
   - Do we need additional headers?
   - Is there authentication required?
   - Are there any other configuration steps?

4. **Can you verify the X-Tenant header is being received?**
   - Our logs show we're sending it
   - Can you confirm it's being received and processed correctly?

## Test Request

Here's an example of what we're sending:

**Headers:**
```
Content-Type: application/json
X-Tenant: tanjaunlimited
```

**Payload:**
```json
{
  "messageId": "1763566399863",
  "rating": "positive",
  "message": "AI assistant response text",
  "userMessage": "User question",
  "timestamp": "2025-11-19T15:33:21.337Z",
  "source": "tanja-unlimited-website",
  "type": "ai-assistant-feedback",
  "tenantId": "tanjaunlimited"
}
```

## Impact

- Users can still submit feedback (we handle it gracefully)
- But feedback is not being saved to your portal due to 429 errors
- This prevents us from collecting analytics on AI assistant performance

## Next Steps

Could you please:
1. Verify the X-Tenant header is being received correctly
2. Confirm per-tenant rate limiting is working
3. Check if there's a lower rate limit than 500/min
4. Let us know if there are any other requirements we're missing

Once this is resolved, we can test again and verify feedback is being saved correctly.

Thanks!

Tanja Unlimited Team

---

