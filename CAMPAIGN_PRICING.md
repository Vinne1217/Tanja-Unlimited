# Campaign Pricing Integration for Tanja Unlimited

## Overview

Tanja Unlimited uses the same campaign pricing system as Kraftverk Studio. This allows you to create dynamic pricing campaigns through the Source Customer Portal, and those prices are automatically used on the website.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│               Source Customer Portal                             │
│            (source-database.onrender.com)                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ 1. Webhook sends campaign price
                      │    POST /api/campaigns/webhook
                      │    { action: "price.created", priceUpdate: {...} }
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Tanja Website Backend                           │
│             (tanja-unlimited.onrender.com)                       │
├─────────────────────────────────────────────────────────────────┤
│  2. Webhook Handler (/api/campaigns/webhook/route.ts)           │
│     • Validates FRONTEND_API_KEY                                 │
│     • Stores campaign price in Source database (via API)         │
│     • Prevents duplicate processing (idempotency)                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ 3. Frontend fetches active campaigns
                      │    GET /api/campaigns/price?productId=sjs-001
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Tanja Website Frontend                          │
│                    (Product pages)                               │
├─────────────────────────────────────────────────────────────────┤
│  4. CampaignBadge Component                                      │
│     • Displays campaign badge ("20% rabatt")                     │
│     • Shows strikethrough original price                         │
│     • Shows new discounted price                                 │
│     • User clicks "Buy Now"                                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ 5. User initiates checkout
                      │    POST /api/checkout
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Checkout Handler                              │
│                  (/api/checkout/route.ts)                        │
├─────────────────────────────────────────────────────────────────┤
│  6. Campaign Price Lookup                                        │
│     • Queries Source API for campaign price                      │
│     • If found: uses campaign Stripe Price ID                    │
│     • If not found: uses default Stripe Price ID                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ 7. Creates Stripe Checkout Session
                      │    stripe.checkout.sessions.create({
                      │      line_items: [{ price: campaignPriceId }]
                      │    })
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Stripe Checkout                               │
│                  (checkout.stripe.com)                           │
├─────────────────────────────────────────────────────────────────┤
│  8. Customer completes payment                                   │
│     • Sees the campaign price                                    │
│     • Enters payment details                                     │
│     • Completes purchase                                         │
│     • Stripe sends webhook to Tanja                             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ 9. Stripe webhook: checkout.session.completed
                      │    POST /api/webhooks/stripe
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Payment Webhook Handler                         │
│               (/api/webhooks/stripe/route.ts)                    │
├─────────────────────────────────────────────────────────────────┤
│  10. Forward to Source Customer Portal                           │
│      • Verifies Stripe signature                                 │
│      • Forwards payment data to Source                           │
│      • Payment appears in customer portal                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## How to Create a Campaign

### Step 1: Create Campaign in Source Portal

1. Log into Source Customer Portal
2. Navigate to Campaigns section
3. Click "Create Campaign"
4. Fill in details:
   - **Campaign Name:** "Summer Sale 2025"
   - **Product:** Select the Tanja Jacket product
   - **Discount:** 20% or custom amount
   - **Start/End Dates:** Campaign period

### Step 2: Source Creates Stripe Price

Source will automatically:
1. Create a new Stripe Price with the discounted amount
2. Get the Price ID (e.g., `price_1XYZ123abc`)

### Step 3: Source Sends Webhook to Tanja

Source automatically sends:

```json
POST https://tanja-unlimited.onrender.com/api/campaigns/webhook
Authorization: Bearer <your-FRONTEND_API_KEY>

{
  "action": "price.created",
  "priceUpdate": {
    "stripePriceId": "price_1XYZ123abc",
    "originalProductId": "sjs-001",
    "campaignId": "campaign_summer_2025",
    "campaignName": "Summer Sale 2025",
    "metadata": {
      "tenant": "tanjaunlimited",
      "source": "customer_portal",
      "discount_percent": 20
    }
  },
  "eventId": "evt_unique_67890",
  "timestamp": "2025-06-01T00:00:00.000Z"
}
```

### Step 4: Tanja Website Stores Campaign Price

```
✅ Webhook received and validated
✅ Price stored in Source database via API
✅ Campaign activated: campaign_summer_2025
✅ Product pages automatically updated
```

### Step 5: Customer Sees Campaign on Website

When customer visits the product page:

**Before Campaign:**
```
Short Jacket Silk (SJS)
6,800 kr
[Buy Now button]
```

**After Campaign:**
```
[✨ 20% rabatt badge]
Short Jacket Silk (SJS)
5,440 kr  6,800 kr
(bold)    (strikethrough)
Spara 1,360 kr
[Buy Now button]
```

### Step 6: Checkout Automatically Uses Campaign Price

