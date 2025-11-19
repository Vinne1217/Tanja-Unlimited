# Copy-Paste Message for Customer Portal Team

---

**Subject:** AI Assistant Feedback Endpoint Implementation Request

---

Hi Customer Portal Team,

We've implemented an AI assistant on the Tanja Unlimited website that helps customers with questions about our products, collection, and website navigation. The assistant collects feedback (thumbs up/down) after each response, and we need your help to implement the backend endpoint to receive and store this feedback data.

## What We Need

We need you to implement a backend endpoint that receives AI assistant feedback data:

**Endpoint:** `POST https://admin-portal-rn5z.onrender.com/api/statistics/ai-feedback`

**Headers:**
- `Content-Type: application/json`
- `X-Tenant: tanjaunlimited`

## Request Payload

We'll send the following JSON structure:

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

**Field Details:**
- `messageId` (required): Unique identifier for the AI response
- `rating` (required): Either `"positive"` or `"negative"`
- `message` (required): The full text of the AI assistant's response
- `userMessage` (optional): The user's original question
- `timestamp` (required): ISO 8601 timestamp
- `source` (required): Always `"tanja-unlimited-website"`
- `type` (required): Always `"ai-assistant-feedback"`
- `tenantId` (required): Always `"tanjaunlimited"`

## Expected Response

**Success (200 OK):**
```json
{
  "success": true,
  "message": "Feedback received"
}
```

**Error (400/500):**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Database Storage

We recommend storing feedback in a collection/table (e.g., `ai_feedback`) with the following structure:

```json
{
  "messageId": "unique-message-id-12345",
  "tenantId": "tanjaunlimited",
  "rating": "positive",
  "message": "The AI assistant's response text",
  "userMessage": "The user's original question",
  "timestamp": "2025-01-27T14:30:00.000Z",
  "source": "tanja-unlimited-website",
  "type": "ai-assistant-feedback",
  "createdAt": "2025-01-27T14:30:00.000Z"
}
```

**Recommended Indexes:**
- `tenantId` (for filtering)
- `timestamp` (for time-based queries)
- `rating` (for analytics)

## Test Request

You can test with this curl command:

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

## Implementation Example (Node.js/Express)

```javascript
app.post('/api/statistics/ai-feedback', async (req, res) => {
  try {
    const { messageId, rating, message, userMessage, timestamp, source, type, tenantId } = req.body;

    // Validate required fields
    if (!messageId || !rating || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: messageId, rating, or message'
      });
    }

    // Validate rating
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
      createdAt: new Date()
    };

    await db.collection('ai_feedback').insertOne(feedback);

    res.json({
      success: true,
      message: 'Feedback received'
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

## Use Cases

Once stored, this feedback can be used for:
- Analytics: Percentage of positive vs negative feedback
- Quality improvement: Identify responses that need better answers
- User insights: Most common questions and topics
- AI training: Improve responses based on feedback patterns

## Current Status

✅ **Our side:** AI assistant is live, feedback collection is working, API endpoint is ready to send data
⏳ **Your side:** Need endpoint implementation

## Questions?

If you need any clarification on:
- Payload format
- Authentication requirements
- Database structure
- Error handling
- Or anything else

Please let us know! We're ready to start sending feedback as soon as the endpoint is implemented.

Thanks!

Tanja Unlimited Team

---

