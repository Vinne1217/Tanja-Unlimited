# Implementationsguide - Stripe Connect, Presentkort, Kampanjer och Produkter

Detta dokument beskriver exakt hur vi har implementerat Stripe Connect, presentkortlogik, kampanjer, produktskapande, kategorier, storefront och checkout. Denna guide kan användas för att implementera samma funktionalitet på en ny hemsida för en annan tenant.

---

## 📋 Innehållsförteckning

1. [Stripe Connect Implementation](#stripe-connect-implementation)
2. [Presentkortlogik (Gift Cards)](#presentkortlogik-gift-cards)
3. [Kampanjer (Campaigns)](#kampanjer-campaigns)
4. [Produktskapande och Synkronisering](#produktskapande-och-synkronisering)
5. [Kategorier](#kategorier)
6. [Storefront](#storefront)
7. [Checkout](#checkout)
8. [Kundmeddelanden Integration](#kundmeddelanden-integration)

---

## 1. Stripe Connect Implementation

### Översikt

Vi använder Stripe Connect för att hantera betalningar genom en centraliserad backend. Frontend skapar **INTE** Stripe checkout-sessioner direkt - istället anropar vi en backend-endpoint som hanterar Stripe Connect-kontexten automatiskt.

### Arkitektur

```
Frontend (Tenant Website)
    ↓
POST /api/checkout (Tenant Backend)
    ↓
POST /storefront/{tenant}/checkout (Source Portal Backend)
    ↓
Stripe Connect Checkout Session
```

### Implementation

#### 1.1 Tenant Backend Checkout Endpoint

**Fil:** `app/api/checkout/route.ts`

**Funktionalitet:**
- Tar emot checkout-request från frontend
- Validerar inventory (lagerstatus)
- Kontrollerar kampanjpriser
- Hanterar presentkortskoder (forwardar, gör INTE inlösen)
- Transformar data till backend-format
- Anropar Source Portal backend endpoint

**Request Format från Frontend:**
```typescript
{
  items: [{
    quantity: number,
    stripePriceId: string,        // Fallback price ID
    productId?: string,            // För att hämta senaste pris
    variantKey?: string,           // Variant key/ID (artikelnummer/SKU)
    type?: 'gift_card' | 'product',
    giftCardAmount?: number        // Belopp i öre (endast för gift cards)
  }],
  customerEmail?: string,
  successUrl: string,
  cancelUrl: string,
  giftCardCode?: string,          // Presentkortskod (direkt property - föredragen)
  metadata?: {
    giftCardCode?: string,        // Presentkortskod i metadata (backup)
    [key: string]: any
  }
}
```

**Backend Request Format:**
```typescript
{
  items: [{
    variantId: string,             // variantKey || productId || fallback
    quantity: number,
    stripePriceId: string          // Kampanjpris eller originalpris
  }],
  customerEmail?: string,
  successUrl: string,
  cancelUrl: string,
  giftCardCode?: string,          // Direkt property (explicit inkluderad)
  metadata: {
    tenant: string,                // Tenant ID
    source: string,                // 'tanja_website' eller 'tenant_webshop'
    website: string,               // Website domain
    giftCardCode?: string,         // Presentkortskod (backup)
    product_type?: 'giftcard',     // För presentkortsköp
    giftcard_amount?: string,      // Belopp i SEK (inte öre)
    giftcard_currency?: string,    // 'SEK'
    [key: string]: any
  }
}
```

**Backend Response Format:**
```typescript
{
  url: string,                     // Checkout URL från Stripe
  id: string,                      // Session ID
  orderId?: string                 // Order ID från backend
}
```

#### 1.2 Source Portal Backend Endpoint

**URL:** `POST /storefront/{tenant}/checkout`

**Base URL:** `https://source-database-809785351172.europe-north1.run.app`

**Headers:**
- `Content-Type: application/json`
- `X-Tenant: {tenantId}`

**Funktionalitet:**
- Skapar Stripe Connect checkout session
- Hanterar Stripe Connect account context automatiskt
- Applicerar kampanjpriser
- Hanterar presentkortsinlösen (server-side)
- Skapar order records i databasen
- Returnerar checkout URL

#### 1.3 Viktiga Implementationdetaljer

**Inventory Validering:**
```typescript
// Validera inventory innan checkout
for (const item of items) {
  // Hoppa över för presentkort (de har inget inventory)
  if (item.type === 'gift_card') continue;
  
  // Kontrollera via stripePriceId (mest tillförlitligt)
  const variant = await getVariantByPriceId(item.stripePriceId, item.productId);
  
  if (!variant || variant.stock <= 0 || variant.outOfStock) {
    return NextResponse.json(
      { error: 'Produkten är slutsåld' },
      { status: 400 }
    );
  }
}
```

**Kampanjpriskontroll:**
```typescript
// Kontrollera kampanjpriser från Source Portal API
const campaignUrl = `${SOURCE_BASE}/api/campaigns/price/${apiProductId}?originalPriceId=${encodeURIComponent(item.stripePriceId)}&tenant=${TENANT_ID}`;

const campaignResponse = await fetch(campaignUrl, {
  headers: {
    'X-Tenant': TENANT_ID,
    'Content-Type': 'application/json'
  },
  cache: 'no-store'
});

if (campaignResponse.ok) {
  const campaignData = await campaignResponse.json();
  if (campaignData.hasCampaignPrice && campaignData.priceId) {
    priceId = campaignData.priceId; // Använd kampanjpris
  }
}
```

**Metadata för Presentkort:**
```typescript
// Om detta är ett presentkortsköp, lägg till obligatoriska metadata-fält
if (isGiftCardPurchase && giftCardItem) {
  sessionMetadata.product_type = 'giftcard';
  sessionMetadata.giftcard_amount = Math.round(giftCardItem.giftCardAmount / 100).toString(); // Konvertera från öre till SEK
  sessionMetadata.giftcard_currency = 'SEK';
  sessionMetadata.source = 'tenant_webshop'; // Överskriv source för presentkort
}
```

### Miljövariabler

```env
SOURCE_DATABASE_URL=https://source-database-809785351172.europe-north1.run.app
SOURCE_TENANT_ID=tanjaunlimited
FRONTEND_API_KEY=your_api_key_here
```

---

## 2. Presentkortlogik (Gift Cards)

### Översikt

Presentkort verifieras i frontend (read-only), men inlösen sker server-side i customer portal backend. Frontend gör **ALDRIG** inlösen direkt.

### Arkitektur

```
Frontend (Verifiering)
    ↓
POST /api/gift-cards/verify (Tenant Backend)
    ↓
POST /api/storefront/{tenant}/giftcards/verify (Source Portal Backend)
    ↓
Checkout (Forwardar kod)
    ↓
Source Portal Backend (Gör inlösen server-side)
```

### Implementation

#### 2.1 Presentkortsverifiering (Read-Only)

**Fil:** `lib/gift-cards.ts`

**Funktion:** `verifyGiftCard()`

**Funktionalitet:**
- Verifierar presentkortskod (read-only)
- Kontrollerar giltighet och saldo
- Returnerar saldo och utgångsdatum
- Gör **INTE** inlösen

**API Endpoint:** `POST /api/storefront/{tenant}/giftcards/verify`

**Request:**
```typescript
{
  code: string  // Presentkortskod (uppercase, trimmed)
}
```

**Response:**
```typescript
{
  valid: boolean,
  balance?: number,      // Saldo i öre
  expiresAt?: string,   // ISO date string
  error?: string
}
```

**Felhantering:**
- `404`: Presentkort hittades inte
- `400`: Ogiltig kod eller otillräckligt saldo
- `410`: Presentkort har gått ut eller är uttömt

#### 2.2 Presentkort i Checkout

**Frontend Implementation (`app/cart/page.tsx`):**

```typescript
// 1. Verifiera presentkort (read-only)
async function handleVerifyGiftCard() {
  const formattedCode = giftCardCode.toUpperCase().trim();
  
  const response = await fetch('/api/gift-cards/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: formattedCode })
  });
  
  const data = await response.json();
  
  if (data.valid) {
    // Konvertera från öre till SEK för visning
    const balanceInSEK = (data.balance || 0) / 100;
    setGiftCardVerified({
      valid: true,
      balance: balanceInSEK,
      balanceInCents: data.balance
    });
  }
}

// 2. Inkludera presentkortskod i checkout
async function handleCheckout() {
  const giftCardCodeToSend = giftCardVerified?.valid 
    ? giftCardCode.toUpperCase().trim() 
    : undefined;
  
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [...],
      giftCardCode: giftCardCodeToSend,  // Direkt property (föredragen)
      successUrl: '...',
      cancelUrl: '...',
      metadata: {
        giftCardCode: giftCardCodeToSend  // Backup i metadata
      }
    })
  });
}
```

**Backend Implementation (`app/api/checkout/route.ts`):**

```typescript
// Extrahera presentkortskod från request
const giftCardCode = requestBody.giftCardCode || requestBody.metadata?.giftCardCode;

// Validera format
if (giftCardCode && typeof giftCardCode !== 'string') {
  return NextResponse.json(
    { error: 'Invalid gift card code format' },
    { status: 400 }
  );
}

// Forwarda kod till backend (INGEN inlösen här)
if (giftCardCode) {
  sessionMetadata.giftCardCode = giftCardCode;
  console.log(`🎁 Forwarding gift card code in metadata: ${maskGiftCardCode(giftCardCode)}`);
}

// Inkludera i backend request
const backendRequestBody = {
  items: backendItems,
  customerEmail: customerEmail || undefined,
  successUrl: successUrl,
  cancelUrl: cancelUrl,
  ...(giftCardCode && { giftCardCode: giftCardCode }), // Explicit inkludera om närvarande
  metadata: sessionMetadata
};
```

#### 2.3 Presentkortsköp

**Metadata för Presentkortsköp:**

När en kund köper ett presentkort måste följande metadata-fält inkluderas:

```typescript
{
  product_type: 'giftcard',              // Obligatoriskt
  giftcard_amount: '500',                // Belopp i SEK (inte öre)
  giftcard_currency: 'SEK',              // ISO-kod
  tenant: 'tanjaunlimited',              // Tenant ID
  source: 'tenant_webshop'               // Överskriv source för presentkort
}
```

**Implementation:**

```typescript
// Identifiera presentkortsköp
const giftCardItem = items.find(item => item.type === 'gift_card');
const isGiftCardPurchase = !!giftCardItem;

if (isGiftCardPurchase && giftCardItem) {
  // Konvertera från öre till SEK
  const giftCardAmountInMajorUnits = giftCardItem.giftCardAmount 
    ? Math.round(giftCardItem.giftCardAmount / 100).toString() 
    : '0';
  
  sessionMetadata.product_type = 'giftcard';
  sessionMetadata.giftcard_amount = giftCardAmountInMajorUnits;
  sessionMetadata.giftcard_currency = 'SEK';
  sessionMetadata.source = 'tenant_webshop';
}
```

#### 2.4 Tenant Configuration

**Kontrollera om presentkort är aktiverat:**

```typescript
import { getTenantConfig } from '@/lib/source';

const tenantConfig = await getTenantConfig(tenantId);
if (!tenantConfig.giftCardsEnabled) {
  return NextResponse.json(
    { error: 'Gift cards are not enabled for this tenant' },
    { status: 403 }
  );
}
```

**API Endpoint:** `GET /api/tenants/{tenantId}/config`

**Response:**
```typescript
{
  tenantId: string,
  giftCardsEnabled?: boolean,
  [key: string]: any
}
```

---

## 3. Kampanjer (Campaigns)

### Översikt

Kampanjer synkroniseras från Source Portal till frontend via webhooks och sync endpoints. Kampanjpriser skapas i Stripe Connect account och används automatiskt vid checkout.

### Arkitektur

```
Source Portal (Admin)
    ↓
Webhook: POST /api/campaigns/webhook
    ↓
Campaign Price Service (Lagrar i Source DB)
    ↓
Sync Endpoint: POST /api/campaigns/sync
    ↓
Campaign Store (In-Memory)
    ↓
Checkout (Använder kampanjpriser)
```

### Implementation

#### 3.1 Kampanjstruktur

**Fil:** `lib/campaigns.ts`

**Type Definition:**
```typescript
export type Campaign = {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  products?: string[];              // Product IDs
  startDate?: string;               // ISO date string
  endDate?: string;                 // ISO date string
  stripeCouponId?: string;
  stripePromotionCodeId?: string;
  stripePriceIds?: string[];        // Campaign price IDs för checkout (Stripe Connect)
  usageCount?: number;
  maxUses?: number;
};
```

#### 3.2 Kampanj Sync Endpoint

**Fil:** `app/api/campaigns/sync/route.ts`

**Endpoint:** `POST /api/campaigns/sync`

**Headers:**
- `Authorization: Bearer {FRONTEND_API_KEY}` (Obligatoriskt)
- `Content-Type: application/json`
- `Idempotency-Key: {campaignId}` (Rekommenderat)

**Request Format:**
```typescript
{
  campaignId: string,               // Eller 'id'
  name: string,
  type: string,
  discountType?: 'percentage' | 'amount',
  discountValue?: number,
  products?: string[],
  startDate?: string,               // ISO date string
  endDate?: string,                 // ISO date string
  status: 'active' | 'inactive' | 'deleted',
  stripeCouponId?: string,
  stripePromotionCodeId?: string,
  stripePriceIds?: string[]          // ⚠️ Stripe Connect account prices
}
```

**Response:**
```typescript
{
  success: boolean,
  message: string,
  campaignId: string,
  idempotencyKey?: string,
  stripePriceIdsCount?: number
}
```

**Implementation:**
```typescript
export async function POST(req: NextRequest) {
  // 1. Verifiera Authorization header
  const auth = req.headers.get('authorization') ?? '';
  const expectedKey = process.env.FRONTEND_API_KEY || process.env.CUSTOMER_API_KEY;
  
  if (auth !== `Bearer ${expectedKey}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // 2. Hämta idempotency key
  const idempotencyKey = req.headers.get('idempotency-key');
  
  // 3. Parse campaign data
  const campaign = await req.json();
  const campaignId = campaign.campaignId || campaign.id;
  
  // 4. Hantera borttagning
  if (campaign.status === 'deleted' || campaign.action === 'deleted') {
    deleteCampaign(campaignId);
    revalidatePath('/');
    revalidatePath('/collection');
    revalidatePath('/webshop');
    return NextResponse.json({ success: true, message: 'Campaign deleted' });
  }
  
  // 5. Validera stripePriceIds (viktigt för Stripe Connect)
  if (campaign.stripePriceIds && Array.isArray(campaign.stripePriceIds)) {
    console.log(`✅ Campaign has ${campaign.stripePriceIds.length} Stripe price IDs`);
  }
  
  // 6. Upsert campaign
  upsertCampaign(campaign);
  
  // 7. Revalidate pages
  revalidatePath('/');
  revalidatePath('/collection');
  revalidatePath('/webshop');
  
  return NextResponse.json({ 
    success: true, 
    campaignId,
    stripePriceIdsCount: campaign.stripePriceIds?.length || 0
  });
}
```

#### 3.3 Kampanj Webhook

**Fil:** `app/api/campaigns/webhook/route.ts`

**Endpoint:** `POST /api/campaigns/webhook`

**Funktionalitet:**
- Tar emot kampanjprisuppdateringar från Source Portal
- Lagrar kampanjpriser i Source database
- Hanterar idempotency (förhindrar duplicering)
- Revaliderar sidor

**Request Format:**
```typescript
{
  action: 'price.created' | 'price.updated' | 'price.expired' | 'ping',
  eventId?: string,                  // För idempotency
  priceUpdate?: {
    stripePriceId: string,
    originalProductId: string,
    campaignId: string,
    campaignName?: string,
    metadata?: Record<string, any>
  }
}
```

**Implementation:**
```typescript
export async function POST(req: NextRequest) {
  // 1. Verifiera Authorization
  const auth = req.headers.get('authorization') ?? '';
  const expectedKey = process.env.FRONTEND_API_KEY || process.env.CUSTOMER_API_KEY;
  
  if (auth !== `Bearer ${expectedKey}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  // 2. Parse body
  const body = await req.json();
  const action = body.action;
  const eventId = body.eventId;
  
  // 3. Kontrollera idempotency
  if (eventId && await isEventProcessed(TENANT_ID, eventId)) {
    return NextResponse.json({ 
      success: true, 
      message: 'Event already processed',
      duplicate: true 
    });
  }
  
  // 4. Hantera ping
  if (action === 'ping') {
    return NextResponse.json({ success: true, message: 'Pong' });
  }
  
  // 5. Hantera price events
  if (action === 'price.created' || action === 'price.updated') {
    const priceUpdate = body.priceUpdate;
    
    // Lagra kampanjpris i Source database
    await storeCampaignPrice(TENANT_ID, priceUpdate, eventId);
    
    return NextResponse.json({ success: true });
  }
  
  if (action === 'price.expired') {
    await expireCampaignPrice(TENANT_ID, body.campaignId);
    return NextResponse.json({ success: true });
  }
}
```

#### 3.4 Kampanjpriskontroll vid Checkout

**Implementation i `app/api/checkout/route.ts`:**

```typescript
// Kontrollera kampanjpris för varje produkt
for (const item of items) {
  if (item.productId && item.stripePriceId) {
    // Hämta Stripe Product ID från Storefront API
    const product = await getProductFromStorefront(item.productId, { revalidate: 0 });
    const apiProductId = product?.stripeProductId || item.productId;
    
    // Kontrollera kampanjpris från Source Portal API
    const campaignUrl = `${SOURCE_BASE}/api/campaigns/price/${apiProductId}?originalPriceId=${encodeURIComponent(item.stripePriceId)}&tenant=${TENANT_ID}`;
    
    const campaignResponse = await fetch(campaignUrl, {
      headers: {
        'X-Tenant': TENANT_ID,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    
    if (campaignResponse.ok) {
      const campaignData = await campaignResponse.json();
      
      if (campaignData.hasCampaignPrice && campaignData.priceId) {
        // Använd kampanjpris
        priceId = campaignData.priceId;
        isCampaign = true;
        
        // Lägg till kampanjmetadata
        campaignData[`product_${index}_campaign`] = 'active';
        campaignData[`product_${index}_campaign_id`] = campaignData.campaignId || '';
        campaignData[`product_${index}_campaign_name`] = campaignData.campaignName || '';
      }
    }
  }
}
```

**API Endpoint för Kampanjpriskontroll:**

`GET /api/campaigns/price/{productId}?originalPriceId={priceId}&tenant={tenantId}`

**Response:**
```typescript
{
  hasCampaignPrice: boolean,
  priceId?: string,                  // Campaign price ID om aktiv
  campaignId?: string,
  campaignName?: string
}
```

#### 3.5 Campaign Price Service

**Fil:** `lib/campaign-price-service.ts`

**Funktioner:**
- `storeCampaignPrice()` - Lagrar kampanjpris i Source database
- `getCampaignPriceForProduct()` - Hämtar aktiv kampanjpris för produkt
- `expireCampaignPrice()` - Markerar kampanjpris som utgånget
- `isEventProcessed()` - Kontrollerar idempotency

**API Endpoints:**
- `POST /v1/campaign-prices` - Lagra kampanjpris
- `GET /v1/campaign-prices?tenantId={id}&productId={id}&status=active` - Hämta aktiv kampanjpris
- `PATCH /v1/campaign-prices/{campaignId}` - Uppdatera kampanjpris
- `GET /v1/campaign-prices/events/{eventId}?tenantId={id}` - Kontrollera idempotency

---

## 4. Produktskapande och Synkronisering

### Översikt

Produkter synkroniseras från Source Portal via Storefront API. Produkter kan ha varianter (storlek, färg) och varje variant har ett eget Stripe Price ID.

### Arkitektur

```
Source Portal (Admin)
    ↓
Storefront API: GET /storefront/{tenant}/products
    ↓
Frontend (lib/catalog.ts)
    ↓
Product Pages (app/webshop/[slug]/[id]/page.tsx)
```

### Implementation

#### 4.1 Produktstruktur

**Fil:** `lib/catalog.ts`

**Type Definitions:**
```typescript
export type Variant = {
  key: string;                      // Artikelnummer/SKU
  size?: string;
  color?: string;
  price?: number;                    // Pris i SEK (konverterat från öre)
  priceSEK?: number;                 // Pris i SEK (från API)
  stripePriceId?: string;            // Stripe Price ID för denna variant
  stock?: number;
  inStock?: boolean;
  outOfStock?: boolean;
  status?: 'in_stock' | 'out_of_stock' | 'low_stock';
};

export type Product = {
  id: string;                        // Product ID (baseSku eller id från API)
  name: string;                      // Titel från API
  description?: string;
  images?: string[];                 // Array av bild-URLs
  price?: number;                    // Pris i SEK (default price om inga varianter)
  currency?: string;                 // 'SEK'
  stripeProductId?: string;          // Stripe Product ID (prod_...)
  variants?: Variant[];
  categoryId?: string;
  type?: 'one_time' | 'subscription';
  subscription?: {
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount: number;
  };
};
```

#### 4.2 Hämta Produkter

**Funktion:** `getProducts()`

**API Endpoint:** `GET /storefront/{tenant}/products`

**Query Parameters:**
- `locale` - Språk (default: 'sv')
- `category` - Kategori-slug eller ID
- `q` - Sökterm
- `limit` - Antal produkter per sida
- `cursor` - Paginering cursor

**Implementation:**
```typescript
export async function getProducts(params: {
  locale?: string;
  category?: string;
  q?: string;
  limit?: number;
  cursor?: string;
} = {}): Promise<{ items: Product[]; nextCursor?: string }> {
  const qs = new URLSearchParams();
  if (params.locale) qs.set('locale', params.locale);
  if (params.category) qs.set('category', params.category);
  if (params.q) qs.set('q', params.q);
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.cursor) qs.set('cursor', params.cursor);
  
  // Försök storefront endpoint först, fallback till catalog endpoint
  let res = await sourceFetch(`/storefront/${TENANT_ID}/products?${qs.toString()}`, {
    headers: { 'X-Tenant': TENANT_ID }
  });
  
  if (!res.ok) {
    // Fallback till catalog endpoint
    res = await sourceFetch(`/v1/tenants/${TENANT_ID}/catalog/products?${qs.toString()}`, {
      headers: { 'X-Tenant': TENANT_ID }
    });
  }
  
  if (!res.ok) {
    return { items: [] };
  }
  
  const data = await res.json();
  
  // Hantera olika response-format
  let productsArray: any[] = [];
  if (Array.isArray(data)) {
    productsArray = data;
  } else if (data.products && Array.isArray(data.products)) {
    productsArray = data.products;
  } else if (data.success && Array.isArray(data.products)) {
    productsArray = data.products;
  }
  
  // Mappa produkter till vårt format
  const mappedProducts: Product[] = productsArray.map((p: any) => {
    // Pris är alltid i öre från Storefront API, konvertera till SEK
    const priceInCents = p.priceRange?.min || (p.variants?.[0]?.priceSEK);
    const priceInSEK = priceInCents ? priceInCents / 100 : null;
    
    return {
      id: p.baseSku || p.id,
      name: p.title || p.name,
      description: p.description,
      images: p.images || [],
      price: priceInSEK,              // Lagra i SEK, inte öre
      currency: 'SEK',
      stripeProductId: p.stripeProductId || p.stripe_product_id,
      type: p.type || 'one_time',
      variants: p.variants?.map((v: any) => {
        const articleNumber = v.articleNumber || v.sku || v.id || v.key;
        
        // Använd size och color direkt från API om tillgängligt
        let size = v.size;
        let color = v.color;
        
        // Fallback till parsing om inte tillgängligt
        if (!size && !color) {
          const parsed = parseVariantAttributes(articleNumber, v.size, v.color, v.key);
          size = parsed.size;
          color = parsed.color;
        }
        
        // Variantpris är i öre, konvertera till SEK
        const variantPriceSEK = v.priceSEK ?? v.price ?? null;
        const variantPrice = variantPriceSEK ? variantPriceSEK / 100 : null;
        
        return {
          key: articleNumber,
          size,
          color,
          price: variantPrice,
          priceSEK: variantPrice,
          stripePriceId: v.stripePriceId || v.stripe_price_id,
          stock: v.stock ?? null,
          inStock: v.inStock !== false,
          outOfStock: v.outOfStock || v.status === 'out_of_stock' || v.inStock === false,
          status: v.status || (v.inStock === false ? 'out_of_stock' : 'in_stock')
        };
      })
    };
  });
  
  return {
    items: mappedProducts,
    nextCursor: data.nextCursor || data.cursor
  };
}
```

#### 4.3 Hämta Enskild Produkt

**Funktion:** `getProduct()`

**API Endpoint:** `GET /storefront/{tenant}/product/{productId}`

**Implementation:**
```typescript
export async function getProduct(productId: string, locale = 'sv'): Promise<Product | null> {
  // Försök storefront endpoint först
  let res = await sourceFetch(`/storefront/${TENANT_ID}/product/${productId}?locale=${locale}`, {
    headers: { 'X-Tenant': TENANT_ID }
  });
  
  if (!res.ok) {
    // Fallback till catalog endpoint
    res = await sourceFetch(`/v1/tenants/${TENANT_ID}/catalog/products/${productId}?locale=${locale}`, {
      headers: { 'X-Tenant': TENANT_ID }
    });
  }
  
  if (!res.ok) {
    return null;
  }
  
  const data = await res.json();
  
  // Mappa produkt till samma format som getProducts()
  // ... (samma mappningslogik)
  
  return mappedProduct;
}
```

#### 4.4 Inventory Synkronisering

**Fil:** `app/api/inventory/sync/route.ts`

**Endpoint:** `POST /api/inventory/sync`

**Funktionalitet:**
- Tar emot inventory-uppdateringar från Source Portal
- Uppdaterar lagerstatus för produkter/varianter
- Revaliderar produkt-sidor

**Request Format:**
```typescript
{
  productId: string,
  stock: number,
  status: 'in_stock' | 'out_of_stock' | 'low_stock',
  productName?: string,
  sku?: string
}
```

**Eller:**
```typescript
{
  item: {
    id: string,
    stock: number,
    status: string,
    name?: string,
    sku?: string
  }
}
```

**Implementation:**
```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Extrahera produktdata
  let productId: string;
  let stock: number;
  let status: string;
  
  if (body.item?.id) {
    productId = body.item.id;
    stock = body.item.stock;
    status = body.item.status;
  } else if (body.productId) {
    productId = body.productId;
    stock = body.stock ?? 0;
    status = body.status ?? 'in_stock';
  } else {
    return NextResponse.json(
      { success: false, error: 'Invalid payload' },
      { status: 400 }
    );
  }
  
  // Mappa produkt-ID
  const mappedProductId = mapProductId(productId);
  
  // Uppdatera inventory storage
  await updateInventory(mappedProductId, {
    stock,
    status,
    lowStock: status === 'low_stock',
    outOfStock: status === 'out_of_stock',
    lastUpdated: new Date().toISOString()
  });
  
  // Revalidera sidor
  revalidatePath('/webshop');
  revalidatePath('/collection');
  revalidatePath('/');
  
  return NextResponse.json({ 
    success: true,
    productId: mappedProductId,
    stock,
    status
  });
}
```

---

## 5. Kategorier

### Översikt

Kategorier hämtas från Source Portal via Storefront API. Kategorier kan ha subkategorier och produkter kan tillhöra en eller flera kategorier.

### Implementation

#### 5.1 Kategoristruktur

**Fil:** `lib/catalog.ts`

**Type Definition:**
```typescript
export type Category = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  parentId?: string;                 // För subkategorier
  subcategories?: Category[];
  productCount?: number;
};
```

#### 5.2 Hämta Kategorier

**Funktion:** `getCategories()`

**API Endpoint:** `GET /storefront/{tenant}/categories`

**Query Parameters:**
- `locale` - Språk (default: 'sv')

**Implementation:**
```typescript
export async function getCategories(locale = 'sv'): Promise<Category[]> {
  // Försök storefront endpoint först
  let res = await sourceFetch(`/storefront/${TENANT_ID}/categories?locale=${locale}`, {
    headers: { 'X-Tenant': TENANT_ID }
  });
  
  if (!res.ok) {
    // Fallback till catalog endpoint
    res = await sourceFetch(`/v1/tenants/${TENANT_ID}/catalog/categories?locale=${locale}`, {
      headers: { 'X-Tenant': TENANT_ID }
    });
  }
  
  if (!res.ok) {
    return [];
  }
  
  const data = await res.json();
  
  // Hantera olika response-format
  let categoriesArray: any[] = [];
  if (Array.isArray(data)) {
    categoriesArray = data;
  } else if (data.categories && Array.isArray(data.categories)) {
    categoriesArray = data.categories;
  }
  
  // Mappa kategorier
  const mappedCategories: Category[] = categoriesArray.map((cat: any) => {
    const categoryId = cat.id || cat._id || cat.categoryId;
    const categoryName = cat.name || cat.title || cat.categoryName || '';
    const categorySlug = cat.slug || generateSlug(categoryName, categoryId);
    
    // Mappa subkategorier om de finns
    const mappedSubcategories = cat.subcategories?.map((sub: any) => ({
      id: sub.id || sub._id,
      slug: sub.slug || generateSlug(sub.name || sub.title, sub.id),
      name: sub.name || sub.title,
      description: sub.description,
      icon: sub.icon || 'sparkles',
      imageUrl: sub.imageUrl || sub.image
    }));
    
    return {
      id: categoryId,
      slug: categorySlug,
      name: categoryName,
      description: cat.description || cat.desc,
      icon: cat.icon || 'sparkles',
      imageUrl: cat.imageUrl || cat.image_url || cat.image,
      parentId: cat.parentId || cat.parent_id,
      subcategories: mappedSubcategories,
      productCount: cat.productCount || cat.product_count || cat.count
    };
  });
  
  return mappedCategories.filter(cat => !!(cat.id && cat.name && cat.slug));
}
```

#### 5.3 Kategorinavigation

**Fil:** `components/CategoryNavigation.tsx`

**Funktionalitet:**
- Visar kategorier i navigation
- Stödjer expanderbara subkategorier
- Highlightar aktiv kategori

**Implementation:**
```typescript
export default function CategoryNavigation() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch('/api/storefront/categories', {
          cache: 'no-store'
        });
        const data = await response.json();
        if (data.success && data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);
  
  // Render kategorier med subkategorier
  // ...
}
```

**API Endpoint:** `GET /api/storefront/categories`

**Fil:** `app/api/storefront/categories/route.ts`

```typescript
import { getCategories } from '@/lib/catalog';

export async function GET() {
  const categories = await getCategories('sv');
  return NextResponse.json({
    success: true,
    categories
  });
}
```

#### 5.4 Kategorisidor

**Fil:** `app/webshop/[slug]/page.tsx`

**Funktionalitet:**
- Visar produkter i en kategori
- Stödjer subkategorier
- Paginering

**Implementation:**
```typescript
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Hämta kategorier
  const categories = await getCategories('sv');
  const category = categories.find(cat => cat.slug === slug);
  
  if (!category) {
    return <div>Category not found</div>;
  }
  
  // Hämta produkter för kategorin
  const { items: products } = await getProducts({
    category: category.id,
    locale: 'sv'
  });
  
  return (
    <>
      <CategoryNavigation />
      <CategoryPageClient 
        category={category}
        products={products}
        slug={slug}
      />
    </>
  );
}
```

---

## 6. Storefront

### Översikt

Storefront är huvudgränssnittet där kunder kan bläddra produkter, kategorier och lägga produkter i varukorgen.

### Implementation

#### 6.1 Storefront API Wrapper

**Fil:** `lib/inventory-storefront.ts`

**Funktioner:**
- `getProductFromStorefront()` - Hämta enskild produkt med inventory
- `getVariantByPriceId()` - Hämta variant via Stripe Price ID
- `getAllProductsFromStorefront()` - Hämta alla produkter

**Implementation:**
```typescript
export async function getProductFromStorefront(
  productId: string,
  options?: { revalidate?: number; tags?: string[] }
): Promise<StorefrontProduct | null> {
  const response = await sourceFetch(
    `/storefront/${TENANT_ID}/product/${productId}`,
    {
      headers: { 'X-Tenant': TENANT_ID },
      next: {
        revalidate: options?.revalidate ?? 60,
        tags: options?.tags || [`product:${productId}`]
      }
    }
  );
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  
  if (data.success && data.product) {
    return data.product;
  }
  
  return null;
}

export async function getVariantByPriceId(
  stripePriceId: string,
  productId?: string
): Promise<(StorefrontVariant & { productId: string; productName: string }) | null> {
  // Försök variant endpoint först
  const variantResponse = await sourceFetch(
    `/storefront/${TENANT_ID}/variant/${stripePriceId}`,
    {
      headers: { 'X-Tenant': TENANT_ID },
      cache: 'no-store'
    }
  );
  
  if (variantResponse.ok) {
    const variantData = await variantResponse.json();
    if (variantData.success && variantData.variant) {
      return {
        ...variantData.variant,
        productId: variantData.variant.productId || productId || '',
        productName: variantData.variant.productName || ''
      };
    }
  }
  
  // Fallback: Sök genom produkter
  if (productId) {
    const product = await getProductFromStorefront(productId, { revalidate: 0 });
    if (product?.variants) {
      const variant = product.variants.find(v => v.stripePriceId === stripePriceId);
      if (variant) {
        return {
          ...variant,
          productId: product.id,
          productName: product.title || product.name
        };
      }
    }
  }
  
  return null;
}
```

#### 6.2 Produktvisning

**Fil:** `components/ProductCard.tsx` och `components/ProductCardWithCampaign.tsx`

**Funktionalitet:**
- Visar produktkort med bild, namn, pris
- Visar kampanjpriser om tillgängligt
- Länkar till produktsida

**Implementation:**
```typescript
export default function ProductCardWithCampaign({ product, slug, idx }: ProductCardWithCampaignProps) {
  // Hämta kampanjpris om tillgängligt
  const [campaignPrice, setCampaignPrice] = useState<number | null>(null);
  
  useEffect(() => {
    if (product.stripeProductId) {
      // Kontrollera kampanjpris
      fetch(`/api/campaigns/price/${product.stripeProductId}`)
        .then(res => res.json())
        .then(data => {
          if (data.hasCampaignPrice && data.priceId) {
            // Hämta pris från Stripe eller API
            setCampaignPrice(data.campaignPrice);
          }
        });
    }
  }, [product.stripeProductId]);
  
  const displayPrice = campaignPrice || product.price || 0;
  const hasCampaign = !!campaignPrice;
  
  return (
    <Link href={`/webshop/${slug}/${product.id}`}>
      <div className="product-card">
        <img src={product.images?.[0]} alt={product.name} />
        <h3>{product.name}</h3>
        {hasCampaign && (
          <div className="campaign-badge">Kampanj</div>
        )}
        <div className="price">
          {hasCampaign && (
            <span className="original-price">{product.price} kr</span>
          )}
          <span className="current-price">{displayPrice} kr</span>
        </div>
      </div>
    </Link>
  );
}
```

#### 6.3 Produktsida

**Fil:** `app/webshop/[slug]/[id]/page.tsx`

**Funktionalitet:**
- Visar produktdetaljer
- Variantval (storlek, färg)
- Lägg i varukorg-knapp
- Inventory-status

**Implementation:**
```typescript
export default async function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string; id: string }> 
}) {
  const { slug, id } = await params;
  
  // Hämta produkt
  const product = await getProduct(id, 'sv');
  
  if (!product) {
    return <div>Product not found</div>;
  }
  
  // Hämta kategori
  const categories = await getCategories('sv');
  const category = categories.find(cat => cat.slug === slug);
  
  return (
    <>
      <CategoryNavigation />
      <ProductDetailClient 
        product={product}
        category={category}
      />
    </>
  );
}
```

---

## 7. Checkout

### Översikt

Checkout-flödet hanterar hela köpprocessen från varukorg till Stripe Checkout. Det inkluderar inventory-validering, kampanjpriskontroll, presentkortshantering och anrop till backend för att skapa Stripe Connect checkout session.

### Implementation

#### 7.1 Varukorg

**Fil:** `app/cart/page.tsx`

**Funktionalitet:**
- Visar produkter i varukorgen
- Uppdatera kvantitet
- Ta bort produkter
- Presentkortsverifiering
- Checkout-initiering

**Implementation:**
```typescript
export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCart();
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardVerified, setGiftCardVerified] = useState<{
    valid: boolean;
    balance?: number;
    balanceInCents?: number;
  } | null>(null);
  
  // Verifiera presentkort
  async function handleVerifyGiftCard() {
    const formattedCode = giftCardCode.toUpperCase().trim();
    
    const response = await fetch('/api/gift-cards/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: formattedCode })
    });
    
    const data = await response.json();
    
    if (data.valid) {
      const balanceInSEK = (data.balance || 0) / 100;
      setGiftCardVerified({
        valid: true,
        balance: balanceInSEK,
        balanceInCents: data.balance
      });
    } else {
      setGiftCardError(data.error || 'Invalid gift card code');
    }
  }
  
  // Initiera checkout
  async function handleCheckout() {
    if (items.length === 0) return;
    
    // Kontrollera inventory
    for (const item of items) {
      const res = await fetch(`/api/inventory/status?productId=${encodeURIComponent(item.product.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.outOfStock) {
          alert(`${item.product.name} är slutsåld`);
          return;
        }
      }
    }
    
    // Förbered presentkortskod
    const giftCardCodeToSend = giftCardVerified?.valid 
      ? giftCardCode.toUpperCase().trim() 
      : undefined;
    
    // Skapa checkout
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((item) => ({
          quantity: item.quantity,
          stripePriceId: item.product.variantPriceId || item.product.stripePriceId,
          productId: item.product.id,
          variantKey: item.product.variantKey
        })),
        giftCardCode: giftCardCodeToSend,
        successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: window.location.href,
        metadata: {
          ...(giftCardCodeToSend && { giftCardCode: giftCardCodeToSend })
        }
      })
    });
    
    const data = await response.json();
    
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Kunde inte skapa checkout');
    }
  }
  
  return (
    <div className="cart-page">
      {/* Varukorgsprodukter */}
      {items.map(item => (
        <CartItem 
          key={item.product.id}
          item={item}
          onUpdateQuantity={updateQuantity}
          onRemove={removeItem}
        />
      ))}
      
      {/* Presentkort */}
      <div className="gift-card-section">
        <input
          type="text"
          value={giftCardCode}
          onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
          placeholder="Presentkortskod"
        />
        <button onClick={handleVerifyGiftCard}>
          Verifiera
        </button>
        {giftCardVerified?.valid && (
          <div className="gift-card-info">
            Saldo: {giftCardVerified.balance} SEK
          </div>
        )}
      </div>
      
      {/* Checkout-knapp */}
      <button onClick={handleCheckout}>
        Gå till kassan
      </button>
    </div>
  );
}
```

#### 7.2 Checkout Success Page

**Fil:** `app/checkout/success/page.tsx`

**Funktionalitet:**
- Visar bekräftelse efter lyckat köp
- Visar order-ID om tillgängligt
- Länk tillbaka till webshop

**Implementation:**
```typescript
export default function CheckoutSuccessPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ session_id?: string }> 
}) {
  const params = await searchParams;
  const sessionId = params.session_id;
  
  return (
    <div className="checkout-success">
      <h1>Tack för ditt köp!</h1>
      {sessionId && (
        <p>Order-ID: {sessionId}</p>
      )}
      <Link href="/webshop">
        Tillbaka till webshop
      </Link>
    </div>
  );
}
```

#### 7.3 Buy Now Button

**Fil:** `components/BuyNowButton.tsx`

**Funktionalitet:**
- Direktköp från produktsida
- Variantval
- Inventory-kontroll
- Checkout-initiering

**Implementation:**
```typescript
export default function BuyNowButton({ product, onVariantChange }: BuyNowButtonProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  
  // Kontrollera inventory för vald variant
  const variantOutOfStock = selectedVariant?.outOfStock || 
    selectedVariant?.status === 'out_of_stock' || 
    selectedVariant?.inStock === false;
  
  async function handleBuyNow() {
    if (!selectedVariant) {
      alert('Välj storlek och färg');
      return;
    }
    
    if (variantOutOfStock) {
      alert('Denna variant är slutsåld');
      return;
    }
    
    setCheckingOut(true);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            quantity: 1,
            stripePriceId: selectedVariant.stripePriceId,
            productId: product.id,
            variantKey: selectedVariant.key
          }],
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.href
        })
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      alert('Kunde inte skapa checkout');
    } finally {
      setCheckingOut(false);
    }
  }
  
  return (
    <button 
      onClick={handleBuyNow}
      disabled={!selectedVariant || variantOutOfStock || checkingOut}
    >
      {checkingOut ? 'Bearbetar...' : 'Köp nu'}
    </button>
  );
}
```

---

## 8. Kundmeddelanden Integration

### Översikt

Kundmeddelanden kan skickas från hemsidan till kundportalen via två metoder: frontend (kontaktformulär med CSRF-token) eller backend (webhook med HMAC-signatur). Meddelanden visas i kundportalen under **"Kunder" → "Kundmeddelanden"**.

### Arkitektur

```
Frontend (Kontaktformulär)
    ↓
