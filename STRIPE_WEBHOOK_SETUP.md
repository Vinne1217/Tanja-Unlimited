# Stripe Webhook Setup for Tanja Unlimited

## Simplified Approach - Direct to Source Database

Since Tanja and Kraftverk share the same Stripe account, we use a **single Stripe webhook** that points directly to the Source database. This is simpler and more efficient.

---

## 🎯 **Architecture**

```
Customer purchases on Tanja website
         ↓
Stripe processes payment
         ↓
Stripe sends webhook → https://source-database.onrender.com/webhooks/stripe-payments
         ↓
Source identifies tenant from session metadata: { tenant: "tanjaunlimited" }
         ↓
Payment appears in Tanja's customer portal ✅
```

---

## 📋 **Stripe Webhook Configuration**

You likely already have this webhook configured (check your Stripe dashboard). If not, create it:

### **In Stripe Dashboard → Developers → Webhooks:**

**Create or verify this webhook exists:**

```
Endpoint URL: https://source-database.onrender.com/webhooks/stripe-payments

Events to listen for:
✅ checkout.session.completed
✅ payment_intent.succeeded
✅ payment_intent.payment_failed (optional, for error tracking)

Description: "Shared webhook for Kraftverk and Tanja payments"
```

---

## 🔐 **Webhook Secret**

### **You CAN reuse the same secret as Kraftverk!**

Since both Kraftverk and Tanja payments go to the **same URL** (`source-database.onrender.com`), they share the same webhook secret.

**In Source's Render environment:**
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

This is already configured for Kraftverk, so **no additional webhook secret needed** for Tanja! ✅

---

## ✅ **What's Already Configured in Tanja's Code**

### **Checkout Metadata (Ensures Proper Tenant Identification)**

Every Stripe checkout session created by Tanja includes:

```typescript
metadata: {
  tenant: 'tanjaunlimited',              // ← Identifies this as Tanja payment
  source: 'tanja_website',               // ← Where the order came from
  website: 'tanja-unlimited.onrender.com', // ← Website domain
  product_0_id: 'sjs-001',               // ← Product purchased
  product_0_campaign: 'campaign_123'     // ← Campaign used (if applicable)
}
```

**This metadata allows Source to:**
- ✅ Identify the tenant (tanjaunlimited)
- ✅ Route payment to correct customer portal
- ✅ Track which product was purchased
- ✅ Track if a campaign was used
- ✅ Attribute revenue correctly

---

## 🧪 **Testing the Integration**

### **Step 1: Make a Test Purchase**

1. Go to https://tanja-unlimited-test.onrender.com
2. Navigate to a product with Stripe configured (e.g., Tanja Jacket)
3. Click "Buy Now"
4. Complete checkout with test card: `4242 4242 4242 4242`

### **Step 2: Verify in Stripe**

1. Go to **Stripe Dashboard → Payments**
2. Find the recent payment
3. Click on it to see details
4. **Check metadata section** - Should show:
   ```
   tenant: tanjaunlimited
   source: tanja_website
   website: tanja-unlimited.onrender.com
   ```

### **Step 3: Check Webhook Delivery**

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click on the `source-database.onrender.com` webhook
3. View recent events
4. Should see `checkout.session.completed` with **200 OK** response

### **Step 4: Check Customer Portal**

1. Log into Source Customer Portal
2. Navigate to Tanja's orders/payments section
3. **Payment should appear!** ✅

---

## 🐛 **Troubleshooting**

### **Payment in Stripe but Not in Customer Portal**

**Check 1: Webhook Delivery**
- Stripe Dashboard → Webhooks → source-database endpoint
- Look at recent events - should show 200 OK responses
- If 4xx/5xx errors, there's an issue with Source's webhook handler

**Check 2: Session Metadata**
- Stripe Dashboard → Payments → Click the payment
- Scroll to "Metadata" section
- Verify `tenant: tanjaunlimited` is present
- If missing, checkout code isn't setting it properly

**Check 3: Render Logs (Tanja)**
- Render Dashboard → Tanja service → Logs
- Look for: `"📦 Creating checkout session with metadata"`
- Verify tenant ID is correct

**Check 4: Source Database Logs**
- Check Source Render logs
- Look for webhook receipt
- Verify tenant routing is working

### **Webhook Shows Errors in Stripe**

**401 Unauthorized:**
- Source's `STRIPE_WEBHOOK_SECRET` might be wrong
- Contact Source team to verify webhook secret

**404 Not Found:**
- Webhook URL might be wrong
- Should be: `https://source-database.onrender.com/webhooks/stripe-payments`

**500 Server Error:**
- Issue with Source's webhook handler
- Contact Source team with webhook event ID

---

## 📊 **Environment Variables**

### **Tanja's Render Environment:**

```env
# Stripe (shared with Kraftverk in sandbox)
STRIPE_SECRET_KEY=sk_test_51xxxxx

# Source Database
SOURCE_DATABASE_URL=https://source-database.onrender.com
SOURCE_TENANT_ID=tanjaunlimited

# Campaign Integration
FRONTEND_API_KEY=<your-generated-key>

# No STRIPE_WEBHOOK_SECRET needed for Tanja!
# (Source handles webhook verification)
```

### **Source's Render Environment (Already configured):**

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  ← Shared for all tenants
```

---

## 🎯 **Key Differences from Individual Webhook Approach**

| Aspect | Individual Webhooks | Shared Webhook (Current) |
|--------|-------------------|------------------------|
| **Webhook URL** | Each website has own | Single URL for all tenants |
| **Webhook Secret** | Each URL has own secret | One secret, reused |
| **Configuration** | N webhooks for N tenants | 1 webhook for all |
| **Tenant ID** | From URL or header | From session metadata |
| **Maintenance** | Update each webhook | Update once |
| **Simplicity** | More complex | ✅ Simpler |

---

## ✅ **Summary**

**What's Working:**
- ✅ Tanja's checkout includes `tenant: 'tanjaunlimited'` metadata
- ✅ Stripe webhook points to Source database (shared with Kraftverk)
- ✅ Same webhook secret works for both tenants
- ✅ Source routes payments by tenant metadata

**What You Need to Verify:**
1. ⏳ Stripe webhook exists for `source-database.onrender.com/webhooks/stripe-payments`
2. ⏳ Webhook listens for `checkout.session.completed`
3. ⏳ Source's `STRIPE_WEBHOOK_SECRET` is correct
4. ⏳ Test a payment to confirm it appears in portal

**No additional Stripe webhook needed for Tanja!** The existing Source database webhook handles everything. 🎉

---

**Last Updated:** November 5, 2025  
**Status:** ✅ Ready for Testing

