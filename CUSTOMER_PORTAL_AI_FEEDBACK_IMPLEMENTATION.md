# AI Assistant Feedback Implementation - Customer Portal Requirements

Hi Customer Portal Team,

We've implemented an AI assistant on the Tanja Unlimited website that helps customers with questions about our products, collection, and website navigation. The assistant collects feedback (thumbs up/down) after each response, and we need your help to implement the backend endpoint to receive and store this feedback data.

---

## Overview

**What We've Built:**
- AI assistant chat interface on the website
- Feedback system (thumbs up/down) after each AI response
- API endpoint that sends feedback to your portal

**What We Need:**
- Backend endpoint to receive and store AI assistant feedback
- Database storage for feedback analytics
- Optional: Dashboard to view feedback statistics

---

## API Endpoint Specification

### **Endpoint Details**

**URL:** `POST https://admin-portal-rn5z.onrender.com/api/statistics/ai-feedback`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
X-Tenant: tanjaunlimited
```

**Authentication:** 
- Currently no authentication required (same pattern as other statistics endpoints)
- If you prefer authentication, we can add `Authorization: Bearer <API_KEY>` header

---

## Request Payload Format

We send the following JSON structure:

```json
{
  "messageId": "unique-message-id-12345",
  "rating": "positive",
  "message": "The AI assistant's response text that was rated",
  "userMessage": "The user's original question",
  "timestamp": "2025-01-27T14:30:00.000Z",
  "source": "tanja-unlimited-website",
  "type": "ai-assistant-feedback",
  "tenantId": "tanjaunlimited"
}
```

### **Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messageId` | string | ✅ Yes | Unique identifier for the AI response message |
| `rating` | string | ✅ Yes | Either `"positive"` or `"negative"` |
| `message` | string | ✅ Yes | The full text of the AI assistant's response that was rated |
| `userMessage` | string | ⚠️ Optional | The user's original question (may be empty string) |
| `timestamp` | string (ISO 8601) | ✅ Yes | When the feedback was submitted |
| `source` | string | ✅ Yes | Always `"tanja-unlimited-website"` |
| `type` | string | ✅ Yes | Always `"ai-assistant-feedback"` |
| `tenantId` | string | ✅ Yes | Always `"tanjaunlimited"` |

---

## Expected Response

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Feedback received",
  "feedbackId": "optional-feedback-id-if-you-generate-one"
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "message": "Error description",
  "error": "optional-error-code"
}
```

---

## Database Storage Recommendations

We recommend storing the feedback with the following structure:

**Collection/Table:** `ai_feedback` or `statistics_ai_feedback`

**Document/Record Structure:**
```json
{
  "_id": "auto-generated-id",
  "messageId": "unique-message-id-12345",
  "tenantId": "tanjaunlimited",
  "rating": "positive",
  "message": "The AI assistant's response text",
  "userMessage": "The user's original question",
  "timestamp": "2025-01-27T14:30:00.000Z",
  "source": "tanja-unlimited-website",
  "type": "ai-assistant-feedback",
  "createdAt": "2025-01-27T14:30:00.000Z",
  "updatedAt": "2025-01-27T14:30:00.000Z"
}
```

**Indexes to Consider:**
- `tenantId` (for filtering by tenant)
- `timestamp` (for time-based queries)
- `rating` (for analytics)
- `messageId` (for deduplication if needed)

---

## Implementation Example

### **Node.js/Express Example:**

```javascript
app.post('/api/statistics/ai-feedback', async (req, res) => {
  try {
    const {
      messageId,
      rating,
      message,
      userMessage,
      timestamp,
      source,
      type,
      tenantId
    } = req.body;

    // Validate required fields
    if (!messageId || !rating || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: messageId, rating, or message'
      });
    }

    // Validate rating value
    if (!['positive', 'negative'].includes(rating)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be "positive" or "negative"'
      });
    }

    // Store in database
    const feedback = {
      messageId,
      tenantId: tenantId || 'tanjaunlimited',
      rating,
      message,
      userMessage: userMessage || '',
      timestamp: timestamp || new Date().toISOString(),
      source: source || 'tanja-unlimited-website',
      type: type || 'ai-assistant-feedback',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert into database (example with MongoDB)
    await db.collection('ai_feedback').insertOne(feedback);

    res.json({
      success: true,
      message: 'Feedback received',
      feedbackId: feedback._id
    });
  } catch (error) {
    console.error('Error storing AI feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store feedback'
    });
  }
});
```

---

## Testing

### **Test Request:**

```bash
curl -X POST https://admin-portal-rn5z.onrender.com/api/statistics/ai-feedback \
  -H "Content-Type: application/json" \
  -H "X-Tenant: tanjaunlimited" \
  -d '{
    "messageId": "test-12345",
    "rating": "positive",
    "message": "Tanja Unlimited offers handcrafted, reversible jackets made from antique fabrics from Rajasthan, India.",
    "userMessage": "What is Tanja Unlimited?",
    "timestamp": "2025-01-27T14:30:00.000Z",
    "source": "tanja-unlimited-website",
    "type": "ai-assistant-feedback",
    "tenantId": "tanjaunlimited"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Feedback received"
}
```

---

## Analytics Use Cases

Once feedback is stored, you can use it for:

1. **Feedback Quality Analysis:**
   - Percentage of positive vs negative feedback
   - Most helpful responses
   - Responses that need improvement

2. **User Question Analysis:**
   - Most common questions
   - Questions that receive negative feedback
   - Topics that need better AI responses

3. **Performance Metrics:**
   - Total feedback count
   - Feedback over time
   - Response quality trends

4. **AI Improvement:**
   - Identify patterns in negative feedback
   - Update AI knowledge base based on feedback
   - Improve responses to common questions

---

## Current Status

**What We've Done:**
- ✅ Implemented AI assistant on website
- ✅ Added feedback collection (thumbs up/down)
- ✅ Created API endpoint that sends feedback to your portal
- ✅ Added comprehensive logging for debugging
- ✅ Added error handling (doesn't break user experience if portal fails)

**What We Need:**
- ⏳ Backend endpoint implementation (this document)
- ⏳ Database storage setup
- ⏳ Confirmation that endpoint is working

---

## Next Steps

1. **You implement the endpoint** based on this specification
2. **Test the endpoint** using the test request above
3. **Confirm it's working** - we'll verify on our end
4. **Optional:** Set up analytics dashboard to view feedback

---

## Questions or Issues?

If you have any questions about:
- The payload format
- Authentication requirements
- Database structure
- Error handling
- Or anything else

Please let us know! We're happy to adjust the format or add any additional fields you need.

---

## Timeline

We're ready to start sending feedback as soon as the endpoint is implemented. The AI assistant is already live on the website, and feedback is being collected (currently logged but not stored until your endpoint is ready).

**Priority:** Medium (nice to have for analytics, but not blocking the AI assistant functionality)

Thanks for your help!

Tanja Unlimited Team

