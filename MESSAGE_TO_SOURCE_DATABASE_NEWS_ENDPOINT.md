# Meddelande till Source Database Team - News Endpoint på Google Cloud Run

Hej Source Database Team!

Vi har implementerat en ny funktion för att visa nyheter på Tanja Unlimited-webbplatsen och behöver bekräfta att `/public/news` endpointen är tillgänglig på er Google Cloud Run-instans.

## Situation

Vi har uppdaterat vår kod för att använda Google Cloud Run-URL istället för Render.com:

**Före:**
```
GET https://source-database.onrender.com/public/news
```

**Nu:**
```
GET https://source-database-809785351172.europe-north1.run.app/public/news
```

## Vad vi behöver bekräfta

### 1. Finns `/public/news` endpointen på Google Cloud Run?

Vi behöver bekräfta att endpointen finns på:
```
https://source-database-809785351172.europe-north1.run.app/public/news
```

**Test-kommando:**
```bash
curl -X GET "https://source-database-809785351172.europe-north1.run.app/public/news" \
  -H "Authorization: Bearer <FRONTEND_API_KEY>"
```

**Förväntat svar:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "type": "info|alert|campaign",
      "title": "...",
      "body": "...",
      "startAt": "...",
      "endAt": "...",
      "published": true
    }
  ]
}
```

### 2. Autentisering och filtrering

Endpointen ska:
- ✅ Acceptera `Authorization: Bearer <FRONTEND_API_KEY>` header
- ✅ Automatiskt filtrera på tenant (`tanjaunlimited`)
- ✅ Endast returnera publicerade nyheter
- ✅ Endast returnera nyheter inom giltig period (`startAt` / `endAt`)

### 3. Om endpointen inte finns på Google Cloud Run

Om `/public/news` endpointen endast finns på Render.com och inte på Google Cloud Run, behöver vi antingen:

**Alternativ A:** Deploya endpointen till Google Cloud Run-instansen
- Samma funktionalitet som på Render.com
- Samma autentisering och filtrering

**Alternativ B:** Konfigurera en proxy/redirect från Google Cloud Run till Render.com
- Om ni vill behålla endpointen på Render.com
- Men vi behöver nå den via Google Cloud Run-URL:en

## Varför detta är viktigt

- ✅ Vi använder Google Cloud Run för alla andra API-anrop (produkter, kategorier, etc.)
- ✅ Konsistent URL-struktur gör det enklare att hantera
- ✅ Undviker timeout-problem när vi försöker nå Render.com från Google Cloud Run
- ✅ Bättre prestanda när allt körs på samma plattform

## Nuvarande implementation

Vår kod använder nu:
```typescript
import { SOURCE_BASE } from './source';
const PUBLIC_NEWS_API_URL = `${SOURCE_BASE}/public/news`;
```

Där `SOURCE_BASE` är:
```
https://source-database-809785351172.europe-north1.run.app
```

## Nästa steg

1. **Testa om endpointen finns** på Google Cloud Run-instansen
2. **Bekräfta autentisering** fungerar med `FRONTEND_API_KEY`
3. **Låt oss veta** om endpointen behöver deployas eller om den redan finns

Tack för er hjälp!

---

**Kontakt:**
- Tanja Unlimited Development Team
- Om ni behöver mer information om implementationen, se `NEWS_IMPLEMENTATION.md`

