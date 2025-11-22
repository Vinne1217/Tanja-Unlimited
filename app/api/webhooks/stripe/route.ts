import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

/**
 * Stripe Webhook Handler
 * 
 * This endpoint receives webhook events from Stripe and:
 * 1. Verifies the webhook signature (security)
 * 2. Forwards ALL webhooks to Source database for processing
 *    - Successful payments: forwarded to /webhooks/stripe-payments
 *    - Failed payments: forwarded to /webhooks/stripe-payments (same endpoint)
 * 
 * Source Database handles all payment events (success, failure, etc.) and routes them
 * appropriately based on the tenant metadata in the checkout session.
 * 
 * Note: The 402 error you see in the browser console is EXPECTED when a payment fails.
 * Stripe will still send a webhook event (payment_intent.payment_failed) which gets
 * forwarded to Source Database for processing.
 * 
 * To verify webhooks are working:
 * - Check server logs for "📨 Webhook event received" messages
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

  // Forward ALL webhooks (success, failure, etc.) to Source Database customer portal
  // Source Database will handle payment failures through the same endpoint as successful payments
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


