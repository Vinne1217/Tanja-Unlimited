/**
 * Product ID Mapping for Inventory Sync
 * Maps customer portal product IDs to Tanja product IDs
 */

export const PRODUCT_ID_MAPPING: Record<string, string> = {
  // Customer Portal ID -> Tanja Product ID
  'LJSf': 'ljsf-001',           // Long Jacket Silk fitted (LJSf)
  'SJS': 'sjs-001',             // Short Jacket Silk (SJS)
  'SJCilW': 'sjcilw-001',       // Short jacket Cotton Imperial Line White
  'NJCilW': 'njcilw-001',       // Nehru Jacket Cotton imperial line White
  'LJCkilS': 'ljckils-001',     // Long Jacket Cotton knee imperial line Silver
  'LJCfilS': 'ljcfils-001',     // Long Jacket Cotton fitted imperial line Silver
};

/**
 * Convert customer portal product ID to Tanja product ID
 */
export function mapProductId(portalProductId: string): string {
  // Try direct mapping first
  if (PRODUCT_ID_MAPPING[portalProductId]) {
    return PRODUCT_ID_MAPPING[portalProductId];
  }
  
  // Try case-insensitive match
  const lowerId = portalProductId.toLowerCase();
  for (const [key, value] of Object.entries(PRODUCT_ID_MAPPING)) {
    if (key.toLowerCase() === lowerId) {
      return value;
    }
  }
  
  // If no mapping found, return original (might be a catalog product)
  console.warn(`⚠️  No product ID mapping found for: ${portalProductId}, using as-is`);
  return portalProductId;
}