When customer clicks "Buy Now":
1. Checkout checks for active campaign
2. Finds campaign price: `price_1XYZ123abc`
3. Creates Stripe session with **5,440 kr** (not 6,800 kr)
4. Customer pays the discounted price
5. Payment appears in customer portal

---

## Product ID Mapping

These are the product IDs you can use in campaigns:

### The Tanja Jacket Collection

| Product ID | Product Name | Default Price |
|------------|--------------|---------------|
| `sjs-001` | Short Jacket Silk (SJS) | 6,800 kr |
| `ljsf-001` | Long Jacket Silk fitted (LJSf) | 11,800 kr |
| `sjcilw-001` | Short jacket Cotton Imperial Line White (SJCilW) | 4,800 kr |
| `njcilw-001` | Nehru Jacket Cotton imperial line White (NJCilW) | 3,900 kr |
| `ljckils-001` | Long Jacket Cotton knee imperial line Silver (LJCkilS) | 6,800 kr |
| `ljcfils-001` | Long Jacket Cotton fitted imperial line Silver (LJCfilS) | 8,200 kr |

### Other Products
- Add more product IDs as you integrate additional Stripe products
- Product ID should match the `id` field in your product catalog

---

## API Endpoints

### 1. Campaign Webhook (Receive Price Updates)

**POST** `/api/campaigns/webhook`

**Authentication:** `Authorization: Bearer <FRONTEND_API_KEY>`

**Supported Actions:**

| Action | Description | Example |
|--------|-------------|---------|
| `ping` | Health check | Returns "Pong" |
| `price.created` | New campaign price | Stores new campaign price |
| `price.updated` | Update campaign price | Updates existing campaign |
| `price.deleted` | Delete campaign price | Expires campaign |

**Request Example:**
```json
{
  "action": "price.created",
  "priceUpdate": {
    "stripePriceId": "price_1ABC123xyz",
    "originalProductId": "sjs-001",
    "campaignId": "campaign_summer_2025",
    "campaignName": "Summer Sale 2025",
    "metadata": {
      "tenant": "tanjaunlimited",
      "discount_percent": 20
    }
  },
  "eventId": "evt_unique_123",
  "timestamp": "2025-06-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Price stored successfully",
  "priceId": "price_1ABC123xyz",
  "productId": "sjs-001"
}
```

### 2. Get Active Campaigns

**GET** `/api/campaigns/webhook`

**Response:**
```json
{
  "success": true,
  "campaigns": [
    {
      "tenantId": "tanjaunlimited",
      "productId": "sjs-001",
      "campaignId": "campaign_summer_2025",
      "stripePriceId": "price_1ABC123xyz",
      "status": "active",
      "validFrom": "2025-06-01T00:00:00.000Z",
      "metadata": {
        "campaign_name": "Summer Sale 2025"
      }
    }
  ],
  "count": 1
}
```

### 3. Get Campaign Price for Product

**GET** `/api/campaigns/price?productId=sjs-001`

**Response:**
```json
{
  "hasCampaignPrice": true,
  "stripePriceId": "price_1ABC123xyz",
  "campaignId": "campaign_summer_2025",
  "campaignName": "Summer Sale 2025",
  "metadata": {
    "discount_percent": 20
  },
  "productId": "sjs-001"
}
```

---

## Testing

### Test 1: Health Check

```bash
curl -X POST https://tanja-unlimited.onrender.com/api/campaigns/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_FRONTEND_API_KEY>" \
  -d '{"action": "ping"}'
```

**Expected:** `{"success": true, "message": "Pong"}`

### Test 2: Create Test Campaign

```bash
curl -X POST https://tanja-unlimited.onrender.com/api/campaigns/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_FRONTEND_API_KEY>" \
  -d '{
    "action": "price.created",
    "priceUpdate": {
      "stripePriceId": "price_TEST123",
      "originalProductId": "sjs-001",
      "campaignId": "test_campaign",
      "campaignName": "Test 20% Off"
    },
    "eventId": "test_evt_123"
  }'
```

### Test 3: Verify on Frontend

1. Visit: `https://tanja-unlimited.onrender.com/webshop/tanja-jacket/sjs-001`
2. Should see campaign badge with discount
3. Should see strikethrough original price
4. Should see discounted price

### Test 4: Test Checkout

1. Click "Buy Now" on a product with campaign
2. Check Render logs for: `"🎯 Using campaign price: price_TEST123"`
3. Stripe checkout should show the discounted price
4. Complete test payment
5. Verify payment appears in customer portal

---

## Environment Variables Required

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxx (or sk_live_xxxxx)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Source Database
SOURCE_DATABASE_URL=https://source-database.onrender.com
SOURCE_TENANT_ID=tanjaunlimited

# Campaign Webhook Authentication
FRONTEND_API_KEY=<your-generated-secure-key>

