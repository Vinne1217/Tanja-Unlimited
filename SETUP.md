# Tanja Unlimited — Development Setup

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create `.env.local` with:
```env
SOURCE_DATABASE_URL=https://source-database.onrender.com
SOURCE_TENANT_ID=tanja
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CUSTOMER_API_KEY=your_dev_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Run dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Testing Integrations

### Contact Form
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "message": "Hej från dev!"
  }'
```

### Analytics
```bash
curl -X POST http://localhost:3000/api/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "type": "page_view",
      "url": "http://localhost:3000",
      "timestamp": "2025-01-01T00:00:00.000Z"
    }]
  }'
```

### Stripe Checkout
- Add test products to Source with `stripePriceId` from Stripe Dashboard
- Navigate to `/collection/[category]/[product-id]`
- Click "Buy now" → redirects to Stripe test checkout
- Use test card: 4242 4242 4242 4242

### Campaign Webhook (local test)
```bash
curl -X POST http://localhost:3000/api/campaigns/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_dev_key" \
  -d '{
    "action": "created",
    "campaign": {
      "id": "test_123",
      "name": "Test Sale",
      "status": "active"
    }
  }'
```

## Project Structure

```
app/
  api/
    checkout/         - Stripe Checkout session creator
    webhooks/stripe/  - Stripe webhook proxy → Source
    contact/          - Contact form → Source messages
    analytics/        - Analytics → Source ingest
    campaigns/webhook/- Campaign sync receiver
    ai-feedback/      - AI feedback passthrough
  collection/
    page.tsx          - Category listing
    [category]/
      page.tsx        - Products in category
      [id]/
        page.tsx      - Product detail + purchase
        purchase.tsx  - Client-side buy flow
  events/             - Events skeleton
  stories/            - Journal/Stories skeleton
  sister-unlimited/   - Sister page + booking
  contact/            - Contact page
  
components/
  ContactForm.tsx     - Contact form component
  ProductCard.tsx     - Product grid card
  LanguageSwitcher.tsx- Language selector (sv/de/en)
  
lib/
  source.ts           - Source API fetch helper
  catalog.ts          - Product/category adapters
  campaigns.ts        - Campaign cache
  payments.ts         - Direct payment webhook sender
  analytics.client.ts - Client analytics helpers
  seo.ts              - JSON-LD helpers
```

## Pages

- `/` - Home
- `/collection` - Categories
- `/collection/[category]` - Products
- `/collection/[category]/[id]` - Product detail
- `/events` - Exhibitions & Events
- `/stories` - Journal/Stories
- `/sister-unlimited` - Sister Unlimited + booking
- `/contact` - Contact form

## Key Features Implemented

✅ **Catalog**: Categories + products from Source with variant support  
✅ **Checkout**: Stripe Checkout redirect with variant price selection  
✅ **Webhooks**: Stripe → Source payment tracking  
✅ **Contact**: Form → Source messages API  
✅ **Analytics**: Page views + events → Source analytics  
✅ **Campaigns**: Webhook receiver with cache + ISR revalidation  
✅ **SEO**: Product JSON-LD, redirects, sitemap, robots.txt  
✅ **i18n**: Language switcher UI (sv/de/en via query param)  
✅ **Accessibility**: Focus-visible, semantic HTML, WCAG AA color contrast  

## What's Next (awaiting assets/config)

- **Sanity CMS**: Connect when `projectId`/`dataset` provided
- **Content**: Logo, brand images, editorial copy for pages
- **Production**: Render URL, Stripe prod webhook, DNS configuration

## Troubleshooting

### Contact form not submitting
- Check SOURCE_DATABASE_URL is set
- Verify SOURCE_TENANT_ID=tanja
- Check browser console for CORS errors

### Products not loading
- Ensure Source API is running
- Check network tab: should see requests to `/v1/tenants/tanja/catalog/*`
- Verify tenant has products in Source DB

### Stripe checkout failing
- Check STRIPE_SECRET_KEY is set
- Verify products have valid `stripePriceId` in Source
- Use Stripe test mode keys (sk_test_...)

### Language switcher not working
- Currently uses URL query params (?lang=sv)
- Full i18n wiring requires Sanity connection

## Support

See `TANJA_WEBSITE_INTEGRATION_GUIDE` for complete API specs and webhook formats.

