/**
 * Gift Card Utility Functions
 * Handles gift card verification and redemption via customer portal API
 */

import { sourceFetch, SOURCE_BASE, TENANT } from './source';

export type GiftCardRedemption = {
  _id: string;
  giftCardId: string;
  amountUsed: number; // Amount in cents
  remainingBalance: number; // Remaining balance in cents
  redemptionDate: string;
  orderId?: string;
};

export type GiftCardVerificationResult = {
  success: boolean;
  giftCard?: {
    _id: string;
    code: string;
    maskedCode: string;
    remainingAmount: number; // Amount in cents
    initialAmount: number; // Amount in cents
    tenantId: string;
    status: 'active' | 'expired' | 'exhausted';
    expiresAt?: string;
  };
  error?: string;
  redemption?: GiftCardRedemption;
};

/**
 * Verify and redeem a gift card
 * This function atomically verifies the gift card and creates a redemption record
 * 
 * @param giftCardCode - The gift card code to verify and redeem
 * @param amountToRedeem - Amount to redeem in cents
 * @param tenantId - Tenant ID (defaults to TENANT)
 * @param orderId - Optional order ID for tracking
 * @returns Verification result with redemption info
 */
export async function verifyAndRedeemGiftCard(
  giftCardCode: string,
  amountToRedeem: number,
  tenantId: string = TENANT,
  orderId?: string
): Promise<GiftCardVerificationResult> {
  try {
    // Call customer portal API to verify and redeem gift card
    // Endpoint: POST /api/gift-cards/verify-and-redeem
    const response = await sourceFetch('/api/gift-cards/verify-and-redeem', {
      method: 'POST',
      headers: {
        'X-Tenant': tenantId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: giftCardCode,
        amount: amountToRedeem, // Amount in cents
        tenantId,
        orderId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`❌ Gift card verification failed: ${response.status}`, errorData);
      
      // Handle specific error cases
      if (response.status === 404) {
        return {
          success: false,
          error: 'Gift card not found'
        };
      }
      
      if (response.status === 400) {
        return {
          success: false,
          error: errorData.error || 'Invalid gift card code or insufficient balance'
        };
      }
      
      if (response.status === 410) {
        return {
          success: false,
          error: 'Gift card has expired or been exhausted'
        };
      }
      
      return {
        success: false,
        error: errorData.error || `Gift card verification failed: ${response.status}`
      };
    }

    const data = await response.json();
    
    console.log(`✅ Gift card verified and redeemed:`, {
      code: data.giftCard?.maskedCode || 'masked',
      amountUsed: data.redemption?.amountUsed,
      remainingBalance: data.redemption?.remainingBalance
    });

    return {
      success: true,
      giftCard: data.giftCard,
      redemption: data.redemption
    };
  } catch (error) {
    console.error('❌ Error verifying gift card:', error);
    return {
      success: false,
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