GET /api/auth/csrf (Hämta CSRF-token)
    ↓
POST /api/messages (Skicka meddelande)
    ↓
Source Portal Backend
    ↓
Kundportalen (Kunder → Kundmeddelanden)

ELLER

Backend (Webhook)
    ↓
POST /webhooks/messages (Med HMAC-signatur)
    ↓
Source Portal Backend
    ↓
Kundportalen (Kunder → Kundmeddelanden)
```

### Implementation

#### 8.1 Frontend Integration (Kontaktformulär)

**Användningsfall:** Kontaktformulär på hemsidan där kunder kan skicka meddelanden direkt.

**Steg 1: Hämta CSRF-token**

```typescript
const csrfResponse = await fetch('https://source-database.onrender.com/api/auth/csrf', {
  credentials: 'include'
});

if (!csrfResponse.ok) {
  throw new Error('Kunde inte hämta CSRF-token');
}

const { csrfToken } = await csrfResponse.json();
```

**Steg 2: Skicka meddelande**

```typescript
const response = await fetch('https://source-database.onrender.com/api/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
    'X-Tenant': 'ditt-tenant-namn' // ✅ Använd ditt exakta tenant-värde
  },
  credentials: 'include',
  body: JSON.stringify({
    tenant: 'ditt-tenant-namn', // ✅ Använd ditt exakta tenant-värde
    name: formData.name,
    email: formData.email,
    phone: formData.phone || '',
    subject: formData.subject || 'Kontaktformulär',
    message: formData.message,
    company: '' // ✅ Honeypot (måste vara tomt)
  })
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.message || 'Kunde inte skicka meddelande');
}

