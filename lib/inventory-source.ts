/**
 * Inventory Service - Source API Integration
 * Fetches inventory data directly from Source database (same pattern as campaigns)
 * Uses X-Tenant header authentication (no API key required)
 */

import { sourceFetch } from './source';

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
 * No API key required - uses X-Tenant header (same pattern as campaigns)
 * Returns null if no inventory data or if Source API is unavailable (fail gracefully)
 */
export async function getInventoryFromSource(
  productId: string
): Promise<InventoryData | null> {
  try {
    // Use the public inventory endpoint (no API key required)
    // Endpoint: GET /api/inventory/public/{tenantId}/{productId}
    // Headers: X-Tenant: {tenantId} (handled by sourceFetch)
    const endpoint = `/api/inventory/public/${TENANT_ID}/${productId}`;
    
    console.log(`📡 Fetching inventory from Source API for ${productId} (tenant: ${TENANT_ID})`);
    
    let res: Response | null = null;
    
    try {
      // Use sourceFetch which automatically sets X-Tenant header
      // Same pattern as campaign prices - no API key needed
      // Override X-Tenant to use tanjaunlimited (not the default 'tanja')
      res = await sourceFetch(endpoint, {
        signal: AbortSignal.timeout(2000),
        headers: {
          'X-Tenant': TENANT_ID  // Override to use tanjaunlimited
        }
      });
    } catch (error) {
      console.warn(`❌ Inventory API request failed for ${productId}:`, error instanceof Error ? error.message : 'Unknown error');
      res = null;
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
              endpoint,
              errorCode: errorData?.code,
              errorMessage: errorData?.message || errorText.substring(0, 200),
              tenantId: TENANT_ID
            });
          } catch (textError) {
            console.warn(`❌ Inventory API returned ${res.status} for product: ${productId}`, {
              status: res.status,
              statusText: res.statusText,
              endpoint,
              tenantId: TENANT_ID
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

    console.log(`✅ Found inventory for ${productId}:`, {
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

