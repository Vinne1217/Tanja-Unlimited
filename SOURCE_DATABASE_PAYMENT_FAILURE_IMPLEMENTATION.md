# Payment Failure Handling Implementation for Source Database

## Overview

This document explains how to extend Source Database's existing `/webhooks/stripe-payments` endpoint to handle failed payments the same way as successful payments, using the shared endpoint approach.

## Current Architecture

**Successful Payments Flow:**
```
Stripe → /webhooks/stripe-payments (Source Database)
         ↓
    Identifies tenant from checkoutSession.metadata.tenant
         ↓
    Sends to customer portal with status: 'completed' ✅
```

**Failed Payments Flow (TO BE IMPLEMENTED):**
```
Stripe → /webhooks/stripe-payments (Source Database)
         ↓
    Identifies tenant from checkoutSession.metadata.tenant
         ↓
    Sends to customer portal with status: 'failed' ✅
```

## Implementation Details

### Step 1: Add Event Handlers

Extend the existing webhook handler to process these additional events:

- `payment_intent.payment_failed` - When a payment attempt fails
- `checkout.session.async_payment_failed` - When an async payment fails

### Step 2: Extract Checkout Session from Payment Intent

For `payment_intent.payment_failed` events, you need to retrieve the associated checkout session:

**Method 1: From Payment Intent Metadata**
```typescript
if (paymentIntent.metadata?.checkout_session_id) {
  checkoutSession = await stripe.checkout.sessions.retrieve(
    paymentIntent.metadata.checkout_session_id
  );
}
```

**Method 2: From Charge Metadata (fallback)**
```typescript
if (paymentIntent.latest_charge) {
  const charge = await stripe.charges.retrieve(chargeId);
  if (charge.metadata?.checkout_session_id) {
    checkoutSession = await stripe.checkout.sessions.retrieve(
      charge.metadata.checkout_session_id
    );
  }
}
```

### Step 3: Identify Tenant (Same as Successful Payments)

```typescript
const tenant = checkoutSession.metadata?.tenant; // e.g., 'tanjaunlimited'
```

### Step 4: Send to Customer Portal (Same Endpoint, Different Status)

Use the same customer portal endpoint as successful payments, but with `status: 'failed'`:

```typescript
await sendToCustomerPortal({
  tenant,
  sessionId: checkoutSession.id,
  status: 'failed', // ← Key difference from successful payments
  customerEmail: checkoutSession.customer_email,
  amount: (checkoutSession.amount_total || 0) / 100,
  currency: checkoutSession.currency || 'SEK',
  paymentIntentId: paymentIntent.id,
  // ... other fields
});
```

## Complete Implementation Example

```typescript
// Source Database: /webhooks/stripe-payments handler
import Stripe from 'stripe';

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const event = await verifyWebhook(req); // Your existing webhook verification
  
  // Existing: Handle successful payments
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const tenant = session.metadata?.tenant;
    
    if (tenant) {
      await sendToCustomerPortal({
        tenant,
        sessionId: session.id,
        status: 'completed',
        customerEmail: session.customer_email,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency || 'SEK',
        // ... other existing fields
      });
    }
  }
  
  // NEW: Handle payment_intent.payment_failed
  else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    // Get checkout session from payment intent
    let checkoutSession: Stripe.Checkout.Session | null = null;
    
    // Method 1: Check payment intent metadata
    if (paymentIntent.metadata?.checkout_session_id) {
      try {
        checkoutSession = await stripe.checkout.sessions.retrieve(
          paymentIntent.metadata.checkout_session_id
        );
      } catch (err) {
        console.error('Error retrieving session from payment intent metadata:', err);
      }
    }
    
    // Method 2: Check charge metadata (fallback)
    if (!checkoutSession && paymentIntent.latest_charge) {
      try {
        const chargeId = typeof paymentIntent.latest_charge === 'string'
          ? paymentIntent.latest_charge
          : paymentIntent.latest_charge.id;
        
        const charge = await stripe.charges.retrieve(chargeId);
        if (charge.metadata?.checkout_session_id) {
          checkoutSession = await stripe.checkout.sessions.retrieve(
            charge.metadata.checkout_session_id
          );
        }
      } catch (err) {
        console.error('Error retrieving session from charge metadata:', err);
      }
    }
    
    // Process if we found the checkout session
    if (checkoutSession) {
      const tenant = checkoutSession.metadata?.tenant;
      
      if (tenant) {
        await sendToCustomerPortal({
          tenant,
          sessionId: checkoutSession.id,
          status: 'failed', // ← Key: status is 'failed'
          customerEmail: checkoutSession.customer_email,
          amount: (checkoutSession.amount_total || 0) / 100,
          currency: checkoutSession.currency || 'SEK',
          paymentIntentId: paymentIntent.id,
          // Include any other fields you send for successful payments
        });
      }
    } else {
      console.warn('Could not find checkout session for payment_intent.payment_failed:', paymentIntent.id);
    }
  }
  
  // NEW: Handle checkout.session.async_payment_failed (easier - session is in event)
  else if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const tenant = session.metadata?.tenant;
    
    if (tenant) {
      await sendToCustomerPortal({
        tenant,
        sessionId: session.id,
        status: 'failed',
        customerEmail: session.customer_email,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency || 'SEK',
        paymentIntentId: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id,
        // Include any other fields you send for successful payments
      });
    }
  }
  
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

## Stripe Webhook Configuration

Ensure the webhook endpoint is configured to listen for these events:

**In Stripe Dashboard → Developers → Webhooks:**

```
Endpoint URL: https://source-database.onrender.com/webhooks/stripe-payments

Events to listen for:
✅ checkout.session.completed (existing)
✅ payment_intent.succeeded (existing)
✅ payment_intent.payment_failed (NEW - required)
✅ checkout.session.async_payment_failed (NEW - required)
```

## Testing

1. **Test with a failing payment card:**
   - Card number: `4000 0000 0000 0002`
   - Any future expiry date
   - Any CVC

2. **Verify in logs:**
   - Payment failure event received
   - Checkout session retrieved
   - Tenant identified from metadata
   - Failed payment sent to customer portal

3. **Verify in customer portal:**
   - Failed payment appears with `status: 'failed'`
   - Same data structure as successful payments
   - Tenant routing works correctly

## Key Points

- ✅ **Shared endpoint**: Use the same `/webhooks/stripe-payments` endpoint for all tenants
- ✅ **Tenant identification**: Extract from `checkoutSession.metadata.tenant` (same as successful payments)
- ✅ **Same customer portal endpoint**: Use the same endpoint/function as successful payments
- ✅ **Only difference**: Set `status: 'failed'` instead of `status: 'completed'`
- ✅ **Works for all tenants**: No per-tenant configuration needed

## Benefits

1. **Consistency**: Failed payments use the same flow as successful payments
2. **Scalability**: Works for all tenants automatically (Kraftverk, Tanja, etc.)
3. **Maintainability**: Single endpoint to maintain
4. **Customer visibility**: Failed payments appear in customer portal for tracking

---

**Last Updated:** 2025-01-27  
**Status:** Ready for Implementation