const result = await response.json();
```

**Komplett Exempel (React Component):**

```typescript
'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    company: '' // Honeypot
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const TENANT_NAME = 'ditt-tenant-namn'; // Ersätt med ditt tenant-värde

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Honeypot-validering
    if (formData.company !== '') {
      return; // Bot detected, silently fail
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Hämta CSRF-token
      const csrfResponse = await fetch('https://source-database.onrender.com/api/auth/csrf', {
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Kunde inte hämta CSRF-token');
      }

      const { csrfToken } = await csrfResponse.json();

      // 2. Skicka meddelande
      const response = await fetch('https://source-database.onrender.com/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'X-Tenant': TENANT_NAME
        },
        credentials: 'include',
        body: JSON.stringify({
          tenant: TENANT_NAME,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          subject: formData.subject || 'Kontaktformulär',
          message: formData.message,
          company: '' // Honeypot
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kunde inte skicka meddelande');
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        company: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">Meddelandet skickades!</div>}
      
      <input
        type="text"
        placeholder="Namn"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      
      <input
        type="email"
        placeholder="E-post"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      
      <input
        type="tel"
        placeholder="Telefon (valfritt)"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
      />
      
      <input
        type="text"
        placeholder="Ämne (valfritt)"
        value={formData.subject}
        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
      />
      
      <textarea
        placeholder="Meddelande"
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        required
      />
      
      {/* Honeypot - dold för användare */}
      <input
        type="text"
        name="company"
        value={formData.company}
        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Skickar...' : 'Skicka'}
      </button>
    </form>
  );
}
```

#### 8.2 Backend Integration (Webhook med HMAC)

**Användningsfall:** Backend-tjänster som skickar meddelanden via webhook med HMAC-signatur för säkerhet.

**Implementation:**

```typescript
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET_MESSAGES; // Miljövariabel
const TENANT_NAME = 'ditt-tenant-namn'; // Ersätt med ditt tenant-värde

async function sendCustomerMessage(messageData: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  // 1. Skapa payload
  const payload = JSON.stringify({
    tenant: TENANT_NAME,
    name: messageData.name,
    email: messageData.email,
    phone: messageData.phone || '',
    subject: messageData.subject || 'Kontaktformulär',
    message: messageData.message
  });

  // 2. Skapa HMAC-signatur
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload, 'utf8')
    .digest('hex');

  // 3. Skicka till webhook endpoint
  const response = await fetch('https://source-database.onrender.com/webhooks/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': `sha256=${signature}`,
      'X-Tenant': TENANT_NAME
    },
    body: payload
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Kunde inte skicka meddelande');
  }

  return await response.json();
}

