# Payment Failure Webhook Setup

## Problem
Currently, Stripe webhooks are configured to go directly to Source Database, bypassing Tanja's webhook handler. This means payment failures are not being caught and sent to the customer portal.

## Solution
Configure a Stripe webhook endpoint that points to Tanja's server (`/api/webhooks/stripe`). This allows Tanja to:
1. Process payment failures immediately
2. Send failed payment data to the customer portal
3. Then forward the webhook to Source for general processing

---

## Setup Instructions

### Step 1: Add Webhook Endpoint in Stripe Dashboard

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter endpoint URL:
   ```
   https://tanja-unlimited.onrender.com/api/webhooks/stripe
   ```
   (Replace with your actual Render URL if different)

### Step 2: Select Events to Listen For

Enable these events:
- ✅ `payment_intent.payment_failed` (REQUIRED for payment failure handling)
- ✅ `payment_intent.succeeded`
- ✅ `checkout.session.completed`
- ✅ `checkout.session.async_payment_failed`

### Step 3: Get Webhook Secret

1. After creating the endpoint, click on it in the webhooks list
2. Click **"Reveal"** next to **"Signing secret"**
3. Copy the secret (it starts with `whsec_`)

### Step 4: Add to Render Environment Variables

1. Go to **Render Dashboard** → Your Tanja service
2. Navigate to **Environment**
3. Add or update:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```
4. Click **"Save Changes"**
5. Render will automatically redeploy

---

## Architecture Flow

```
Payment Fails (402 error in browser)
         ↓
Stripe sends webhook → https://tanja-unlimited.onrender.com/api/webhooks/stripe
         ↓
Tanja's webhook handler:
  1. Verifies webhook signature
  2. Detects payment failure event
  3. Processes failure and sends to customer portal ✅
  4. Forwards webhook to Source Database
         ↓
Source Database receives webhook for general processing
```

---

## Verification

After setup, test with a failing payment:

1. **Use a test card that will fail:**
   - Card number: `4000 0000 0000 0002`
   - Any future expiry date
   - Any CVC

2. **Check Tanja's Render logs for:**
   - `📨 Webhook event received: payment_intent.payment_failed`
   - `🔴 Payment failure detected - processing...`
   - `💳 Processing payment failure event`
   - `📤 Sending failed payment to customer portal`
   - `✅ Failed payment sent to customer portal`

3. **Check Stripe Dashboard:**
   - Go to **Developers** → **Webhooks** → Your Tanja endpoint
   - View **Recent events**
   - Should show `payment_intent.payment_failed` with **200 OK** response

4. **Check Customer Portal:**
   - Failed payment should appear with status "failed"
   - Includes failure reason and error code

---

## Important Notes

- **The 402 error in the browser console is EXPECTED** when a payment fails
- Stripe will display an error message on the checkout page
- The webhook is what triggers our payment failure handling
- You can have BOTH webhook endpoints:
  - One pointing to Source (for general processing)
  - One pointing to Tanja (for payment failure handling)

---

## Troubleshooting

### Webhook Not Being Received

**Check 1: Webhook URL**
- Verify URL in Stripe Dashboard matches your Render URL exactly
- Include `/api/webhooks/stripe` at the end
- Must be HTTPS (not HTTP)

**Check 2: Environment Variable**
- Verify `STRIPE_WEBHOOK_SECRET` is set in Render
- Secret must match the one from Stripe Dashboard
- Check for typos or extra spaces

**Check 3: Events Enabled**
- Verify `payment_intent.payment_failed` is selected in Stripe
- Check other required events are also enabled

**Check 4: Render Logs**
- Look for webhook verification errors
- Check if webhook endpoint is accessible
- Verify no 404 or 500 errors

### Payment Failure Not Appearing in Portal

**Check 1: Webhook Processing**
- Verify webhook is being received (check logs)
- Check if `handlePaymentFailure` is being called
- Look for error messages in logs

**Check 2: Customer Portal Endpoint**
- Verify `SOURCE_DATABASE_URL` is correct in Render
- Check if `/webhooks/tanja-customer-data` endpoint exists
- Verify `TENANT_ID` is set correctly

**Check 3: Required Data**
- Check logs for "Cannot send payment failure - missing required data"
- Verify session ID and customer email are available
- Check metadata extraction is working

---

## Current Status

- ✅ Payment failure handler code implemented
- ✅ Webhook endpoint exists at `/api/webhooks/stripe`
- ⏳ **NEEDS: Stripe webhook endpoint configured**
- ⏳ **NEEDS: `STRIPE_WEBHOOK_SECRET` added to Render**

---

**Last Updated:** 2025-01-27  
**Status:** ⚠️ Pending Stripe webhook configuration

