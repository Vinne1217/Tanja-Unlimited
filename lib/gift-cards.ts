/**
 * Gift Card Utility Functions
 * READ-ONLY verification only - no redemption logic
 * Redemption happens server-side in customer portal checkout flow
 */

import { sourceFetch, SOURCE_BASE, TENANT } from './source';

export type GiftCardVerificationResult = {
  valid: boolean;
  balance?: number; // Amount in cents
  expiresAt?: string; // ISO date string
  error?: string;
};

/**
 * Verify a gift card (read-only, no mutation)
 * This function only checks validity and balance - does NOT redeem
 * 
 * @param giftCardCode - The gift card code to verify
 * @param tenantId - Tenant ID (defaults to TENANT)
 * @returns Verification result with balance info (no redemption)
 */
export async function verifyGiftCard(
  giftCardCode: string,
  tenantId: string = TENANT
): Promise<GiftCardVerificationResult> {
  try {
    // Call customer portal API to verify gift card (read-only)
    // Endpoint: POST /api/storefront/{tenant}/giftcards/verify
    const response = await sourceFetch(`/api/storefront/${tenantId}/giftcards/verify`, {
      method: 'POST',
      headers: {
        'X-Tenant': tenantId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: giftCardCode
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`❌ Gift card verification failed: ${response.status}`, errorData);
      
      // Handle specific error cases
      if (response.status === 404) {
        return {
          valid: false,
          error: 'Gift card not found'
        };
      }
      
      if (response.status === 400) {
        return {
          valid: false,
          error: errorData.error || 'Invalid gift card code'
        };
      }
      
      if (response.status === 410) {
        return {
          valid: false,
          error: 'Gift card has expired or been exhausted'
        };
      }
      
      return {
        valid: false,
        error: errorData.error || `Gift card verification failed: ${response.status}`
      };
    }

    const data = await response.json();
    
    console.log(`✅ Gift card verified:`, {
      code: maskGiftCardCode(giftCardCode),
      valid: data.valid,
      balance: data.balance
    });

    return {
      valid: data.valid || false,
      balance: data.balance,
      expiresAt: data.expiresAt
    };
  } catch (error) {
    console.error('❌ Error verifying gift card:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Mask a gift card code for display
 * Shows first 4 and last 4 characters, masks the middle
 */
export function maskGiftCardCode(code: string): string {
  if (code.length <= 8) {
    return '****' + code.slice(-4);
  }
  return code.slice(0, 4) + '****' + code.slice(-4);
}
