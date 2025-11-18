/**
 * Inventory Service - Source API Integration
 * Fetches inventory data directly from Source database (same pattern as campaigns)
 * No webhook needed - frontend queries Source API when needed
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
 * Returns null if no inventory data or if Source API is unavailable (fail gracefully)
 */
export async function getInventoryFromSource(
  productId: string
): Promise<InventoryData | null> {
  try {
    // Query Source API for inventory data
    // Similar to how campaigns work: /v1/campaign-prices
    // Try multiple possible endpoint formats
    let res: Response | null = null;
    
    try {
      // IMPORTANT: Override X-Tenant header to match tenantId in query parameter
      res = await sourceFetch(
        `/v1/inventory?tenantId=${TENANT_ID}&productId=${productId}`,
        {
          signal: AbortSignal.timeout(2000),
          headers: {
            'X-Tenant': TENANT_ID  // Match the tenantId in query parameter
          }
        }
      );
    } catch (error) {
      console.warn(`Inventory API request failed for ${productId}:`, error instanceof Error ? error.message : 'Unknown error');
      // Try fallback endpoint
    }

    // Fallback: try alternative endpoint format
    if (!res || !res.ok) {
      try {
        res = await sourceFetch(
          `/v1/inventarier?tenantId=${TENANT_ID}&productId=${productId}`,
          {
            signal: AbortSignal.timeout(2000),
            headers: {
              'X-Tenant': TENANT_ID  // Match the tenantId in query parameter
            }
          }
        );
      } catch (error) {
        console.warn(`Inventory API fallback request failed for ${productId}:`, error instanceof Error ? error.message : 'Unknown error');
        // Both endpoints failed
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
            console.warn(`Inventory API returned ${res.status} for product: ${productId}`, {
              status: res.status,
              statusText: res.statusText,
              errorPreview: errorText.substring(0, 200)
            });
          } catch (textError) {
            console.warn(`Inventory API returned ${res.status} for product: ${productId}`, {
              status: res.status,
              statusText: res.statusText
            });
          }
        } else {
          console.warn(`Inventory API unavailable for product: ${productId}`);
        }
        return null; // Fail gracefully
      }
    }

    const data = await res.json();
    
    // Handle different response formats
    const inventory = Array.isArray(data) ? data[0] : data.inventory || data;

    if (!inventory) {
      return null;
    }

    // Map Source API response to our format
    const inventoryData: InventoryData = {
      productId: inventory.productId || productId,
      stock: inventory.stock ?? 0,
      status: inventory.status || (inventory.stock === 0 ? 'out_of_stock' : 'in_stock'),
      lowStock: inventory.lowStock ?? inventory.status === 'low_stock',
      outOfStock: inventory.outOfStock ?? inventory.status === 'out_of_stock' ?? inventory.stock === 0,
      name: inventory.name || inventory.productName,
      sku: inventory.sku,
      lastUpdated: inventory.lastUpdated || inventory.updatedAt
    };

    console.log(`✅ Found inventory for ${productId}:`, {
      stock: inventoryData.stock,
      status: inventoryData.status,
      outOfStock: inventoryData.outOfStock
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

