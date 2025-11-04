import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

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
      const event = stripe.webhooks.constructEvent(
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