// Exempel: Användning i API route
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const result = await sendCustomerMessage({
      name: body.name,
      email: body.email,
      phone: body.phone,
      subject: body.subject,
      message: body.message
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

**Miljövariabel:**

```env
WEBHOOK_SECRET_MESSAGES=your_webhook_secret_here
```

#### 8.3 API Endpoints

**Frontend Endpoint:**

- **URL:** `POST https://source-database.onrender.com/api/messages`
- **Headers:**
  - `Content-Type: application/json`
  - `X-CSRF-Token: {csrfToken}` (från `/api/auth/csrf`)
  - `X-Tenant: {tenantName}` (exakt match, case-sensitive)
  - `credentials: 'include'` (för cookies)
- **Body:**
  ```typescript
  {
    tenant: string,        // Obligatoriskt - exakt tenant-värde
    email: string,         // Obligatoriskt
    message: string,       // Obligatoriskt
    name?: string,         // Valfritt
    phone?: string,        // Valfritt
    subject?: string,      // Valfritt (default: 'Kontaktformulär')
    company?: string       // Honeypot (måste vara tomt)
  }
  ```

**Backend Webhook Endpoint:**

- **URL:** `POST https://source-database.onrender.com/webhooks/messages`
- **Headers:**
  - `Content-Type: application/json`
  - `X-Signature: sha256={hmacSignature}` (HMAC SHA256)
  - `X-Tenant: {tenantName}` (exakt match, case-sensitive)
- **Body:** Samma som frontend endpoint
- **HMAC Signatur:** Skapas med `WEBHOOK_SECRET_MESSAGES` miljövariabel

**CSRF Token Endpoint:**

- **URL:** `GET https://source-database.onrender.com/api/auth/csrf`
- **Headers:** `credentials: 'include'`
- **Response:**
  ```typescript
  {
    csrfToken: string
  }
  ```

#### 8.4 Viktiga Implementationdetaljer

**Tenant-värde:**
- Måste matcha exakt (case-sensitive)
- Används både i header (`X-Tenant`) och i body (`tenant`)
- Kontrollera ditt exakta tenant-värde i kundportalen

**Obligatoriska fält:**
- `email` - E-postadress (valideras)
- `message` - Meddelandetext
- `tenant` - Tenant-värde (exakt match)

**Valfria fält:**
- `name` - Kundens namn
- `phone` - Telefonnummer
- `subject` - Ämne (default: 'Kontaktformulär' om inte angivet)

**Honeypot (Spam-skydd):**
- Fältet `company` används som honeypot
- Måste vara tomt (`''`)
- Om fältet innehåller värde, ignorera request (bot detected)
- Dölj fältet i UI med `display: 'none'` och `tabIndex={-1}`

**Felhantering:**
- Validera alla obligatoriska fält innan API-anrop
- Hantera CSRF-token fel gracefully
- Visa användarvänliga felmeddelanden
- Logga fel för debugging

**Säkerhet:**
- Frontend: Använd CSRF-token för att förhindra CSRF-attacker
- Backend: Använd HMAC-signatur för att verifiera webhook-autenticitet
- Validera all input på både frontend och backend
- Använd honeypot för att förhindra spam

#### 8.5 Meddelanden i Kundportalen

Meddelanden som skickas via dessa endpoints visas automatiskt i kundportalen under:
- **"Kunder" → "Kundmeddelanden"**

Varje meddelande innehåller:
- Kundens namn (om angivet)
- E-postadress
- Telefonnummer (om angivet)
- Ämne
- Meddelandetext
- Tidsstämpel

---

## 9. Sammanfattning och Checklista

### Miljövariabler som krävs:

```env
SOURCE_DATABASE_URL=https://source-database-809785351172.europe-north1.run.app
SOURCE_TENANT_ID=your_tenant_id
FRONTEND_API_KEY=your_api_key
NEXT_PUBLIC_BASE_URL=https://your-website.com
WEBHOOK_SECRET_MESSAGES=your_webhook_secret_here  # För backend webhook integration
```

### API Endpoints som måste implementeras:

#### Tenant Backend:
- `POST /api/checkout` - Checkout endpoint
- `POST /api/gift-cards/verify` - Presentkortsverifiering
- `POST /api/campaigns/sync` - Kampanjsynkronisering
- `POST /api/campaigns/webhook` - Kampanjwebhook
- `POST /api/inventory/sync` - Inventory-synkronisering
- `GET /api/storefront/categories` - Hämta kategorier
- `POST /api/messages` - Skicka kundmeddelande (frontend)

#### Source Portal Backend:
- `POST /storefront/{tenant}/checkout` - Stripe Connect checkout
- `POST /api/storefront/{tenant}/giftcards/verify` - Presentkortsverifiering
- `GET /storefront/{tenant}/products` - Hämta produkter
- `GET /storefront/{tenant}/product/{id}` - Hämta enskild produkt
- `GET /storefront/{tenant}/categories` - Hämta kategorier
- `GET /api/campaigns/price/{productId}` - Hämta kampanjpris
- `POST /v1/campaign-prices` - Lagra kampanjpris
- `GET /api/tenants/{tenantId}/config` - Hämta tenant-konfiguration
- `GET /api/auth/csrf` - Hämta CSRF-token (för kundmeddelanden)
- `POST /api/messages` - Skicka kundmeddelande (frontend)
- `POST /webhooks/messages` - Skicka kundmeddelande (backend webhook)

### Viktiga Implementationpunkter:

1. **Stripe Connect**: Använd alltid backend endpoint, skapa INTE Stripe sessions direkt från frontend
2. **Presentkort**: Verifiera i frontend (read-only), gör INTE inlösen - det sker server-side
3. **Kampanjer**: Synkronisera via webhooks och sync endpoints, använd `stripePriceIds` från Stripe Connect account
4. **Inventory**: Validera alltid innan checkout, använd Storefront API för tillförlitlig data
5. **Priser**: Alla priser från API är i öre, konvertera till SEK för visning (dividera med 100)
6. **Metadata**: Inkludera alltid `tenant`, `source` och relevant metadata i checkout requests
7. **Error Handling**: Hantera alla API-fel gracefully, visa användarvänliga felmeddelanden
8. **Kundmeddelanden**: Använd CSRF-token för frontend eller HMAC-signatur för backend webhooks, tenant-värde måste matcha exakt (case-sensitive)

### Testning:

1. Testa checkout med vanliga produkter
2. Testa checkout med kampanjpriser
3. Testa presentkortsverifiering och användning
4. Testa presentkortsköp
5. Testa inventory-validering (blockera checkout om slutsåld)
6. Testa kategorier och produktsynkronisering
7. Testa kampanjsynkronisering via webhooks
8. Testa kundmeddelanden via kontaktformulär (frontend med CSRF)
9. Testa kundmeddelanden via webhook (backend med HMAC)
10. Verifiera att meddelanden visas i kundportalen

---

## 10. Ytterligare Resurser

- **Stripe Connect Documentation**: https://stripe.com/docs/connect
- **Stripe Checkout**: https://stripe.com/docs/payments/checkout
- **Next.js App Router**: https://nextjs.org/docs/app

---

**Dokument skapat:** 2025-01-XX  
**Version:** 1.0  
**För:** Ny tenant implementation


