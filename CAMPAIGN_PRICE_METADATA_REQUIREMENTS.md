# Campaign Price Metadata Requirements for Customer Portal

## Problem

The tenant frontend cannot display campaign prices correctly because the Source Portal campaign price API response is missing required metadata fields.

## Current API Response

**Endpoint:** `GET /api/campaigns/price/{productId}?tenant={tenantId}&originalPriceId={priceId}`

**Current Response:**
```json
{
  "success": true,
  "hasCampaignPrice": true,
  "priceId": "price_1SmxOl1fkdOqt85xxqgkhC2o",
  "campaignId": "695e68a2d4de0f9731a5ea85",
  "campaignName": "Test",
  "originalPriceId": null
}
```

**Missing Fields:**
- ❌ `metadata` object
- ❌ `metadata.discount_percent` (discount percentage)
- ❌ `metadata.unit_amount` (campaign price amount in cents)
- ❌ `amount` (campaign price amount in cents)

## Required API Response

**Updated Response Should Include:**
```json
{
  "success": true,
  "hasCampaignPrice": true,
  "priceId": "price_1SmxOl1fkdOqt85xxqgkhC2o",
  "campaignId": "695e68a2d4de0f9731a5ea85",
  "campaignName": "Test",
  "originalPriceId": "price_1SmchQ1fkdOqt85xhAcJUQuN",
  "amount": 47500,  // Campaign price in cents (475 SEK)
  "metadata": {
    "discount_percent": 5,  // Discount percentage (5%)
    "unit_amount": 47500,   // Campaign price in cents
    "original_unit_amount": 50000,  // Original price in cents
    "campaign_name": "Test",
    "original_price_id": "price_1SmchQ1fkdOqt85xhAcJUQuN"
  }
}
```

## Why This Is Needed

1. **Stripe Connect Prices**: Campaign prices are created in Stripe Connect account, not accessible via platform account key
2. **Frontend Display**: Tenant frontend needs price amount and discount to display campaign badge correctly
3. **Price Calculation**: Without metadata, frontend can't calculate discounted price

## Implementation Options

### Option 1: Include Price Amount in Response (Recommended)

When creating campaign prices in Stripe Connect, store the price amount in the campaign record and return it in the API response:

```javascript
// In customer portal campaign price API
{
  amount: campaignPrice.unit_amount,  // From Stripe price object
  metadata: {
    discount_percent: campaign.discountValue,
    unit_amount: campaignPrice.unit_amount,
    original_unit_amount: originalPrice.unit_amount,
    campaign_name: campaign.name,
    original_price_id: originalPriceId
  }
}
```

### Option 2: Fetch from Stripe Connect in API

The customer portal API could fetch the price from Stripe Connect account and return the amount:

```javascript
// In customer portal campaign price API
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  stripeAccount: connectedAccountId  // Stripe Connect account
});

const campaignPrice = await stripe.prices.retrieve(priceId);
return {
  amount: campaignPrice.unit_amount,
  metadata: {
    discount_percent: calculateDiscount(originalPrice, campaignPrice),
    unit_amount: campaignPrice.unit_amount,
    original_unit_amount: originalPrice.unit_amount
  }
};
```

## Current Workaround

The tenant frontend currently:
1. ✅ Shows campaign badge with campaign name
2. ⚠️ Cannot display correct discounted price (shows original price)
3. ✅ Checkout will use correct campaign price (handled by backend)

## Next Steps

1. **Customer Portal**: Update `/api/campaigns/price/{productId}` endpoint to include:
   - `amount` field (campaign price in cents)
   - `metadata` object with `discount_percent` and price amounts

2. **Test**: Verify API response includes required fields

3. **Frontend**: Will automatically use metadata to display correct prices

## Testing

After customer portal updates, test with:

```bash
curl "https://source-database-809785351172.europe-north1.run.app/api/campaigns/price/prod_Tk6vhGPrHRjLg5?tenant=tanjaunlimited&originalPriceId=price_1SmchQ1fkdOqt85xhAcJUQuN"
```

**Expected Response:**
```json
{
  "success": true,
  "hasCampaignPrice": true,
  "priceId": "price_1SmxOl1fkdOqt85xxqgkhC2o",
  "amount": 47500,
  "metadata": {
    "discount_percent": 5,
    "unit_amount": 47500,
    "original_unit_amount": 50000
  }
}
```

