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
    // Endpoint: POST /api/gift-cards/verify
    // Response format: { success: true, data: { status, remainingAmount, initialAmount, expiresAt, currency } }
    const formattedCode = code.toUpperCase().trim();
    const response = await sourceFetch(`/api/gift-cards/verify`, {
      method: 'POST',
      headers: {
        'X-Tenant': TENANT_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: formattedCode
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error(`❌ Gift card verification failed: ${response.status}`, errorData);
      
      // Map error responses to frontend format
      const errorMessage = errorData.message || `Verification failed: ${response.status}`;
      
      return NextResponse.json(
        {
          valid: false,
          error: errorMessage
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Handle new response format: { success: true, data: { ... } }
    if (data.success && data.data) {
      const giftCardData = data.data;
      console.log(`✅ Gift card verified:`, {
        code: formattedCode.slice(0, 4) + '****' + formattedCode.slice(-4),
        status: giftCardData.status,
        remainingAmount: giftCardData.remainingAmount,
        currency: giftCardData.currency
      });

      // Convert remainingAmount (in cents) to balance (in cents)
      // Map response format to frontend format
      return NextResponse.json({
        valid: giftCardData.status === 'active',
        balance: giftCardData.remainingAmount, // Already in cents
        expiresAt: giftCardData.expiresAt || null,
        status: giftCardData.status,
        currency: giftCardData.currency
      });
    } else {
      // Fallback for old response format: { valid: true, balance: ... }
      console.log(`✅ Gift card verified (legacy format):`, {
        code: formattedCode.slice(0, 4) + '****' + formattedCode.slice(-4),
        valid: data.valid,
        balance: data.balance
      });

      return NextResponse.json({
        valid: data.valid || false,
        balance: data.balance,
        expiresAt: data.expiresAt || null
      });
    }
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

