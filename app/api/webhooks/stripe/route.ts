import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendPaymentToSourceDirect } from '@/lib/payments';

export const runtime = 'nodejs';

/**
 * Stripe Webhook Handler
 * 
 * This endpoint receives webhook events from Stripe and:
 * 1. Verifies the webhook signature (security)
 * 2. Processes payment failures and sends them to customer portal
 * 3. Forwards ALL webhooks to Source database for processing
 * 
 * Note: The 402 error you see in the browser console is EXPECTED when a payment fails.
 * Stripe will still send a webhook event (payment_intent.payment_failed) which gets
 * processed here and sent to the customer portal.
 * 
 * To verify webhooks are working:
 * - Check server logs for "📨 Webhook event received" messages
 * - Check "🔴 Payment failure detected - processing..." for failed payments
 * - Check "✅ Failed payment sent to customer portal" messages
 * - Check "✅ Successfully forwarded webhook to Source" messages
 * - Check Stripe Dashboard → Webhooks → Recent events
 */
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

      console.log('✅ Stripe webhook verified:', event.type, {
        eventId: event.id,
        created: new Date(event.created * 1000).toISOString()
      });
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

  // Log all webhook events for debugging
  if (event) {
    const objectId = event.data?.object && 'id' in event.data.object 
      ? event.data.object.id 
      : 'unknown';
    console.log(`📨 Webhook event received: ${event.type}`, {
      eventId: event.id,
      livemode: event.livemode,
      objectId
    });
  }

  // Handle payment failures - send to customer portal
  if (event && (event.type === 'payment_intent.payment_failed' || event.type === 'checkout.session.async_payment_failed')) {
    try {
      console.log(`🔴 Payment failure detected - processing...`);
      
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('STRIPE_SECRET_KEY not configured');
      } else {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
          apiVersion: '2025-02-24.acacia' 
        });

        let checkoutSession: Stripe.Checkout.Session | null = null;
        let paymentIntent: Stripe.PaymentIntent | null = null;

        // Handle payment_intent.payment_failed event
        if (event.type === 'payment_intent.payment_failed') {
          paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`💳 Processing payment failure event for payment intent: ${paymentIntent.id}`);

          // Retrieve the payment intent to get full details
          try {
            const fullPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id, {
              expand: ['invoice', 'customer']
            });

            // Try to find the checkout session associated with this payment intent
            // Payment intents from checkout sessions have metadata with session ID
            if (fullPaymentIntent.metadata?.checkout_session_id) {
              checkoutSession = await stripe.checkout.sessions.retrieve(
                fullPaymentIntent.metadata.checkout_session_id
              );
            } else {
              // Search for checkout sessions with this payment intent
              // Note: Stripe API doesn't have a direct search, so we'll use the payment intent's metadata
              // or retrieve the session from the payment intent's latest_charge
              if (fullPaymentIntent.latest_charge) {
                const charge = await stripe.charges.retrieve(
                  typeof fullPaymentIntent.latest_charge === 'string' 
                    ? fullPaymentIntent.latest_charge 
                    : fullPaymentIntent.latest_charge.id
                );
                
                // Check if charge has payment_intent metadata with session ID
                if (charge.metadata?.checkout_session_id) {
                  checkoutSession = await stripe.checkout.sessions.retrieve(
                    charge.metadata.checkout_session_id
                  );
                }
              }
            }
          } catch (err) {
            console.error('Error retrieving payment intent or session:', err);
          }
        }
        // Handle checkout.session.async_payment_failed event
        else if (event.type === 'checkout.session.async_payment_failed') {
          checkoutSession = event.data.object as Stripe.Checkout.Session;
          console.log(`💳 Processing async payment failure for session: ${checkoutSession.id}`);
          
          // Retrieve payment intent from the session
          if (checkoutSession.payment_intent) {
            const paymentIntentId = typeof checkoutSession.payment_intent === 'string'
              ? checkoutSession.payment_intent
              : checkoutSession.payment_intent.id;
            
            try {
              paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            } catch (err) {
              console.error('Error retrieving payment intent:', err);
            }
          }
        }

        // If we have a checkout session, send the failed payment to customer portal
        if (checkoutSession) {
          const sessionMetadata = checkoutSession.metadata || {};
          const tenant = sessionMetadata.tenant || process.env.SOURCE_TENANT_ID || 'tanjaunlimited';
          
          // Only process if this is for our tenant
          if (tenant === 'tanjaunlimited' || tenant === process.env.SOURCE_TENANT_ID) {
            console.log(`📤 Sending failed payment to customer portal for session: ${checkoutSession.id}`);
            
            // Extract customer information
            let customerEmail = '';
            let customerName = '';
            let customerId = '';

            if (checkoutSession.customer_email) {
              customerEmail = checkoutSession.customer_email;
            } else if (checkoutSession.customer) {
              const customerIdStr = typeof checkoutSession.customer === 'string'
                ? checkoutSession.customer
                : checkoutSession.customer.id;
              customerId = customerIdStr;
              
              try {
                const customer = await stripe.customers.retrieve(customerIdStr);
                if (typeof customer !== 'string' && !customer.deleted) {
                  customerEmail = customer.email || '';
                  customerName = customer.name || '';
                }
              } catch (err) {
                console.warn('Could not retrieve customer:', err);
              }
            }

            // Extract amount and currency
            const amountTotal = checkoutSession.amount_total || 0;
            const currency = checkoutSession.currency?.toUpperCase() || 'SEK';
            const amountSek = currency === 'SEK' ? amountTotal / 100 : amountTotal / 100; // Convert from cents

            // Extract payment intent ID
            const paymentIntentId = paymentIntent?.id || 
              (typeof checkoutSession.payment_intent === 'string' 
                ? checkoutSession.payment_intent 
                : checkoutSession.payment_intent?.id) || 
              '';

            // Extract product information from line items or metadata
            let productName = '';
            let productId = '';
            let priceId = '';
            let quantity = 1;

            if (checkoutSession.line_items) {
              try {
                const lineItems = await stripe.checkout.sessions.listLineItems(checkoutSession.id, { limit: 1 });
                if (lineItems.data.length > 0) {
                  const item = lineItems.data[0];
                  productName = item.description || '';
                  priceId = item.price?.id || '';
                  quantity = item.quantity || 1;
                  
                  // Try to get product ID from price
                  if (item.price?.product) {
                    const productIdStr = typeof item.price.product === 'string'
                      ? item.price.product
                      : item.price.product.id;
                    productId = productIdStr;
                  }
                }
              } catch (err) {
                console.warn('Could not retrieve line items:', err);
              }
            }

            // Send failed payment to customer portal
            try {
              await sendPaymentToSourceDirect({
                sessionId: checkoutSession.id,
                customerEmail: customerEmail || 'unknown@example.com',
                customerName: customerName || 'Unknown Customer',
                amountSek,
                currency,
                status: 'failed',
                paymentIntentId,
                customerId,
                productName,
                productId,
                priceId,
                quantity,
                metadata: sessionMetadata
              });

              console.log(`✅ Failed payment sent to customer portal: ${checkoutSession.id}`);
            } catch (err) {
              console.error('❌ Error sending failed payment to customer portal:', err);
              // Don't fail the webhook - still forward to Source
            }
          } else {
            console.log(`⏭️ Skipping payment failure - not for tanjaunlimited tenant (tenant: ${tenant})`);
          }
        } else {
          console.warn('⚠️ Could not find checkout session for payment failure event');
        }
      }
    } catch (err) {
      console.error('❌ Error processing payment failure:', err);
      // Don't fail the webhook - still forward to Source
    }
  }

  // Forward ALL webhooks (success, failure, etc.) to Source Database customer portal
  // Source Database will handle payment events and route them appropriately
  // Get Source Database URL - mandatory, no fallbacks
  const sourceUrl = process.env.SOURCE_DATABASE_URL;
  if (!sourceUrl) {
    console.error('[Stripe Webhook] ERROR: SOURCE_DATABASE_URL environment variable is required');
    return NextResponse.json(
      { error: 'SOURCE_DATABASE_URL missing' },
      { status: 500 }
    );
  }
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
      console.error(`❌ Source webhook failed: ${res.status}`, {
        statusText: res.statusText,
        responsePreview: responseText.substring(0, 200)
      });
    } else {
      console.log(`✅ Successfully forwarded webhook to Source: ${event?.type || 'unknown'}`);
    }

    return new NextResponse(responseText, { status: res.status });
  } catch (error) {
    console.error('Error forwarding webhook to Source:', error);
    return new NextResponse('Failed to forward webhook', { status: 500 });
  }
}


