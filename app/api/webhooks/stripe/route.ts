import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendPaymentToSourceDirect } from '@/lib/payments';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event | null = null;

  // Verify webhook signature (recommended for production)
  if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('STRIPE_SECRET_KEY not configured');
        return new NextResponse('Server configuration error', { status: 500 });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
        apiVersion: '2025-02-24.acacia' 
      });
      
      // Verify this is actually from Stripe
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log('Stripe webhook verified:', event.type);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new NextResponse('Webhook signature verification failed', { 
        status: 400 
      });
    }
  } else {
    console.warn('Webhook signature verification skipped - STRIPE_WEBHOOK_SECRET not set or signature missing');
    // Try to parse event without verification (for development)
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch (err) {
      console.error('Failed to parse webhook body:', err);
    }
  }

  // Handle payment failures - send to customer portal
  if (event && (event.type === 'payment_intent.payment_failed' || event.type === 'checkout.session.async_payment_failed')) {
    try {
      await handlePaymentFailure(event);
    } catch (error) {
      console.error('Error handling payment failure:', error);
      // Continue to forward webhook even if failure handling fails
    }
  }

  // Forward to Source Database customer portal
  const sourceUrl = process.env.SOURCE_DATABASE_URL || 'https://source-database.onrender.com';
  const tenantId = process.env.SOURCE_TENANT_ID || 'tanjaunlimited';

  try {
    const res = await fetch(`${sourceUrl}/webhooks/stripe-payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenantId
      },
      body
    });

    const responseText = await res.text();
    
    if (!res.ok) {
      console.error('Source webhook failed:', res.status, responseText);
    } else {
      console.log('Successfully forwarded webhook to Source');
    }

    return new NextResponse(responseText, { status: res.status });
  } catch (error) {
    console.error('Error forwarding webhook to Source:', error);
    return new NextResponse('Failed to forward webhook', { status: 500 });
  }
}

async function handlePaymentFailure(event: Stripe.Event) {
  console.log('💳 Processing payment failure event:', event.type);

  let paymentIntent: Stripe.PaymentIntent | null = null;
  let checkoutSession: Stripe.Checkout.Session | null = null;
  let customerEmail = '';
  let customerName = '';
  let amount = 0;
  let currency = 'SEK';
  let sessionId = '';
  let paymentIntentId = '';
  let customerId = '';
  let paymentMethod = '';
  let metadata: Record<string, unknown> = {};

  // Handle payment_intent.payment_failed
  if (event.type === 'payment_intent.payment_failed') {
    paymentIntent = event.data.object as Stripe.PaymentIntent;
    paymentIntentId = paymentIntent.id;
    amount = paymentIntent.amount;
    currency = paymentIntent.currency.toUpperCase();
    customerId = typeof paymentIntent.customer === 'string' ? paymentIntent.customer : paymentIntent.customer?.id || '';
    metadata = paymentIntent.metadata || {};

    // Try to get checkout session from metadata or retrieve it
    if (paymentIntent.metadata?.checkout_session_id) {
      sessionId = paymentIntent.metadata.checkout_session_id;
    } else if (paymentIntent.invoice) {
      // If there's an invoice, try to get session from there
      const invoice = typeof paymentIntent.invoice === 'string' 
        ? await getStripeClient().invoices.retrieve(paymentIntent.invoice)
        : paymentIntent.invoice;
      if (invoice?.subscription) {
        // This is a subscription, not a one-time payment
        return;
      }
    }

    // Get customer email if available
    if (customerId) {
      try {
        const customer = await getStripeClient().customers.retrieve(customerId);
        if (!customer.deleted && 'email' in customer) {
          customerEmail = customer.email || '';
          customerName = customer.name || '';
        }
      } catch (err) {
        console.warn('Could not retrieve customer:', err);
      }
    }

    // Get payment method details
    if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'string') {
      try {
        const pm = await getStripeClient().paymentMethods.retrieve(paymentIntent.payment_method);
        paymentMethod = pm.type;
      } catch (err) {
        console.warn('Could not retrieve payment method:', err);
      }
    }
  }

  // Handle checkout.session.async_payment_failed
  if (event.type === 'checkout.session.async_payment_failed') {
    checkoutSession = event.data.object as Stripe.Checkout.Session;
    sessionId = checkoutSession.id;
    customerEmail = checkoutSession.customer_email || '';
    customerName = checkoutSession.customer_details?.name || '';
    amount = checkoutSession.amount_total || 0;
    currency = (checkoutSession.currency || 'sek').toUpperCase();
    customerId = typeof checkoutSession.customer === 'string' 
      ? checkoutSession.customer 
      : checkoutSession.customer?.id || '';
    paymentIntentId = typeof checkoutSession.payment_intent === 'string'
      ? checkoutSession.payment_intent
      : checkoutSession.payment_intent?.id || '';
    metadata = checkoutSession.metadata || {};

    // Get payment method from payment intent if available
    if (paymentIntentId) {
      try {
        const pi = await getStripeClient().paymentIntents.retrieve(paymentIntentId);
        if (pi.payment_method && typeof pi.payment_method === 'string') {
          const pm = await getStripeClient().paymentMethods.retrieve(pi.payment_method);
          paymentMethod = pm.type;
        }
      } catch (err) {
        console.warn('Could not retrieve payment intent:', err);
      }
    }
  }

  // If we have a session ID but no checkout session object, try to retrieve it
  if (sessionId && !checkoutSession) {
    try {
      checkoutSession = await getStripeClient().checkout.sessions.retrieve(sessionId);
      if (!customerEmail && checkoutSession.customer_email) {
        customerEmail = checkoutSession.customer_email;
      }
      if (!customerName && checkoutSession.customer_details?.name) {
        customerName = checkoutSession.customer_details.name;
      }
      if (!amount && checkoutSession.amount_total) {
        amount = checkoutSession.amount_total;
      }
      if (checkoutSession.metadata) {
        metadata = { ...metadata, ...checkoutSession.metadata };
      }
    } catch (err) {
      console.warn('Could not retrieve checkout session:', err);
    }
  }

  // Extract product information from metadata
  const productIds: string[] = [];
  const productNames: string[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (key.startsWith('product_') && key.endsWith('_id') && typeof value === 'string') {
      productIds.push(value);
    }
  }

  // Send failed payment to customer portal
  if (sessionId && customerEmail) {
    console.log('📤 Sending failed payment to customer portal:', {
      sessionId,
      customerEmail,
      amount: amount / 100,
      currency,
      status: 'failed'
    });

    try {
      await sendPaymentToSourceDirect({
        sessionId,
        customerEmail,
        customerName: customerName || 'Unknown',
        amountSek: amount / 100,
        currency,
        status: 'failed',
        paymentMethod,
        paymentIntentId,
        customerId,
        productId: productIds[0], // Use first product if multiple
        metadata: {
          ...metadata,
          failure_reason: paymentIntent?.last_payment_error?.message || 'Payment failed',
          failure_code: paymentIntent?.last_payment_error?.code || 'unknown',
          event_type: event.type
        }
      });

      console.log('✅ Failed payment sent to customer portal');
    } catch (error) {
      console.error('❌ Failed to send payment failure to customer portal:', error);
      throw error;
    }
  } else {
    console.warn('⚠️ Cannot send payment failure - missing required data:', {
      hasSessionId: !!sessionId,
      hasCustomerEmail: !!customerEmail
    });
  }
}

function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, { 
    apiVersion: '2025-02-24.acacia' 
  });
}


