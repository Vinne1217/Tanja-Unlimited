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
  console.log(`📦 Inventory updated for ${productId}:`, {
    stock: status.stock,
    status: status.status,
    outOfStock: status.outOfStock
  });
}

/**
 * Get inventory status for a product
 * Returns null if no inventory data exists (assumes in stock)
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
 */
export function isInStock(productId: string): boolean {
  const status = inventoryStore.get(productId);
  if (!status) return true; // Default to in stock if no data
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

