# Kraftverk Campaign Approach for Tanja Unlimited

## 🎯 The Simple Way - Stripe as Your Campaign Database

Tanja Unlimited now uses the **same approach as Kraftverk**: Stripe itself stores campaign prices, no webhooks or databases needed!

---

## How It Works

### **Core Concept:**

One Stripe Product can have **multiple active prices**. The **newest active price** is automatically used.

```
Stripe Product: "Long Jacket Cotton fitted imperial line Silver"
Product ID: prod_TM8WtsmaCpBGLm

Prices (both active):
├─ Price 1: 6,400 kr (created Nov 3) - Standard price
└─ Price 2: 5,120 kr (created Nov 6) - Campaign price ✨ NEWEST!

Checkout automatically picks: 5,120 kr (the newest one)
```

---

## 🎨 How to Create a Campaign

### **Step 1: Go to Stripe Dashboard**

1. Navigate to **Products**
2. Find the product (e.g., "Long Jacket Cotton fitted imperial line Silver")
3. Click on it

### **Step 2: Add Campaign Price**

1. Scroll to **"Priser" (Prices)** section
2. Click **"+ Add another price"** (the + icon)
3. Enter campaign price: **5,120 kr** (20% off 6,400 kr)
4. Add description: **"Campaign: Testförtanja (20% off)"**
5. **Keep the old price active** (don't archive it)
6. **Save**

### **Step 3: That's It! ✅**

- Stripe now has 2 active prices
- Checkout automatically uses the newest one (5,120 kr)
- Customer sees campaign price
- No webhooks needed!

---

## 🛍️ What Customers See

### **On Product Page:**

**Before Campaign:**
```
Long Jacket Cotton fitted imperial line Silver
6,400 SEK
[Buy Now]
```

**After Campaign (automatically):**
```
[✨ 20% rabatt]
Long Jacket Cotton fitted imperial line Silver
5,120 SEK  6,400 SEK
(bold)     (strikethrough)
Spara 1,280 SEK
[Buy Now]
```

### **In Stripe Checkout:**

Customer sees: **5,120 kr** (campaign price)

---

## 🔄 How to End a Campaign

### **Option 1: Archive Campaign Price**

1. Go to Stripe Product
2. Find the campaign price (5,120 kr)
3. Click menu → **"Arkivera pris" (Archive price)**
4. Campaign price becomes inactive
5. Checkout now uses the standard price (6,400 kr)

### **Option 2: Create New Standard Price**

1. Create a new price: 6,400 kr (newer date)
2. Archive the campaign price
3. Newest price is now the standard one

---

## 💡 How Tanja's Code Works

### **At Checkout:**

```typescript
1. Customer clicks "Buy Now" for product ljcfils-001
2. Checkout queries Stripe: "What active prices exist for prod_TM8WtsmaCpBGLm?"
3. Stripe returns: [5,120 kr (Nov 6), 6,400 kr (Nov 3)]
4. Code sorts by date: newest first
5. Code picks: 5,120 kr ✨
6. Creates checkout with campaign price
7. Customer pays 5,120 kr
```

### **On Product Page:**

```typescript
1. Page loads for product ljcfils-001
2. CampaignBadge queries: /api/products/price?productId=ljcfils-001
3. API queries Stripe for latest price
4. If multiple active prices exist → Campaign detected!
5. Shows badge: "20% rabatt"
6. Shows prices: 5,120 kr (bold) / 6,400 kr (strikethrough)
```

---

## 🔧 Product ID Mapping

Your Tanja product IDs are mapped to Stripe Product IDs:

| Tanja Product ID | Stripe Product ID | Product Name |
|------------------|-------------------|--------------|
| `sjs-001` | `prod_TM8HrnCVZxAkzA` | Short Jacket Silk (SJS) |
| `ljsf-001` | `prod_TM8KNMKe85ZYMM` | Long Jacket Silk fitted (LJSf) |
| `sjcilw-001` | `prod_TM8ObxolUedP4W` | Short jacket Cotton Imperial Line White |
| `njcilw-001` | `prod_TM8PR5YzRhLcGo` | Nehru Jacket Cotton imperial line White |
| `ljckils-001` | `prod_TM8U3Iw6TlUoba` | Long Jacket Cotton knee imperial line Silver |
| `ljcfils-001` | `prod_TM8WtsmaCpBGLm` | Long Jacket Cotton fitted imperial line Silver |

---

## 🧪 Testing Your Campaign

### **Your Current Campaign:**

Product: Long Jacket Cotton fitted imperial line Silver (ljcfils-001)  
Stripe Product: prod_TM8WtsmaCpBGLm  
Standard Price: 6,400 kr (created Nov 3)  
Campaign Price: 5,120 kr (created Nov 6) - **20% off**

### **Test Steps:**

1. **Visit product page:**
   ```
   https://tanja-unlimited-test.onrender.com/webshop/tanja-jacket/ljcfils-001
   ```

2. **Should see:**
   - ✨ Campaign badge: "20% rabatt"
   - Price: 5,120 SEK (bold)
   - Original: ~~6,400 SEK~~ (strikethrough)
   - Savings: "Spara 1,280 SEK"

3. **Click "Buy Now"**

4. **Check Render logs:**
   ```
   🎯 Using campaign price for ljcfils-001:
      5120 SEK (20% off)
   ```

5. **In Stripe Checkout:**
   - Should show 5,120 kr (not 6,400 kr)

---

## ✅ Advantages Over Webhook Approach

| Feature | Webhook Approach | Kraftverk/Stripe Approach |
|---------|-----------------|--------------------------|
| **Setup** | Complex (webhooks, API endpoints, storage) | Simple (just Stripe) |
| **Reliability** | Depends on webhook delivery | ✅ Always works |
| **Real-time** | Delays if webhook fails | ✅ Instant |
| **Sync Issues** | Can get out of sync | ✅ Always in sync |
| **Maintenance** | Must handle webhook failures | ✅ Stripe handles it |
| **Your Current Issue** | ❌ Webhooks not received | ✅ No webhooks needed! |

---

## 🚀 What's Been Implemented

✅ **Stripe Product Mapping** - All 6 jackets mapped to Stripe Products  
✅ **Smart Price Lookup** - Queries Stripe for latest active price  
✅ **Campaign Detection** - Automatically detects when multiple prices exist  
✅ **Checkout Integration** - Uses latest price automatically  
✅ **Frontend Badge** - Shows campaign discount when detected  
✅ **Graceful Fallback** - Uses default price if Stripe query fails  

---

## 🎯 Next Steps

1. **Test the campaign** on ljcfils-001 product page
2. **Should see campaign badge** and discounted price
3. **Make test purchase** - should use 5,120 kr price
4. **Create more campaigns** by adding new prices in Stripe
5. **No webhooks needed!** Just add prices in Stripe and they work immediately

---

## 📋 Campaign Workflow

### **To Start Campaign:**
1. Open product in Stripe
2. Add new price with discount
3. ✅ **Campaign live immediately!**

### **To End Campaign:**
1. Archive campaign price in Stripe
2. ✅ **Back to normal pricing immediately!**

### **To Change Discount:**
1. Archive old campaign price
2. Add new campaign price with different amount
3. ✅ **New discount live immediately!**

---

## Summary

**Simple, Robust, Works Like Kraftverk!**

No webhooks. No databases. Just Stripe.

**Status:** ✅ Implemented and Ready to Test

---

Last Updated: November 6, 2025

