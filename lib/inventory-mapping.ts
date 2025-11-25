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
  'LJCfilG': 'ljcfilg-001',     // Long Jacket Cotton fitted imperial line Gold
  'LJCkilG': 'ljckilg-001',     // Long Jacket Cotton knee imperial line Gold
  'LJCkilP': 'ljckilp-001',     // Long Jacket Cotton knee imperial line Platinum
  'LJCfilD': 'ljcfild-001',     // Long Jacket Cotton fitted imperial line Diamond
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

/**
 * Reverse mapping: Convert Tanja product ID back to customer portal product ID
 * Used when querying the Source API (which uses customer portal format)
 */
export function reverseMapProductId(tanjaProductId: string): string {
  // Search for the Tanja product ID in the mapping values
  for (const [portalId, tanjaId] of Object.entries(PRODUCT_ID_MAPPING)) {
    if (tanjaId === tanjaProductId) {
      return portalId;
    }
  }
  
  // Try case-insensitive match
  const lowerId = tanjaProductId.toLowerCase();
  for (const [portalId, tanjaId] of Object.entries(PRODUCT_ID_MAPPING)) {
    if (tanjaId.toLowerCase() === lowerId) {
      return portalId;
    }
  }
  
  // If no reverse mapping found, return original (might be a catalog product)
  // The API might accept both formats
  return tanjaProductId;
}

