# Getting Started with Your New Tanja Unlimited Website

## ✅ What's Complete

### **1. Complete Website Redesign**
- ✅ Warm, artisanal color palette (indigo, ochre, clay)
- ✅ Elegant typography (Cormorant Garamond + Inter)
- ✅ Sophisticated layout with textile-inspired patterns
- ✅ All emojis removed, replaced with minimal icons
- ✅ Smooth animations with Framer Motion

### **2. Full Multi-Language Support**
- ✅ English (default)
- ✅ Swedish (SV)
- ✅ German (DE)
- ✅ Language switcher in header

### **3. Complete Webshop**
- ✅ 8 product categories
- ✅ 40+ products
- ✅ Product detail pages
- ✅ Product images displayed

### **4. Stripe Payment Integration**
- ✅ 6 Tanja Jackets connected to Stripe
- ✅ Buy Now button with checkout
- ✅ Success page after purchase
- ✅ Existing `/api/checkout` route ready

### **5. Customer Portal Integration**
- ✅ Contact form connected to Source Database
- ✅ Messages appear in customer portal
- ✅ Spam protection (honeypot)
- ✅ Elegant new design

---

## 🚀 How to Run the Website Locally

### **Step 1: Create Environment File**

Create a file named `.env.local` in your project root:

```env
# Stripe Configuration (REQUIRED for payments)
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Source Database (Customer Portal)
SOURCE_DATABASE_URL=https://source-database.onrender.com
SOURCE_TENANT_ID=tanjaunlimited

# Site Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Security
CUSTOMER_API_KEY=your_secure_random_key
```

### **Step 2: Start the Development Server**

Open PowerShell in your project folder:

```powershell
cd "C:\Users\vince\.cursor\Tanjas Jackor - Hemisda"
npm run dev
```

You should see:
```
▲ Next.js 15.5.6
- Local:        http://localhost:3000
✓ Ready in X.Xs
```

### **Step 3: Open in Browser**

Go to: **http://localhost:3000**

---

## 🎨 What You'll See

### **Homepage**
- Warm, elegant hero section
- Featured Tanja Jacket section
- Quick links to Collection, Calligraphy, Exhibitions
- Philosophy values
- CTA to visit atelier

### **Navigation (Top)**
- Home | Collection | Exhibitions | Calligraphy | About | Contact | **Webshop**
- Language switcher: **EN | SV | DE**

### **Webshop**
Click "Webshop" button to see:
- 8 beautiful category cards
- The Tanja Jacket category has 6 products with:
  - Real product images
  - Prices in SEK
  - "View Details" button
  - **Buy Now** functionality (for products with Stripe)

### **Product Pages**
- Full product images
- Detailed descriptions
- Price display
- **Buy Now** button (opens Stripe checkout)
- Wishlist and share options

### **Contact Form**
- Works on `/contact` and `/book` pages
- Sends to Source Database customer portal
- You'll see messages in your portal!

---

## 🔧 Testing Stripe Payments

### **Test Mode (Recommended First)**

1. Use Stripe **test keys** in `.env.local`
2. Go to a Tanja Jacket product (e.g., `/webshop/tanja-jacket/sjs-001`)
3. Click "Buy Now"
4. Use test card: `4242 4242 4242 4242`
5. Any future date, any CVC
6. Complete checkout
7. You'll be redirected to success page

### **Check Customer Portal**
- Payments should appear in Source Database portal
- Order tracking automatic

---

## 📋 What's Still Needed

### **A. Stripe Product/Price IDs**

You provided 6 jackets. Still need IDs for:

**Remaining Tanja Jackets:**
1. Long Jacket Cotton Knee Imperial Line Gold (SEK 8,200)
2. Long Jacket Cotton Fitted Imperial Line Gold (SEK 8,400)
3. Long Jacket Cotton Knee Imperial Line Platinum (SEK 10,500)
4. Long Jacket Cotton Fitted Imperial Line Platinum (SEK 10,500)
5. Long Jacket Cotton Fitted Imperial Line Diamond (SEK 14,000)

**Other Products:**
- Tanja Calligraphy Blouse White (SEK 898)
- Art Cushions (7 products)
- Shawls and Stoles (5 products)
- Tanja Carpet/Throw (SEK 3,998)
- Ragpicker Denims (2 products)
- CSR Products (3 products)

Format needed: `Product Name - prod_xxxxx - price_xxxxx`

### **B. Product Images**

Products currently with images (6):
- Short Jacket Silk (SJS) ✓
- Long Jacket Silk fitted (LJSf) ✓
- Short jacket Cotton Imperial Line White (SJCilW) ✓
- Nehru Jacket Cotton imperial line White (NJCilW) ✓
- Long Jacket Cotton knee imperial line Silver (LJCkilS) ✓
- Long Jacket Cotton fitted imperial line Silver (LJCfilS) ✓

**Need images for remaining 34+ products**

Place images in `/public/Images/` folder with exact product name + `.webp` or `.jpg`

### **C. Environment Variables**

Get from Stripe Dashboard:
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### **D. For Production Deployment**

1. Deploy to Vercel/Render/Netlify
2. Set up domain
3. Configure Stripe webhook
4. Update environment variables with production keys

---

## 🎯 Current Status Summary

**✅ Ready to Use:**
- Beautiful redesigned website
- Multi-language support
- Contact form → Customer portal
- 6 jackets with Stripe payments
- Product images showing
- All pages responsive

**⚠️ Needs Configuration:**
- `.env.local` file with Stripe keys
- Remaining Stripe product/price IDs
- Product images for other items
- Production deployment

---

## 🐛 Troubleshooting

### If `npm run dev` doesn't work:

```powershell
# Make sure you're in the right folder
cd "C:\Users\vince\.cursor\Tanjas Jackor - Hemisda"

# Verify package.json exists
Get-Content package.json

# If it shows the scripts, run:
npm run dev
```

### If you see syntax errors:

All curly apostrophes have been fixed. If you see more errors, the file might not have saved. Try:

```powershell
git pull origin main
npm install
npm run dev
```

---

## 📞 Next Steps

1. **Create `.env.local`** with your Stripe test keys
2. **Run `npm run dev`**
3. **Test the website** at http://localhost:3000
4. **Test a payment** with test card
5. **Provide remaining Stripe IDs** for other products
6. **Add remaining product images**
7. **Deploy to production** when ready

---

## 🎉 You're Almost There!

The website is beautifully designed and functional. Just needs:
- Environment configuration
- Remaining Stripe product IDs
- Product images
- Then it's ready for production!

Questions? The website is fully set up and ready to test locally once you add the `.env.local` file!

