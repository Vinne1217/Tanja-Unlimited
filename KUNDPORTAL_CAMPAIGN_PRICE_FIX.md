# Problem: Kampanjpriser visas inte i produktöversikten

## Sammanfattning

Kampanjpriser fungerar korrekt på **produktsidan** men visas inte i **produktöversikten** (list-vyn). Orsaken är att list-API:t (`/storefront/:tenant/products`) inte returnerar `stripeProductId` och `variants[].stripePriceId`, vilket gör att frontend skickar fel produkt-ID till kampanj-API:t.

## Problembeskrivning

### Vad som fungerar (produktsidan)

På produktsidan (`/storefront/:tenant/product/:productId`) får vi:
```json
{
  "success": true,
  "product": {
    "baseSku": "the-unlimited-jacket-mm90bbwj",
    "stripeProductId": "prod_U5PBz4yUYO77dv",  // ✅ Stripe Product ID finns
    "variants": [
      {
        "articleNumber": "TheUJ-S",
        "stripePriceId": "price_1T6TFn1fkdOqt85x86tGpC59",  // ✅ Stripe Price ID finns
        "priceSEK": 50000
      }
    ]
  }
}
```

Frontend skickar dessa Stripe-ID:n till kampanj-API:t → kampanjen hittas → kampanjpriset visas ✅

### Vad som inte fungerar (produktöversikten)

I produktöversikten (`/storefront/:tenant/products?category=...`) får vi:
```json
{
  "success": true,
  "products": [
    {
      "baseSku": "the-unlimited-jacket-mm90bbwj",
      "stripeProductId": null,  // ❌ Saknas eller är null
      "variants": [
        {
          "articleNumber": "TheUJ-S",
          "stripePriceId": null,  // ❌ Saknas eller är null
          "priceSEK": 50000
        }
      ]
    }
  ]
}
```

Frontend skickar `productId = "the-unlimited-jacket-mm90bbwj"` (slug/baseSku) till kampanj-API:t → kampanjen hittas inte → kampanjpriset visas inte ❌

## Varför kampanjen inte hittas

Från MongoDB-dokumentet ser vi att kampanjen är kopplad till:
```json
{
  "products": ["prod_U5PBz4yUYO77dv"],  // Stripe Product ID
  "stripePriceIds": [
    "price_1T7Eln1fkdOqt85x3E1D5K3T",
    "price_1T7Eln1fkdOqt85xUESrb6u6",
    "price_1T7Elo1fkdOqt85xZ5oMi9Kj"
  ]
}
```

Kampanj-API:t söker efter kampanjer där `products` array innehåller det `productId` som skickas. När frontend skickar `"the-unlimited-jacket-mm90bbwj"` (slug) istället för `"prod_U5PBz4yUYO77dv"` (Stripe Product ID), hittar API:t ingen match.

## Loggar som bekräftar problemet

**Kundportalens loggar:**
```
🔍 [CAMPAIGN PRICE API] Request: {
  tenantId: 'tanjaunlimited',
  productId: 'the-unlimited-jacket-mm90bbwj',  // ❌ Slug, inte Stripe Product ID
  originalPriceId: 'none',  // ❌ Ingen Stripe Price ID
  ...
}
🔍 [CAMPAIGN PRICE API] Found 0 campaigns with product the-unlimited-jacket-mm90bbwj
```

**Tanjas loggar:**
```
📦 Campaign API: Source Portal response status: 200
📊 Campaign API: hasCampaignPrice = false
ℹ️ Campaign API: No campaign found in Source Portal for the-unlimited-jacket-mm90bbwj
```

## Lösning

List-API:t (`/storefront/:tenant/products`) måste returnera **samma** `stripeProductId` och `variants[].stripePriceId` som detalj-API:t (`/storefront/:tenant/product/:productId`).

### Exempel på korrekt list-svar

```json
{
  "success": true,
  "products": [
    {
      "baseSku": "the-unlimited-jacket-mm90bbwj",
      "stripeProductId": "prod_U5PBz4yUYO77dv",  // ✅ Måste finnas (inte null)
      "variants": [
        {
          "articleNumber": "TheUJ-S",
          "stripePriceId": "price_1T6TFn1fkdOqt85x86tGpC59",  // ✅ Måste finnas (inte null)
          "priceSEK": 50000
        },
        {
          "articleNumber": "TheUJ-M",
          "stripePriceId": "price_1T6TFn1fkdOqt85xIZ8U7pgh",  // ✅ Måste finnas (inte null)
          "priceSEK": 50000
        }
      ]
    },
    {
      "baseSku": "long-jacket-cotton-f-mmc054f0",
      "stripeProductId": "prod_U5PBz4yUYO77dv",  // ✅ Måste finnas (inte null)
      "variants": [
        {
          "articleNumber": "LJCfilG-ONESIZE-Gold",
          "stripePriceId": "price_...",  // ✅ Måste finnas (inte null)
          "priceSEK": 1440000
        }
      ]
    }
  ]
}
```

### Vad som behöver fixas

1. **Säkerställ att `stripeProductId` alltid returneras** i list-svaret (inte `null`, inte `undefined`)
   - Om produkten saknar `stripeProductId` i databasen, måste den hämtas från Stripe eller från produktens metadata
   - Om det inte går att hämta, bör det loggas som ett fel

2. **Säkerställ att `variants[].stripePriceId` alltid returneras** i list-svaret (inte `null`, inte `undefined`)
   - Varje variant måste ha sitt `stripePriceId` från Stripe
   - Om varianten saknar `stripePriceId` i databasen, måste den hämtas från Stripe

3. **Verifiera att dessa värden matchar** de Stripe-ID:n som används i kampanjerna
   - Kampanjer är kopplade till `products: ["prod_..."]` (Stripe Product IDs)
   - Kampanjer är kopplade till `stripePriceIds: ["price_..."]` (Stripe Price IDs)
   - List-API:t måste returnera exakt samma ID:n

## Testkommando för verifiering

För att verifiera att list-API:t returnerar korrekt data:

```bash
curl "https://source-database-809785351172.europe-north1.run.app/storefront/tanjaunlimited/products?category=klader" \
  -H "X-Tenant: tanjaunlimited" \
  | jq '.products[] | select(.baseSku=="the-unlimited-jacket-mm90bbwj" or .baseSku=="long-jacket-cotton-f-mmc054f0") | {
    baseSku,
    stripeProductId,
    variants: [.variants[] | {articleNumber, stripePriceId, priceSEK}]
  }'
```

Detta ska returnera:
- `stripeProductId` som är ett Stripe Product ID (`prod_...`)
- `variants[].stripePriceId` som är Stripe Price IDs (`price_...`)
- **Inte** `null` eller `undefined`

## När detta är fixat

När list-API:t returnerar korrekt `stripeProductId` och `variants[].stripePriceId` kommer frontend automatiskt att:
1. Använda `stripeProductId` istället för slug när den anropar kampanj-API:t
2. Använda rätt `stripePriceId` för varianten när den anropar kampanj-API:t
3. Hitta kampanjen korrekt → kampanjpriset visas i produktöversikten ✅

## Ytterligare information

- Frontend har redan logik för att använda `stripeProductId` och `variants[].stripePriceId` när de finns
- Frontend har en fallback som försöker hämta `stripeProductId` från detalj-API:t om det saknas i list-svaret, men detta är inte optimalt (extra API-anrop)
- Den optimala lösningen är att list-API:t returnerar dessa fält direkt, precis som detalj-API:t gör
