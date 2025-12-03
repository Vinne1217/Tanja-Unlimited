# Endpoint Test Results

**Date:** December 1, 2025  
**Tester:** Automated Testing

---

## ✅ Test Results Summary

### 1. Storefront Products Endpoint ✅ WORKING

**Endpoint:** `GET /storefront/tanjaunlimited/products`  
**Status:** ✅ **200 OK**  
**URL:** `https://source-database-809785351172.europe-north1.run.app/storefront/tanjaunlimited/products`

**Results:**
- ✅ Successfully returned 7 products
- ✅ Response format: `{ success: true, products: [...], categories: [...], meta: {...} }`
- ✅ Products include variants, prices, stock information
- ✅ All products have `baseSku`, `name`, `title`, `images`, `variants`, `priceRange`

**Products Found:**
1. A10001 - Long Jacket Cotton Fitted Diamond (A10001)
2. LJCkilS - Long Jacket Cotton knee imperial line Silver
3. NJCilW - Nehru Jacket Cotton imperial line White
4. SJCilW - Short jacket Cotton Imperial Line White
5. SJS - Short Jacket Silk
6. LJSf - Long Jacket Silk fitted
7. LJCfilG - Long Jacket Cotton fitted imperial line Gold

**Total:** 7 products, 13 variants

---

### 2. Catalog Products Endpoint ❌ NOT AVAILABLE

**Endpoint:** `GET /v1/tenants/tanjaunlimited/catalog/products`  
**Status:** ❌ **404 Not Found**  
**URL:** `https://source-database-809785351172.europe-north1.run.app/v1/tenants/tanjaunlimited/catalog/products`

**Results:**
- ❌ Endpoint does not exist
- ✅ **This is OK** - Our code has fallback logic, and storefront endpoint works

---

### 3. Storefront Categories Endpoint ❌ NOT AVAILABLE

**Endpoint:** `GET /storefront/tanjaunlimited/categories`  
**Status:** ❌ **404 Not Found**  
**URL:** `https://source-database-809785351172.europe-north1.run.app/storefront/tanjaunlimited/categories`

**Results:**
- ❌ Endpoint does not exist
- ✅ Categories are included in products response: `["Jackor"]`

---

## 📊 Response Format Analysis

### Storefront Products Response Format:

```json
{
  "success": true,
  "tenant": "tanjaunlimited",
  "generatedAt": "2025-12-01T08:41:21.207Z",
  "version": "v1",
  "products": [
    {
      "id": "SJS",
      "baseSku": "SJS",
      "name": "Short Jacket Silk (SJS)",
      "title": "Short Jacket Silk (SJS)",
      "description": null,
      "images": ["https://files.stripe.com/..."],
      "category": "Jackor",
      "isActive": true,
      "variants": [
        {
          "id": "SJS",
          "articleNumber": "SJS",
          "color": "Standard",
          "size": "Standard",
          "priceSEK": 219800,
          "stripePriceId": "price_1SXn8NP6vvUUervCl61Tt7QC",
          "stock": 75,
          "inStock": true,
          "imageUrl": "...",
          "status": "active"
        }
      ],
      "priceRange": {
        "min": 219800,
        "max": 219800
      },
      "inStock": true,
      "lowStock": false,
      "stripeProductId": "prod_TUhwHTMbcNO6LQ"
    }
  ],
  "categories": ["Jackor"],
  "meta": {
    "totalProducts": 7,
    "totalVariants": 13
  }
}
```

---

## ✅ Code Compatibility Check

### Our Code (`lib/catalog.ts`) Handles This Format:

✅ **Products Array:** Our code checks for `data.success && data.products`  
✅ **Product Mapping:** We can map `baseSku` → `id`, `title` → `name`  
✅ **Variants:** Variants are included in response  
✅ **Images:** Images array is available  
✅ **Price:** `priceRange.min` can be used for default price  

### Required Code Updates:

The storefront API uses different field names than catalog API:
- `baseSku` instead of `id` (but `id` also exists)
- `title` instead of `name` (but `name` also exists)
- `priceRange.min/max` instead of `price`
- `priceSEK` in variants (in cents)

**Our current code should handle this** because:
1. We check for `data.success && data.products` ✅
2. We return `data.products` as `items` ✅
3. Product objects have both `id` and `baseSku` ✅

---

## 🎯 Next Steps

1. ✅ **Storefront endpoint works** - Products are available
2. ✅ **Code is compatible** - Our fallback logic will use storefront
3. ⚠️ **Need to verify** - Website displays products correctly
4. ⚠️ **Need to test** - Product detail pages work with `baseSku`

---

## 🔍 Issues Found

### 1. Catalog Endpoint Doesn't Exist
- **Impact:** Low - Storefront endpoint works
- **Action:** None needed - fallback logic handles this

### 2. Categories Endpoint Doesn't Exist
- **Impact:** Low - Categories included in products response
- **Action:** Extract categories from products response

### 3. Price Format
- **Impact:** Medium - Prices are in cents (e.g., 219800 = 2198 SEK)
- **Action:** Ensure code divides by 100 when displaying prices

---

## ✅ Recommendations

1. **Use Storefront API** - It's working and returns all needed data
2. **Update `lib/catalog.ts`** - Ensure it properly maps storefront response format
3. **Test Website** - Verify products appear on `/webshop/tanja-jacket`
4. **Test Product Details** - Verify product detail pages work with `baseSku`

---

## 📝 Test Commands Used

```powershell
# Test Storefront Products
$headers = @{"X-Tenant"="tanjaunlimited"; "Content-Type"="application/json"}
Invoke-WebRequest -Uri "https://source-database-809785351172.europe-north1.run.app/storefront/tanjaunlimited/products" -Method GET -Headers $headers

# Test Catalog Products (Failed - 404)
Invoke-WebRequest -Uri "https://source-database-809785351172.europe-north1.run.app/v1/tenants/tanjaunlimited/catalog/products?locale=sv&limit=5" -Method GET -Headers $headers

# Test Categories (Failed - 404)
Invoke-WebRequest -Uri "https://source-database-809785351172.europe-north1.run.app/storefront/tanjaunlimited/categories?locale=sv" -Method GET -Headers $headers
```


