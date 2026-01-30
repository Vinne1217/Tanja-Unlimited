# Meddelande till Source Portal Team - Kontaktformulär CSRF-problem

Hej Source Portal Team!

Vi har implementerat kontaktformulär enligt er specifikation, men får 403 Forbidden-fel när vi försöker skicka meddelanden till `/api/messages`.

## Problem

När vi försöker skicka meddelanden till:
```
POST https://source-database-809785351172.europe-north1.run.app/api/messages
```

Så får vi:
- **Status:** 403 Forbidden
- **Meddelande:** "Ogiltig eller saknad CSRF-token"

## Vår implementation

Vi följer er specifikation:
1. ✅ Hämtar CSRF-token från `/api/auth/csrf`
2. ✅ Inkluderar token i `X-CSRF-Token` header
3. ✅ Inkluderar `X-Tenant: tanjaunlimited` header
4. ✅ Skickar korrekt request body med alla fält
5. ✅ Validerar honeypot (company måste vara tomt)

## Vår kod

**Backend (Next.js API route):**
```typescript
// 1. Hämtar CSRF-token
const csrfResponse = await fetch(`${SOURCE_BASE}/api/auth/csrf`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
});
const csrfData = await csrfResponse.json();
const csrfToken = csrfData.csrfToken;

// 2. Skickar meddelande med CSRF-token
const res = await fetch(`${SOURCE_BASE}/api/messages`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
    'X-Tenant': 'tanjaunlimited'
  },
  body: JSON.stringify({
    tenant: 'tanjaunlimited',
    name: 'Kundens namn',
    email: 'kund@example.com',
    phone: '0701234567',
    subject: 'Kontaktformulär',
    message: 'Meddelandets innehåll',
    company: '' // Honeypot tomt
  })
});
```

## Frågor

1. **Kräver CSRF-token en session?**
   - När vi hämtar CSRF-token från server-sidan (server-till-server) skapas ingen session
   - När vi sedan försöker använda token så matchar den inte någon session
   - Fungerar CSRF-skydd endast för klient-till-server requests?

2. **Finns det ett alternativ för server-till-server requests?**
   - Kan vi använda en API-nyckel istället för CSRF-token?
   - Eller finns det en särskild endpoint för server-till-server requests?

3. **Kräver CSRF-token cookies/session?**
   - Om ja, hur ska vi hantera detta för server-till-server requests?
   - Behöver vi skicka cookies från klienten till vår backend och sedan vidare till er?

## Test

Vi kan testa med curl om ni vill:
```bash
# 1. Hämta CSRF-token
curl -X GET "https://source-database-809785351172.europe-north1.run.app/api/auth/csrf"

# 2. Skicka meddelande med token
curl -X POST "https://source-database-809785351172.europe-north1.run.app/api/messages" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token från steg 1>" \
  -H "X-Tenant: tanjaunlimited" \
  -d '{
    "tenant": "tanjaunlimited",
    "name": "Test User",
    "email": "test@example.com",
    "message": "Test message",
    "company": ""
  }'
```

## Loggar

Från våra server-loggarna ser vi:
- CSRF-token hämtas framgångsrikt (200 OK)
- Meddelandet skickas med korrekt headers
- Source Database returnerar 403 Forbidden

## Önskad lösning

Vi behöver antingen:
1. **Alternativ A:** Ett sätt att skicka meddelanden server-till-server utan CSRF-token (t.ex. med API-nyckel)
2. **Alternativ B:** Bekräftelse att CSRF-token fungerar för server-till-server requests och hjälp med att fixa vår implementation
3. **Alternativ C:** En proxy-endpoint på er sida som accepterar meddelanden från vår backend

Tack för er hjälp!

