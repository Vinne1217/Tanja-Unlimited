# Message to Source Database Team - Payment Failure Handling

**Subject:** Extend Stripe Webhook Handler to Process Failed Payments

---

Hi Source Database Team,

We need to extend the existing `/webhooks/stripe-payments` endpoint to handle failed payments the same way it handles successful payments. This will ensure failed payments appear in the customer portal for all tenants (Tanja, Kraftverk, etc.).

## Current Situation

Currently, the webhook handler processes:
- ✅ `checkout.session.completed` → sends to customer portal with `status: 'completed'`
- ✅ `payment_intent.succeeded` → sends to customer portal with `status: 'completed'`

**Missing:**
- ❌ `payment_intent.payment_failed` → not processed
- ❌ `checkout.session.async_payment_failed` → not processed

## What We Need

Extend the existing webhook handler to also process payment failure events and send them to the customer portal with `status: 'failed'`, using the same tenant identification logic (from `checkoutSession.metadata.tenant`).

## Implementation Details

### 1. Add Event Handlers

Add handling for these two events in your existing `/webhooks/stripe-payments` handler:
- `payment_intent.payment_failed`
- `checkout.session.async_payment_failed`

### 2. Extract Checkout Session

For `payment_intent.payment_failed` events, retrieve the associated checkout session:

```typescript
// Method 1: From payment intent metadata
if (paymentIntent.metadata?.checkout_session_id) {
  checkoutSession = await stripe.checkout.sessions.retrieve(
    paymentIntent.metadata.checkout_session_id
  );
}

// Method 2: From charge metadata (fallback)
if (!checkoutSession && paymentIntent.latest_charge) {
  const charge = await stripe.charges.retrieve(chargeId);
  if (charge.metadata?.checkout_session_id) {
    checkoutSession = await stripe.checkout.sessions.retrieve(
      charge.metadata.checkout_session_id
    );
  }
}
```

For `checkout.session.async_payment_failed`, the session is already in the event data.

### 3. Identify Tenant (Same as Successful Payments)

```typescript
const tenant = checkoutSession.metadata?.tenant; // e.g., 'tanjaunlimited', 'kraftverk', etc.
```

### 4. Send to Customer Portal

Use the same customer portal endpoint/function you use for successful payments, but with `status: 'failed'`:

```typescript
await sendToCustomerPortal({
  tenant,
  sessionId: checkoutSession.id,
  status: 'failed', // ← Only difference from successful payments
  customerEmail: checkoutSession.customer_email,
  amount: (checkoutSession.amount_total || 0) / 100,
  currency: checkoutSession.currency || 'SEK',
  paymentIntentId: paymentIntent.id,
  // ... include all other fields you send for successful payments
});
```

## Stripe Webhook Configuration

Please ensure the webhook endpoint is configured to listen for these events:

**In Stripe Dashboard → Developers → Webhooks:**

```
Endpoint URL: https://source-database.onrender.com/webhooks/stripe-payments

Events to listen for:
✅ checkout.session.completed (already configured)
✅ payment_intent.succeeded (already configured)
✅ payment_intent.payment_failed (NEW - please add)
✅ checkout.session.async_payment_failed (NEW - please add)
```

## Benefits

- ✅ **Shared endpoint**: Uses the same `/webhooks/stripe-payments` endpoint (no new endpoints needed)
- ✅ **Works for all tenants**: Automatically works for Tanja, Kraftverk, and any future tenants
- ✅ **Consistent flow**: Failed payments use the same logic as successful payments
- ✅ **Customer visibility**: Failed payments will appear in customer portal for tracking

## Testing

After implementation, we can test with:
- Failing payment card: `4000 0000 0000 0002`
- Verify failed payment appears in customer portal with `status: 'failed'`

## Documentation

I've attached a detailed implementation guide (`SOURCE_DATABASE_PAYMENT_FAILURE_IMPLEMENTATION.md`) with complete code examples and step-by-step instructions.

Please let me know if you have any questions or need clarification on any part of the implementation.

Thanks!

---

**Attachments:**
- `SOURCE_DATABASE_PAYMENT_FAILURE_IMPLEMENTATION.md` - Complete implementation guide


