/**
 * Gift Card Verification API (Read-Only)
 * Proxies verification request to customer portal
 * NO redemption logic - only verifies validity and balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { sourceFetch, SOURCE_BASE, TENANT } from '@/lib/source';

const TENANT_ID = process.env.SOURCE_TENANT_ID ?? TENANT;

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json() as { code: string };

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Gift card code is required' },
        { status: 400 }
      );
    }

    // Call customer portal verify endpoint (read-only)
    // Endpoint: POST /api/storefront/{tenant}/giftcards/verify
    const response = await sourceFetch(`/api/storefront/${TENANT_ID}/giftcards/verify`, {
      method: 'POST',
      headers: {
        'X-Tenant': TENANT_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: code.trim()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`❌ Gift card verification failed: ${response.status}`, errorData);
      
      // Return error response
      return NextResponse.json(
        {
          valid: false,
          error: errorData.error || `Verification failed: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log(`✅ Gift card verified:`, {
      code: code.slice(0, 4) + '****' + code.slice(-4),
      valid: data.valid,
      balance: data.balance
    });

    return NextResponse.json({
      valid: data.valid || false,
      balance: data.balance,
      expiresAt: data.expiresAt
    });
  } catch (error) {
    console.error('❌ Error verifying gift card:', error);
    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

