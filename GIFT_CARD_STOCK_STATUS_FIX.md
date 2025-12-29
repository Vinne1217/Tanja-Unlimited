# Gift Card Stock Status Fix

## Issue

Frontend code was checking `stock === 0` or `stock <= 0` to determine if products were out of stock. This incorrectly showed gift cards as out of stock since gift cards have `stock: 0` or `stock: null` but should always be available (`inStock: true`, `outOfStock: false`).

## Solution

Updated all frontend components to use API flags (`outOfStock`, `inStock`, `status`) instead of raw stock values for determining availability.

## Files Fixed

### 1. `components/BuyNowButton.tsx`
**Changes:**
- Removed `stock <= 0` checks from variant availability logic
- Now uses: `outOfStock || status === 'out_of_stock' || inStock === false`
- Updated all variant stock checks to use API flags

**Before:**
```typescript
const variantOutOfStock = selectedVariantInventory.outOfStock || 
  (selectedVariantInventory.stock !== null && selectedVariantInventory.stock <= 0) || 
  selectedVariantInventory.status === 'out_of_stock'
```

**After:**
```typescript
const variantOutOfStock = selectedVariantInventory.outOfStock || 
  selectedVariantInventory.status === 'out_of_stock' || 
  selectedVariantInventory.inStock === false
```

### 2. `app/collection/[category]/[id]/purchase.tsx`
**Changes:**
- Removed `stock <= 0` checks from variant availability logic
- Now uses API flags exclusively

**Before:**
```typescript
const variantOutOfStock = selectedVariant.outOfStock || 
  selectedVariant.stock <= 0 || 
  selectedVariant.status === 'out_of_stock' || 
  selectedVariant.inStock === false
```

**After:**
```typescript
const variantOutOfStock = selectedVariant.outOfStock || 
  selectedVariant.status === 'out_of_stock' || 
  selectedVariant.inStock === false
```

### 3. `lib/catalog.ts`
**Changes:**
- Updated fallback logic for `outOfStock` and `inStock` flags
- Removed `stock === 0` or `stock <= 0` checks
- Now prioritizes API flags, then `status`, then infers from other flags

**Before:**
```typescript
outOfStock: v.outOfStock ?? (v.stock === 0 || v.stock <= 0 || v.inStock === false),
inStock: v.inStock ?? (v.stock > 0),
```

**After:**
```typescript
outOfStock: v.outOfStock ?? (v.status === 'out_of_stock' ? true : (v.inStock === false ? true : false)),
inStock: v.inStock ?? (v.status === 'in_stock' || v.status === 'low_stock' ? true : (v.outOfStock === false ? true : false)),
```

### 4. `components/StockStatus.tsx`
**Status:** ✅ Already correct
- Already uses `inventory.outOfStock` flag correctly
- Only uses `stock` for display purposes (low stock threshold), not for availability checks

## Verification

All instances of `stock <= 0` or `stock === 0` checks have been removed from frontend components. The remaining checks are:
- ✅ `app/api/checkout/route.ts` - Backend logic (skips gift cards anyway)
- ✅ `app/api/inventory/status/route.ts` - Backend API that calculates flags
- ✅ `lib/inventory.ts` - Backend utility functions

## Impact

**Before Fix:**
- Gift cards with `stock: 0` were incorrectly shown as "out of stock"
- Users couldn't purchase gift cards

**After Fix:**
- Gift cards correctly show as "in stock" based on API flags
- Users can purchase gift cards regardless of stock value
- All products use consistent API flag-based availability checks

## Testing

To verify the fix works:
1. Ensure backend API returns correct flags for gift cards:
   - `outOfStock: false`
   - `inStock: true`
   - `status: 'in_stock'`
   - `stock: 0` or `stock: null` (doesn't matter)
2. Check frontend displays gift cards as available
3. Verify gift cards can be added to cart
4. Verify gift cards can be purchased

## Related

This fix complements the gift card checkout implementation. The backend should ensure gift cards always have:
- `outOfStock: false`
- `inStock: true`
- `status: 'in_stock'`

regardless of the `stock` value.

