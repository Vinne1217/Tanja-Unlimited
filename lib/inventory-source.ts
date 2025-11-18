/**
 * Inventory Service - Source API Integration
 * Fetches inventory data directly from Source database (same pattern as campaigns)
 * No webhook needed - frontend queries Source API when needed
 */

import { SOURCE_BASE } from './source';

export type InventoryData = {
  productId: string;
  stock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lowStock: boolean;
  outOfStock: boolean;
  name?: string;
  sku?: string;
  lastUpdated?: string;
};

const TENANT_ID = 'tanjaunlimited';

/**
 * Get inventory status for a product from Source API
 * Uses the public inventory endpoint: /api/inventory/public/{tenantId}/{productId}
 * Returns null if no inventory data or if Source API is unavailable (fail gracefully)
 */
export async function getInventoryFromSource(
  productId: string
): Promise<InventoryData | null> {
  try {
    // Use the new public inventory endpoint
    // Endpoint: GET /api/inventory/public/{tenantId}/{productId}
    // Headers: Authorization: Bearer {apiKey} OR X-API-Key: {apiKey}
    const apiKey = process.env.FRONTEND_API_KEY || process.env.CUSTOMER_API_KEY;
    
    if (!apiKey) {
      console.warn(`⚠️  No API key configured for inventory lookup (FRONTEND_API_KEY or CUSTOMER_API_KEY)`);
      return null;
    }

    // Log API key info for debugging (safely - only show first 5 chars and length)
    const keySource = process.env.FRONTEND_API_KEY ? 'FRONTEND_API_KEY' : 'CUSTOMER_API_KEY';
    console.log(`🔑 Inventory API authentication:`, {
      keySource,
      keyPrefix: apiKey.substring(0, 5),
      keyLength: apiKey.length,
      tenantId: TENANT_ID,
      productId
    });

    const endpoint = `/api/inventory/public/${TENANT_ID}/${productId}`;
    const url = `${SOURCE_BASE}${endpoint}`;
    
    let res: Response | null = null;
    let authMethod = 'Bearer';
    
    try {
      // Try with Authorization: Bearer header first
      console.log(`📡 Attempting inventory API request with Authorization: Bearer header`);
      res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        signal: AbortSignal.timeout(2000),
        cache: 'no-store'
      });
      
      if (res && res.status === 401) {
        console.warn(`⚠️  Authorization: Bearer failed with 401, trying X-API-Key header`);
      }
    } catch (error) {
      console.warn(`❌ Inventory API request failed for ${productId}:`, error instanceof Error ? error.message : 'Unknown error');
      // Try with X-API-Key header as fallback
      try {
        authMethod = 'X-API-Key';
        console.log(`📡 Attempting inventory API request with X-API-Key header`);
        res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          },
          signal: AbortSignal.timeout(2000),
          cache: 'no-store'
        });
      } catch (fallbackError) {
        console.warn(`❌ Inventory API fallback request failed for ${productId}:`, fallbackError instanceof Error ? fallbackError.message : 'Unknown error');
        res = null;
      }
    }

    if (!res || !res.ok) {
      // 404 = no inventory data (product is in stock by default)
      if (res && res.status === 404) {
        console.log(`ℹ️  No inventory data for product: ${productId}, assuming in stock`);
        return null; // Return null = assume in stock
      } else {
        if (res) {
          // Log more details for debugging
          try {
            const errorText = await res.clone().text().catch(() => 'Unable to read error');
            const errorData = errorText ? JSON.parse(errorText) : null;
            
            console.warn(`❌ Inventory API returned ${res.status} for product: ${productId}`, {
              status: res.status,
              statusText: res.statusText,
              authMethod,
              endpoint,
              errorCode: errorData?.code,
              errorMessage: errorData?.message || errorText.substring(0, 200),
              keySource: process.env.FRONTEND_API_KEY ? 'FRONTEND_API_KEY' : 'CUSTOMER_API_KEY',
              keyLength: apiKey.length
            });
            
            // Special handling for 401 errors
            if (res.status === 401) {
              console.error(`🔐 Authentication failed! Please verify:`, {
                issue: 'API key mismatch',
                action: 'Check that inventorySync.apiKey in TenantConfig matches FRONTEND_API_KEY in Render',
                tenantId: TENANT_ID,
                endpoint: endpoint
              });
            }
          } catch (textError) {
            console.warn(`❌ Inventory API returned ${res.status} for product: ${productId}`, {
              status: res.status,
              statusText: res.statusText,
              authMethod,
              endpoint
            });
          }
        } else {
          console.warn(`❌ Inventory API unavailable for product: ${productId} (no response)`);
        }
        return null; // Fail gracefully
      }
    }

    const data = await res.json();
    
    // New response format: { success: true, productId: "...", found: true, inventory: {...} }
    if (!data.success || !data.found || !data.inventory) {
      // Product not found or no inventory data
      if (data.found === false) {
        console.log(`ℹ️  Product ${productId} not found in inventory, assuming in stock`);
      } else {
        console.log(`ℹ️  No inventory data for product: ${productId}, assuming in stock`);
      }
      return null;
    }

    const inventory = data.inventory;

    // Map Source API response to our format
    const inventoryData: InventoryData = {
      productId: inventory.productId || productId,
      stock: inventory.stock ?? 0,
      status: inventory.status || (inventory.stock === 0 ? 'out_of_stock' : 'in_stock'),
      lowStock: inventory.lowStock ?? inventory.status === 'low_stock',
      outOfStock: inventory.outOfStock ?? (inventory.status === 'out_of_stock' || inventory.stock === 0),
      name: inventory.name || inventory.productName,
      sku: inventory.sku,
      lastUpdated: inventory.lastUpdated || inventory.updatedAt
    };

    console.log(`✅ Found inventory for ${productId} (auth: ${authMethod}):`, {
      stock: inventoryData.stock,
      status: inventoryData.status,
      outOfStock: inventoryData.outOfStock,
      source: 'source_api'
    });

    return inventoryData;
  } catch (error) {
    // Fail gracefully - return null if API is down or times out
    console.warn(`Inventory lookup skipped for ${productId}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Get inventory status for multiple products
 */
export async function getInventoryForProducts(
  productIds: string[]
): Promise<Map<string, InventoryData>> {
  const result = new Map<string, InventoryData>();
  
  // Fetch all in parallel
  const promises = productIds.map(async (id) => {
    const inventory = await getInventoryFromSource(id);
    if (inventory) {
      result.set(id, inventory);
    }
  });
  
  await Promise.all(promises);
  return result;
}

