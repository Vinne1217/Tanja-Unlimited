# News Feature Implementation

## Overview

The News feature allows displaying news items from the Source customer portal on the public website. Two components have been implemented:

1. **NewsBanner** - Shows the latest news as a banner at the top of all pages
2. **NewsSection** - Shows the latest 3 news items as cards on the landing page

## Configuration

### Environment Variable

The implementation uses the existing `FRONTEND_API_KEY` environment variable that is already configured in your Google Cloud environment. **No changes needed** - the API key is used server-side only and never exposed to the browser.

**Important:** The API key is accessed server-side only (no `NEXT_PUBLIC_` prefix needed), ensuring it's never exposed to client-side code.

### API Endpoint

The components fetch news from:
```
GET https://source-database-809785351172.europe-north1.run.app/public/news
Authorization: Bearer <FRONTEND_API_KEY>
```

**Note:** The endpoint uses the same `SOURCE_BASE` URL as other API calls (Google Cloud Run), configured via `SOURCE_DATABASE_URL` environment variable.

The API automatically filters:
- By tenant (configured in backend)
- Only published news items
- Only items within valid period (`startAt` / `endAt`)

## Components

### NewsBanner (`components/NewsBanner.tsx`)

- Displays the **latest news item** as a banner
- Positioned at the top of all pages (in `app/layout.tsx`)
- Automatically styled based on news type:
  - **Alert** (Varning): Red background (#fee2e2)
  - **Campaign** (Kampanj): Green background (#ecfdf5)
  - **Info** (default): Blue background (#eff6ff)
- Hidden if no news is available

### NewsSection (`components/NewsSection.tsx`)

- Displays the **latest 3 news items** as cards
- Positioned on the landing page (`app/page.tsx`)
- Grid layout (responsive: 1 column mobile, 2-3 columns desktop)
- Each card shows:
  - Type badge (colored based on type)
  - Title
  - Body text
- Hidden if no news is available

## Security

- All text rendering uses React's safe text rendering (no `innerHTML`)
- API key is read-only and domain-locked (configured in Source portal)
- **API key is never exposed to the browser** - all fetching happens server-side
- Backend sanitizes `<` and `>` characters
- Server-Side Rendering (SSR) ensures faster initial page load

## News Types

The system supports three news types:

- `alert` - Displays as "Varning" (Warning) with red styling
- `campaign` - Displays as "Kampanj" (Campaign) with green styling
- `info` - Displays as "Info" with blue styling (default)

## Usage

News items are managed in the **Source customer portal → Nyheter** section. Once published and within the valid date range, they will automatically appear on the website.

## Files Created/Modified

### New Files:
- `lib/news-types.ts` - TypeScript types for news API
- `lib/news.ts` - Server-side function to fetch news (uses `FRONTEND_API_KEY`)
- `components/NewsBanner.tsx` - Banner component (receives data as props)
- `components/NewsSection.tsx` - News section component (receives data as props)
- `app/HomePageClient.tsx` - Client component wrapper for homepage

### Modified Files:
- `app/layout.tsx` - Now async Server Component that fetches news and passes to NewsBanner
- `app/page.tsx` - Now async Server Component that fetches news and passes to HomePageClient

## Testing

To test the implementation:

1. Ensure `NEXT_PUBLIC_FRONTEND_API_KEY` is set in your environment
2. Create a news item in Source customer portal
3. Publish it and set appropriate dates
4. Verify it appears on the website:
   - Latest item should appear in the banner (all pages)
   - Up to 3 latest items should appear in the news section (landing page)

## Troubleshooting

- **Banner/Section not showing**: Check server logs for errors. Verify `FRONTEND_API_KEY` environment variable is set correctly in your Google Cloud environment.
- **401 Unauthorized**: Verify `FRONTEND_API_KEY` matches the frontend API key configured in Source portal. The correct API key is: `ek_live_e25c47c3ec2762a517213bb8feb51c2463367701bec73e89078a45d4f61247f0`
- **No news displayed**: Ensure news items are published and within valid date range in Source portal.
- **API key not found**: Ensure `FRONTEND_API_KEY` is set in your Google Cloud environment variables (not `NEXT_PUBLIC_FRONTEND_API_KEY`).

## ✅ Endpoint Status

**Confirmed:** The `/public/news` endpoint is working and available on Google Cloud Run:
- **URL:** `https://source-database-809785351172.europe-north1.run.app/public/news`
- **Status:** ✅ Tested and confirmed working
- **API Key:** Configured and verified

## Architecture

The implementation follows Next.js best practices:

1. **Server Components** (`app/layout.tsx`, `app/page.tsx`) - Fetch data server-side using `FRONTEND_API_KEY`
2. **Client Components** (`components/NewsBanner.tsx`, `components/NewsSection.tsx`) - Receive data as props and handle rendering/interactivity
3. **Server-side fetching** (`lib/news.ts`) - Centralized function that uses the secure `FRONTEND_API_KEY` environment variable

This architecture ensures:
- ✅ API key never exposed to browser
- ✅ Faster page loads (SSR)
- ✅ Better SEO (content rendered server-side)
- ✅ Secure credential handling

