/**
 * Inventory Management Service
 * Stores and retrieves inventory status for products
 * 
 * This uses an in-memory Map for simplicity. In production, you might want to:
 * - Store in Source database via sourceFetch
 * - Use Redis for persistence
 * - Store in a local database
 */

export type InventoryStatus = {
  stock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lowStock: boolean;
  outOfStock: boolean;
  name?: string;
  sku?: string;
  lastUpdated: string;
};

// In-memory storage (Map<productId, InventoryStatus>)
const inventoryStore = new Map<string, InventoryStatus>();

/**
 * Update inventory for a product
 */
export async function updateInventory(
  productId: string,
  status: InventoryStatus
): Promise<void> {
  inventoryStore.set(productId, status);
  console.log(`📦 Inventory stored in Map for key "${productId}":`, {
    stock: status.stock,
    status: status.status,
    outOfStock: status.outOfStock,
    totalKeysInStore: inventoryStore.size
  });
}

/**
 * Get inventory status for a product
 * Returns null if no inventory data exists (CRITICAL: treat as out of stock, not in stock)
 */
export function getInventoryStatus(productId: string): InventoryStatus | null {
  return inventoryStore.get(productId) || null;
}

/**
 * Get inventory status for multiple products
 */
export function getInventoryStatuses(productIds: string[]): Map<string, InventoryStatus> {
  const result = new Map<string, InventoryStatus>();
  for (const id of productIds) {
    const status = inventoryStore.get(id);
    if (status) {
      result.set(id, status);
    }
  }
  return result;
}

/**
 * Check if a product is in stock
 * CRITICAL: Returns false (out of stock) if no inventory data exists
 * Never assume in stock when data is missing - prevents overselling
 */
export function isInStock(productId: string): boolean {
  const status = inventoryStore.get(productId);
  if (!status) {
    console.warn(`⚠️ No inventory data for ${productId}, treating as OUT OF STOCK`);
    return false; // CRITICAL: Treat missing data as out of stock
  }
  return !status.outOfStock && status.stock > 0;
}

/**
 * Check if a product is low stock
 */
export function isLowStock(productId: string): boolean {
  const status = inventoryStore.get(productId);
  if (!status) return false;
  return status.lowStock || status.status === 'low_stock';
}

/**
 * Get all inventory data (for debugging/admin)
 */
export function getAllInventory(): Map<string, InventoryStatus> {
  return new Map(inventoryStore);
}

/**
 * Clear inventory for a product (useful for testing)
 */
export function clearInventory(productId: string): void {
  inventoryStore.delete(productId);
}

/**
 * Get inventory status by stripePriceId (for campaign prices)
 * Guide: "Match products by stripePriceId to update campaign price inventory"
 * CRITICAL: Stripe Price IDs already start with "price_", don't duplicate the prefix
 */
export function getInventoryByStripePriceId(stripePriceId: string): InventoryStatus | null {
  // Stripe Price IDs already start with "price_", use directly
  const priceInventoryId = stripePriceId.startsWith('price_') ? stripePriceId : `price_${stripePriceId}`;
  
  const result = inventoryStore.get(priceInventoryId);
  
  // Enhanced logging for debugging
  if (!result) {
    console.log(`🔍 Inventory lookup for "${priceInventoryId}": NOT FOUND`, {
      searchedKey: priceInventoryId,
      totalKeysInStore: inventoryStore.size,
      sampleKeys: Array.from(inventoryStore.keys()).slice(0, 5)
    });
  } else {
    console.log(`✅ Inventory lookup for "${priceInventoryId}": FOUND`, {
      stock: result.stock,
      status: result.status,
      outOfStock: result.outOfStock
    });
  }
  
  return result || null;
}

/**
 * Check if a stripePriceId is out of stock
 * Used for campaign price inventory checks
 * CRITICAL: Returns true (out of stock) if no inventory data exists
 * Never assume in stock when data is missing - prevents overselling
 */
export function isStripePriceOutOfStock(stripePriceId: string): boolean {
  const status = getInventoryByStripePriceId(stripePriceId);
  if (!status) {
    console.warn(`⚠️ No inventory data for stripePriceId ${stripePriceId}, treating as OUT OF STOCK`);
    return true; // CRITICAL: Treat missing data as out of stock
  }
  return status.outOfStock || status.stock <= 0;
}

