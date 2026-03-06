# Campaign Routes PriceId Test

Detta test verifierar det nya `priceId`-flödet i `campaignRoutes.js` som prioriterar Stripe `priceId` över `productId`, samtidigt som bakåtkompatibilitet med det gamla `productId`-flödet behålls.

## Setup

1. **Kopiera testfilen till ditt Source Portal/Source Database projekt**
   ```bash
   cp __tests__/campaignRoutes.priceId.test.js <ditt-projekt>/__tests__/
   ```

2. **Installera Jest (om inte redan installerat)**
   ```bash
   npm install --save-dev jest @types/jest
   ```

3. **Uppdatera `package.json` med test-script**
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch"
     }
   }
   ```

4. **Skapa `jest.config.js`** (om det inte finns)
   ```javascript
   module.exports = {
     testEnvironment: 'node',
     testMatch: ['**/__tests__/**/*.test.js'],
     verbose: true
   };
   ```

5. **Anpassa import i testfilen**
   - Öppna `__tests__/campaignRoutes.priceId.test.js`
   - Uppdatera `beforeAll`-blocket med rätt import-syntax för ditt projekt:
     - **CommonJS**: `const campaignRoutes = require('../routes/campaignRoutes');`
     - **ES Modules**: `const campaignRoutes = await import('../routes/campaignRoutes.js');`

## Kör testet

```bash
npm test
```

eller för watch-mode:

```bash
npm run test:watch
```

## Vad testet verifierar

### ✅ priceId-flöde (nytt)
- Returnerar kampanj när `priceId` matchar aktiv kampanj
- Returnerar `hasCampaignPrice: false` när ingen kampanj hittas
- Respekterar `maxUses`-gränser
- Beräknar `discountPercent` korrekt för olika kampanjtyper
- Kräver `tenantId` (från header eller query)
- Accepterar `tenantId` från query-parameter

### ✅ Bakåtkompatibilitet
- Prioriterar `priceId` över `productId` när båda finns
- Legacy `productId`-flöde fungerar fortfarande

### ✅ Datumfiltrering
- Filtrerar bort kampanjer utanför datumintervall

## Teststruktur

Testet mockar:
- `Campaign`-modellen från `../models/Campaign`
- Request/Response-objekt för Express

Testet förväntar sig att `handleCampaignPriceRequest` är exporterad från `routes/campaignRoutes.js`.

## Anpassning

Om din filstruktur skiljer sig, uppdatera:
1. Mock-sökvägen: `jest.mock('../models/Campaign', ...)`
2. Import-sökvägen i `beforeAll`: `import('../routes/campaignRoutes.js')`

## Exempel på testresultat

```
PASS  __tests__/campaignRoutes.priceId.test.js
  Campaign Price API - priceId Flow
    priceId-based lookup (new flow)
      ✓ should return campaign when priceId matches active campaign
      ✓ should return hasCampaignPrice: false when no campaign found
      ✓ should return hasCampaignPrice: false when campaign exceeds maxUses
      ✓ should calculate discountPercent correctly for buy_two_get_one
      ✓ should require tenantId for priceId lookup
      ✓ should accept tenantId from query parameter
    Backwards compatibility - productId flow
      ✓ should prioritize priceId over productId when both are provided
    Date filtering
      ✓ should filter out campaigns outside date range

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```
