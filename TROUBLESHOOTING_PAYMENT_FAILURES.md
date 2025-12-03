# Troubleshooting Payment Failures - Why No Logs in Tanja

## The Issue

When testing a failed payment, you only see checkout session creation in Tanja's logs, but no webhook events. This is **expected behavior** because:

**The webhook goes directly to Source Database, not to Tanja's server.**

## Current Architecture

```
Payment Fails (402 error in browser)
         ↓
Stripe sends webhook → https://source-database.onrender.com/webhooks/stripe
         ↓
Source Database receives webhook (Tanja never sees it)
         ↓
Source Database processes it (or doesn't, if not implemented yet)
```

## Why You Don't See Webhook Logs in Tanja

Tanja's webhook handler at `/api/webhooks/stripe` is **never called** because:
- Stripe webhook is configured to go directly to Source Database
- Tanja's server never receives the webhook event
- Therefore, no logs appear in Tanja's Render logs

## How to Verify the Webhook is Being Sent

### Step 1: Check Stripe Dashboard

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click on your webhook endpoint (the one pointing to Source Database)
3. Click **"Recent events"** tab
4. Look for `payment_intent.payment_failed` events
5. Check the response status:
   - **200 OK** = Source Database received and processed it
   - **4xx/5xx** = Source Database has an error
   - **No event** = Webhook not configured for this event type

### Step 2: Check Source Database Logs

Since the webhook goes to Source Database, check **their Render logs**:
1. Go to Source Database's Render dashboard
2. Navigate to **Logs**
3. Look for:
   - `payment_intent.payment_failed` events
   - Any errors processing the webhook
   - Checkout session retrieval attempts

### Step 3: Verify Webhook Configuration

In **Stripe Dashboard** → **Webhooks** → Your endpoint:

**Events should include:**
- ✅ `checkout.session.completed` (for successful payments)
- ✅ `payment_intent.succeeded` (for successful payments)
- ✅ `payment_intent.payment_failed` (for failed payments) ← **Check this is enabled**
- ✅ `checkout.session.async_payment_failed` (for async failures) ← **Check this is enabled**

## What Should Happen

### If Source Database Has Implemented Payment Failure Handling:

1. Stripe sends `payment_intent.payment_failed` webhook
2. Source Database receives it
3. Source Database retrieves checkout session
4. Source Database identifies tenant from `session.metadata.tenant`
5. Source Database sends to customer portal with `status: 'failed'`
6. Failed payment appears in customer portal ✅

### If Source Database Has NOT Implemented Payment Failure Handling Yet:

1. Stripe sends `payment_intent.payment_failed` webhook
2. Source Database receives it
3. Source Database doesn't process it (no handler for this event)
4. Webhook might return 200 OK but nothing happens
5. Failed payment does NOT appear in customer portal ❌

## Next Steps

### Option 1: Wait for Source Database Implementation (Recommended)

Since you've already sent them the implementation guide, wait for Source Database to:
1. Add handlers for `payment_intent.payment_failed` and `checkout.session.async_payment_failed`
2. Process these events the same way as successful payments
3. Send to customer portal with `status: 'failed'`

**Check with Source Database team:**
- Have they implemented payment failure handling?
- Are they receiving the webhook events?
- Are there any errors in their logs?

### Option 2: Add Second Webhook Endpoint (Temporary Solution)

If you want to test Tanja's webhook handler immediately, you can add a second webhook endpoint:

1. **In Stripe Dashboard** → **Webhooks** → **Add endpoint**
2. **Endpoint URL**: `https://tanja-unlimited.onrender.com/api/webhooks/stripe`
3. **Events**: 
   - `payment_intent.payment_failed`
   - `checkout.session.async_payment_failed`
4. **Get webhook secret** and add to Render as `STRIPE_WEBHOOK_SECRET`

This will allow Tanja's webhook handler to process failures and send them to the customer portal, while still forwarding to Source Database.

## Testing Checklist

- [ ] Check Stripe Dashboard → Webhooks → Recent events for `payment_intent.payment_failed`
- [ ] Check Source Database logs for webhook receipt
- [ ] Verify webhook events are enabled in Stripe Dashboard
- [ ] Check if Source Database has implemented payment failure handling
- [ ] Verify failed payment appears in customer portal (after Source Database implements it)

## Expected Logs (After Source Database Implements)

**In Source Database logs, you should see:**
- `payment_intent.payment_failed` event received
- Checkout session retrieved
- Tenant identified: `tanjaunlimited`
- Failed payment sent to customer portal

**In Tanja's logs, you will NOT see webhook logs** (because webhook goes directly to Source Database)

---

**Last Updated:** 2025-01-27




