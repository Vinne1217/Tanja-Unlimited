# Production Deployment Checklist

## Prerequisites (to be provided)
- [ ] Render URL or target domain
- [ ] Production Stripe keys
- [ ] Sanity project ID and dataset (optional, for CMS)
- [ ] Logo files and brand assets
- [ ] Product catalog CSV or Source tenant populated

## Deployment Steps

### 1. Render Setup
1. Create Web Service on Render
2. Connect GitHub repo
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 20.x

### 2. Environment Variables (Render Dashboard)
```
SOURCE_DATABASE_URL=https://source-database.onrender.com
SOURCE_TENANT_ID=tanja
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CUSTOMER_API_KEY=<generate strong key>
NEXT_PUBLIC_BASE_URL=https://your-render-domain.onrender.com
IP_SALT=<generate random string>
REVALIDATE_TOKEN=<generate random string>
```

### 3. Stripe Webhook Configuration
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-render-domain.onrender.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `price.created`
   - `price.updated`
4. Copy webhook secret → set as `STRIPE_WEBHOOK_SECRET` in Render

### 4. Source CORS Whitelist
Contact Source admin to whitelist:
- `https://your-render-domain.onrender.com`
- Production domain (if using custom domain)

### 5. Campaign Webhook (Portal → Site)
In Customer Portal:
1. Navigate to Campaigns → Settings
2. Enable Frontend Sync
3. Enter webhook URL: `https://your-render-domain.onrender.com/api/campaigns/webhook`
4. Set Authorization header: `Bearer <CUSTOMER_API_KEY>`
5. Test ping

### 6. Custom Domain (if applicable)
1. In Render: Settings → Custom Domain
2. Add domain, copy DNS records
3. Update DNS with your provider
4. Wait for SSL certificate provisioning
5. Update `NEXT_PUBLIC_BASE_URL` to custom domain
6. Update Stripe webhook URL to custom domain

### 7. Sanity CMS (optional)
When ready to connect:
1. Add to `.env`:
   ```
   SANITY_PROJECT_ID=<project-id>
   SANITY_DATASET=<dataset>
   ```
2. Install Sanity client: `npm i @sanity/client next-sanity`
3. Wire schemas (see `TODO: Sanity setup` in codebase)

### 8. Testing in Production
#### Contact Form
```bash
curl -X POST https://your-domain.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "message": "Production test"
  }'
```
Check Customer Portal → Messages

#### Analytics
```bash
curl -X POST https://your-domain.com/api/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "type": "page_view",
      "url": "https://your-domain.com",
      "timestamp": "2025-01-01T00:00:00.000Z"
    }]
  }'
```
Check Customer Portal → Analytics

#### Stripe Checkout
1. Navigate to product page
2. Click "Buy now"
3. Complete test purchase
4. Verify in Customer Portal → Payments (within 5 minutes)

### 9. Performance & SEO
- [ ] Run Lighthouse on production URL (target: ≥90 mobile)
- [ ] Verify robots.txt accessible: `https://your-domain.com/robots.txt`
- [ ] Verify sitemap accessible: `https://your-domain.com/sitemap.xml`
- [ ] Check OpenGraph tags with https://www.opengraph.xyz/
- [ ] Test structured data with https://search.google.com/test/rich-results

### 10. Monitoring
- [ ] Set up Render health check: `/api/health`
- [ ] Monitor Stripe webhook delivery in Dashboard
- [ ] Check Source logs for tenant activity
- [ ] Optional: Add Sentry or LogRocket

## Post-Launch
- [ ] Train editors on Customer Portal
- [ ] Document content update workflows
- [ ] Schedule first product upload
- [ ] Test full purchase flow with real payment method
- [ ] Share site with Tanja for review

## Rollback Plan
If issues arise:
1. Render: Deploy → select previous successful build
2. Stripe: pause webhook endpoint temporarily
3. Source: check logs for errors under tenant `tanja`

## Support Contacts
- **Source DB**: support@source-database.com
- **Stripe**: https://support.stripe.com
- **Render**: https://render.com/docs/support

