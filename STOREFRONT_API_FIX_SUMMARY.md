# Storefront API Fix Summary

## ✅ Changes Completed

All Render fallbacks have been removed and `SOURCE_DATABASE_URL` is now mandatory across the entire codebase.

## Files Modified

### 1. `lib/source.ts`
- ✅ Removed Render fallback: `'https://source-database.onrender.com'`
- ✅ Added `getSourceDatabaseUrl()` function that throws if `SOURCE_DATABASE_URL` is missing
- ✅ Updated tenant default from `'tanja'` to `'tanjaunlimited'` (consistent with frontend)
- ✅ Exported `getTenantId()` function for consistent tenant resolution

### 2. `lib/storefront.ts`
- ✅ Updated `getTenantId()` to handle client/server differences properly
- ✅ Consistent tenant ID resolution: `SOURCE_TENANT_ID` → `NEXT_PUBLIC_TENANT_ID` → `'tanjaunlimited'`
- ✅ No Render URL references (frontend calls Next.js API routes, not Source directly)

### 3. `app/api/storefront/[tenant]/products/route.ts`
- ✅ Removed Render fallback: `'https://source-database.onrender.com'`
- ✅ Added `getSourceDatabaseUrl()` function (throws if missing)
- ✅ Added comprehensive logging:
  - `[Storefront API] Fetching products from: {url}`
  - `[Storefront API] Tenant: {tenant}`
  - `[Storefront API] Response status: {status}`
  - `[Storefront API] Products received: {count}`
- ✅ Proper error handling: Returns `success: false` with error details instead of silent empty arrays
- ✅ Returns HTTP error status codes (502, etc.) instead of 200 with empty data

### 4. `app/api/storefront/[tenant]/product/[id]/route.ts`
- ✅ Removed Render fallback: `'https://source-database.onrender.com'`
- ✅ Added `getSourceDatabaseUrl()` function (throws if missing)
- ✅ Added comprehensive logging:
  - `[Storefront API] Fetching product from: {url}`
  - `[Storefront API] Tenant: {tenant}, Product ID: {id}`
  - `[Storefront API] Response status: {status}`
  - `[Storefront API] Product received: {id}`
- ✅ Proper error handling with detailed error messages

### 5. `app/api/analytics/route.ts`
- ✅ Removed Render fallback
- ✅ Added validation for `SOURCE_DATABASE_URL` (returns error if missing)

### 6. `app/api/webhooks/stripe/route.ts`
- ✅ Removed Render fallback
- ✅ Added validation for `SOURCE_DATABASE_URL` (returns error if missing)

## Key Improvements

### 1. **No Silent Failures**
**Before:**
```typescript
const sourceBase = process.env.SOURCE_DATABASE_URL ?? 'https://source-database.onrender.com';
// If missing, silently uses Render URL (which may be suspended)
```

**After:**
```typescript
function getSourceDatabaseUrl(): string {
  const url = process.env.SOURCE_DATABASE_URL;
  if (!url) {
    const error = 'SOURCE_DATABASE_URL environment variable is required...';
    console.error(`[Storefront API] ERROR: ${error}`);
    throw new Error(error);
  }
  return url;
}
```

### 2. **Proper Error Responses**
**Before:**
```typescript
if (!response.ok) {
  // Silently returns success: true with empty products
  return NextResponse.json({ success: true, products: [] });
}
```

**After:**
```typescript
if (!response.ok) {
  // Returns proper error response
  return NextResponse.json({
    success: false,
    error: 'Failed to fetch products from Source Database',
    status: response.status,
    statusText: response.statusText
  }, { status: response.status || 502 });
}
```

### 3. **Consistent Tenant ID**
**Before:**
- Backend: `SOURCE_TENANT_ID ?? 'tanja'`
- Frontend: `SOURCE_TENANT_ID || NEXT_PUBLIC_TENANT_ID || 'tanjaunlimited'`
- **Mismatch!**

**After:**
- Backend: `SOURCE_TENANT_ID || 'tanjaunlimited'`
- Frontend: `SOURCE_TENANT_ID || NEXT_PUBLIC_TENANT_ID || 'tanjaunlimited'`
- **Consistent!**

### 4. **Comprehensive Logging**
All Storefront API routes now log:
- Request URL being called
- Tenant ID being used
- Response status codes
- Product counts received
- Error details when failures occur

## Environment Variables Required

### Production (Google Cloud Run)
```env
SOURCE_DATABASE_URL=https://source-database-809785351172.europe-north1.run.app
SOURCE_TENANT_ID=tanjaunlimited
NEXT_PUBLIC_TENANT_ID=tanjaunlimited
```

### Local Development
```env
SOURCE_DATABASE_URL=https://source-database-809785351172.europe-north1.run.app
SOURCE_TENANT_ID=tanjaunlimited
NEXT_PUBLIC_TENANT_ID=tanjaunlimited
```

## Error Handling

### Missing SOURCE_DATABASE_URL
**Response:**
```json
{
  "success": false,
  "error": "SOURCE_DATABASE_URL missing",
  "message": "SOURCE_DATABASE_URL environment variable is required. Set it to your Google Cloud Run Source Database URL."
}
```
**HTTP Status:** `500`

### Source Database API Failure
**Response:**
```json
{
  "success": false,
  "error": "Failed to fetch products from Source Database",
  "status": 502,
  "statusText": "Bad Gateway",
  "details": "Error details from Source API"
}
```
**HTTP Status:** `502` (or actual status from Source API)

## Verification Steps

### 1. Test API Endpoint
```bash
curl https://your-domain.com/api/storefront/tanjaunlimited/products
```

**Expected:**
- If `SOURCE_DATABASE_URL` is set: Returns products or proper error
- If `SOURCE_DATABASE_URL` is missing: Returns `500` with error message

### 2. Check Server Logs
Look for:
```
[Storefront API] Fetching products from: https://source-database-809785351172.europe-north1.run.app/storefront/tanjaunlimited/products
[Storefront API] Tenant: tanjaunlimited
[Storefront API] Response status: 200 OK
[Storefront API] Products received: 42
```

### 3. Test Frontend
- Open `/webshop/tanja-jacket`
- Check browser console for errors
- Products should appear if Source Database is accessible

## Migration Notes

### Before Deployment
1. ✅ Set `SOURCE_DATABASE_URL` in Google Cloud Run environment variables
2. ✅ Set `SOURCE_TENANT_ID=tanjaunlimited` (or use default)
3. ✅ Set `NEXT_PUBLIC_TENANT_ID=tanjaunlimited` (for client-side)

### After Deployment
1. ✅ Check server logs for `[Storefront API]` messages
2. ✅ Verify products appear on category pages
3. ✅ Test error handling by temporarily removing `SOURCE_DATABASE_URL`

## Summary

✅ **No more Render fallbacks** - All removed  
✅ **No silent failures** - Clear error messages  
✅ **Consistent tenant ID** - `tanjaunlimited` everywhere  
✅ **Comprehensive logging** - Easy debugging  
✅ **Proper error responses** - HTTP status codes match errors  
✅ **Mandatory configuration** - Fails fast if misconfigured  

All Storefront API calls now **always** use Google Cloud Run Source Database URL.

