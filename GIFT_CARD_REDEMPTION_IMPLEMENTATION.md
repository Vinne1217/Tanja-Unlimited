# Gift Card Redemption in Checkout Implementation

## Overview

This implementation enables customers to use gift cards during checkout to reduce or eliminate the Stripe charge amount. Gift cards are verified and redeemed atomically before creating the Stripe checkout session.

## Implementation Details

### 1. Request Body

**New Field:**
```typescript
{
  items: CartItem[];
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  giftCardCode?: string; // Optional gift card code
}
```

**Validation:**
- Only one gift card code allowed per checkout
- Code must be a string
- Combination with promotion codes is blocked (promotion codes disabled when gift card is used)

### 2. Gift Card Verification & Redemption

**Function:** `verifyAndRedeemGiftCard()` in `lib/gift-cards.ts`

**Process:**
1. Calls customer portal API: `POST /api/gift-cards/verify-and-redeem`
2. Verifies gift card code, balance, and validity
3. Atomically creates redemption record
4. Returns redemption details including amount used

**Error Handling:**
- 404: Gift card not found
- 400: Invalid code or insufficient balance
- 410: Gift card expired or exhausted
- Other errors: Generic error message

### 3. Payment Calculation Flow

```typescript
// 1. Calculate total from line items
totalAmountCents = sum of (price.unit_amount * quantity) for all line items

// 2. Verify and redeem gift card (if provided)
giftCardRedemption = await verifyAndRedeemGiftCard(giftCardCode, totalAmountCents)

// 3. Calculate adjusted Stripe charge
giftCardAmountUsed = giftCardRedemption.amountUsed
stripeChargeAmount = max(0, totalAmountCents - giftCardAmountUsed)
```

### 4. Stripe Session Creation

**When `stripeChargeAmount > 0`:**
- Creates normal Stripe checkout session
- Stripe charges `stripeChargeAmount` (via line items)
- Gift card covers the difference

**When `stripeChargeAmount <= 0`:**
- Still creates Stripe checkout session (per requirements)
- Stripe may handle as free checkout
- Note: Stripe Checkout has minimum charge requirements, so this may need adjustment

### 5. Metadata Structure

**When gift card is used:**
```typescript
{
  tenant: "tanjaunlimited",
  source: "tanja_website",
  website: "tanja-unlimited.onrender.com",
  giftCardCode: "1234****5678", // Masked code
  giftCardRedemptionId: "redemption_123",
  giftCardAmountUsed: "50000", // Amount in cents
  originalTotal: "100000", // Original total in cents
  stripeChargeAmount: "50000", // Amount Stripe will charge in cents
  // ... campaign metadata ...
}
```

### 6. Edge Cases Handled

✅ **Insufficient Balance**
- Returns 400 error: "Gift card has insufficient balance"
- Checkout blocked

✅ **Expired or Exhausted Card**
- Returns 400 error: "Gift card has expired or been exhausted"
- Checkout blocked

✅ **Invalid Code**
- Returns 400 error: "Gift card not found" or "Invalid gift card code"
- Checkout blocked

✅ **Multiple Gift Cards**
- Only one code allowed per checkout (validated)
- Returns 400 if multiple codes attempted

✅ **Combination with Promotions**
- Promotion codes disabled when gift card is used (`allow_promotion_codes: false`)
- Prevents double discounting

### 7. Idempotency

**Note:** Idempotency key update (`idempotencyKey = ${paymentIntentId}:${giftCardId}`) is handled in the webhook handler (customer portal), not in the checkout route.

The checkout route provides the necessary metadata:
- `giftCardRedemptionId`: Used for idempotency
- `giftCardCode`: For reference
- `giftCardAmountUsed`: For verification

### 8. Files Modified

1. **`lib/gift-cards.ts`** (NEW)
   - `verifyAndRedeemGiftCard()` function
   - `maskGiftCardCode()` utility
   - Types for gift card verification and redemption

2. **`app/api/checkout/route.ts`**
   - Added `giftCardCode` to request body
   - Added gift card verification before Stripe session creation
   - Added total amount calculation
   - Added adjusted Stripe charge calculation
   - Added gift card metadata to session
   - Disabled promotion codes when gift card is used

## API Endpoint Requirements

The customer portal must provide:

**Endpoint:** `POST /api/gift-cards/verify-and-redeem`

**Request:**
```json
{
  "code": "GIFT1234567890",
  "amount": 100000, // Amount to redeem in cents
  "tenantId": "tanjaunlimited",
  "orderId": "optional-order-id"
}
```

**Response (Success):**
```json
{
  "success": true,
  "giftCard": {
    "_id": "giftcard_123",
    "code": "GIFT1234567890",
    "maskedCode": "GIFT****7890",
    "remainingAmount": 50000,
    "initialAmount": 100000,
    "tenantId": "tanjaunlimited",
    "status": "active",
    "expiresAt": "2025-12-31T23:59:59Z"
  },
  "redemption": {
    "_id": "redemption_456",
    "giftCardId": "giftcard_123",
    "amountUsed": 50000,
    "remainingBalance": 50000,
    "redemptionDate": "2025-01-15T10:30:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Insufficient balance" // or "Gift card not found", "Expired", etc.
}
```

## Test Scenarios

### ✅ Partial Redemption
- Order total: 100 SEK
- Gift card balance: 50 SEK
- Result: Gift card covers 50 SEK, Stripe charges 50 SEK

### ✅ Full Redemption
- Order total: 50 SEK
- Gift card balance: 50 SEK
- Result: Gift card covers full amount, Stripe charge = 0 SEK
- Note: Stripe session still created (may need special handling)

### ✅ Invalid Code
- Gift card code: "INVALID123"
- Result: 400 error, checkout blocked

### ✅ Already Redeemed/Exhausted
- Gift card balance: 0 SEK
- Result: 400 error "Insufficient balance", checkout blocked

### ✅ Expired Card
- Gift card expired: true
- Result: 400 error "Gift card has expired", checkout blocked

## Security Considerations

✅ **Server-Side Validation**
- Gift card verification happens server-side
- Code never exposed in logs (masked)

✅ **Atomic Redemption**
- Redemption created atomically during verification
- Prevents double-spending

✅ **Tenant Isolation**
- Gift card verified against correct tenant
- Cross-tenant redemption blocked

✅ **Amount Validation**
- Amount calculated server-side from Stripe prices
- Client cannot manipulate amounts

## Notes

- **Locked Balance:** Gift card balance is locked when redemption is created. If checkout is cancelled, the balance remains locked until session expires (acceptable for v1 per requirements).

- **Zero Charge Handling:** When `stripeChargeAmount <= 0`, Stripe Checkout may require special handling. Consider creating a minimal charge (e.g., 1 SEK) or handling free checkouts differently.

- **Idempotency:** The webhook handler should use `idempotencyKey = ${paymentIntentId}:${giftCardId}` to prevent duplicate redemptions on retries.