# Optional
NEXT_PUBLIC_BASE_URL=https://tanja-unlimited.onrender.com
```

---

## Stripe Webhook Configuration

### For Payment Tracking

**Create in Stripe Dashboard → Webhooks:**

```
Endpoint URL: https://tanja-unlimited.onrender.com/api/webhooks/stripe

Events to listen for:
✅ checkout.session.completed
✅ payment_intent.succeeded
```

**After creating:**
1. Copy the webhook signing secret (`whsec_...`)
2. Add to Render as `STRIPE_WEBHOOK_SECRET`

---

## How Payments Flow to Customer Portal

1. **Customer completes purchase** on Tanja website
2. **Stripe processes payment** and charges customer
3. **Stripe sends webhook** to: `https://tanja-unlimited.onrender.com/api/webhooks/stripe`
4. **Tanja webhook handler**:
   - Verifies Stripe signature
   - Forwards payment data to Source
5. **Source receives payment** at: `/webhooks/stripe-payments`
6. **Payment appears in customer portal** ✅

---

## Troubleshooting

### Campaign Not Showing on Product Page

✅ Check if webhook was received (Render logs)  
✅ Verify `stripePriceId` exists in Stripe  
✅ Ensure `originalProductId` matches product ID  
✅ Check Source API is accessible  

### Checkout Using Wrong Price

✅ Check Render logs for "Using campaign price" message  
✅ Verify campaign is active in Source  
✅ Test `/api/campaigns/price?productId=xxx` endpoint  

### Payments Not in Customer Portal

✅ Verify Stripe webhook is configured correctly  
✅ Check webhook signing secret is set in Render  
✅ Check Stripe webhook delivery logs (should show 200 responses)  
✅ Verify `SOURCE_DATABASE_URL` and `SOURCE_TENANT_ID` are correct  

### Webhook Returns 401

✅ Verify `FRONTEND_API_KEY` matches between Tanja Render and Source portal  
✅ Check Authorization header format: `Bearer {key}`  

---

## Security Features

✅ **FRONTEND_API_KEY Validation** - All campaign webhooks authenticated  
✅ **Stripe Signature Verification** - Payment webhooks verified  
✅ **Idempotency** - Duplicate events automatically prevented  
✅ **Tenant Isolation** - All data tagged with tenant ID  
✅ **HTTPS Only** - All webhook endpoints require HTTPS  

---

## Campaign Workflow Example

### Scenario: 15% discount on all Tanja Jackets for Black Friday

**Week 1 - Create Campaign:**
1. Create campaign in Source portal
2. Set discount: 15% off
3. Select products: All Tanja Jackets
4. Set dates: Nov 23-26, 2025
5. Source creates 6 new Stripe prices (one per jacket)
6. Source sends 6 webhooks to Tanja website
7. All 6 campaign prices stored

**Week 2 - Campaign Active:**
1. Customers visit website
2. All jacket pages show "15% rabatt" badge
3. Prices displayed with strikethrough
4. Customers purchase at discounted prices
5. Payments flow to customer portal

**Week 3 - Campaign Ends:**
1. Source automatically expires campaign (cron job)
2. Source sends `price.deleted` webhooks
3. Tanja website removes campaign badges
4. Prices return to normal

---

## Frontend Integration

### CampaignBadge Component

```typescript
import CampaignBadge from '@/components/CampaignBadge';

<CampaignBadge 
  productId="sjs-001"
  defaultPrice={6800}
  currency="SEK"
  onCampaignFound={(price) => console.log('Campaign price:', price)}
/>
```

**What it does:**
- Fetches campaign price from API
- Displays campaign badge if active
- Shows strikethrough original price
- Shows campaign price in bold
- Calculates and displays savings

---

## Summary

### What's Implemented:

✅ **Webhook Endpoint** - Receives campaign prices from Source  
✅ **Campaign Price Service** - Stores and retrieves prices via Source API  
✅ **Checkout Integration** - Automatically uses campaign prices  
✅ **Frontend Components** - Displays campaign badges and prices  
✅ **Payment Webhook** - Forwards payments to customer portal  
✅ **Security** - API key validation and Stripe signature verification  
✅ **Idempotency** - Prevents duplicate processing  
✅ **Error Handling** - Comprehensive logging for debugging  

### What You Need to Do:

1. ✅ **Configure Stripe Webhook** for payment events
2. ✅ **Add STRIPE_WEBHOOK_SECRET** to Render
3. ✅ **Share FRONTEND_API_KEY** with Source team
4. ✅ **Test the integration** with a sample campaign
5. 🎉 **Campaigns will work automatically!**

---

## Status

**Integration Status:** ✅ Complete and Production-Ready  
**System:** Same as Kraftverk Studio  
**Last Updated:** November 5, 2025  
**Version:** 1.0  

---

Questions? Check the Render logs for detailed debugging information. All webhook events are logged with emoji indicators (🎯, ✅, ❌, 📥) for easy troubleshooting.

