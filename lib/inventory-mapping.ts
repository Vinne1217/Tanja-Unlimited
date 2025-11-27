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

// Stripe Product ID -> Tanja Product ID mapping (fallback for when customer portal sends Stripe IDs)
export const STRIPE_TO_TANJA_MAPPING: Record<string, string> = {
  // New Stripe Product IDs (updated 2025)
  'prod_TUhwHTMbcNO6LQ': 'sjs-001',      // Short Jacket Silk (SJS)
  'prod_TUhwXhECUhrZ8S': 'ljsf-001',     // Long Jacket Silk fitted (LJSf)
  'prod_TUhwaYvZLfYk0s': 'sjcilw-001',   // Short jacket Cotton Imperial Line White
  'prod_TUhwCzidnMBjbU': 'njcilw-001',   // Nehru Jacket Cotton imperial line White
  'prod_TUhwLQR2PQ0H1s': 'ljckils-001',  // Long Jacket Cotton knee imperial line Silver
  // Legacy Stripe Product IDs (kept for backward compatibility)
  'prod_TM8HrnCVZxAkzA': 'sjs-001',      // Short Jacket Silk (SJS) - OLD
  'prod_TM8KNMKe85ZYMM': 'ljsf-001',     // Long Jacket Silk fitted (LJSf) - OLD
  'prod_TM8ObxolUedP4W': 'sjcilw-001',   // Short jacket Cotton Imperial Line White - OLD
  'prod_TM8PR5YzRhLcGo': 'njcilw-001',   // Nehru Jacket Cotton imperial line White - OLD
  'prod_TM8U3Iw6TlUoba': 'ljckils-001',  // Long Jacket Cotton knee imperial line Silver - OLD
  'prod_TM8WtsmaCpBGLm': 'ljcfils-001',  // Long Jacket Cotton fitted imperial line Silver
  'prod_TTuI3y4djIk4dl': 'ljckilg-001',  // Long Jacket Cotton knee imperial line Gold
  'prod_TTuQwJfAiYh99j': 'ljckilp-001',  // Long Jacket Cotton knee imperial line Platinum
  'prod_TTuM1DVrUtgru5': 'ljcfilg-001',  // Long Jacket Cotton fitted imperial line Gold
  'prod_TTuSJQSVbUdio6': 'ljcfild-001',  // Long Jacket Cotton fitted imperial line Diamond
};

/**
 * Convert customer portal product ID to Tanja product ID
 * Supports both base SKU (e.g., "LJCfilG") and Stripe product ID (e.g., "prod_TTuM1DVrUtgru5")
 */
export function mapProductId(portalProductId: string): string {
  // Try direct mapping first (base SKU)
  if (PRODUCT_ID_MAPPING[portalProductId]) {
    return PRODUCT_ID_MAPPING[portalProductId];
  }
  
  // Try Stripe product ID mapping (fallback)
  if (STRIPE_TO_TANJA_MAPPING[portalProductId]) {
    console.log(`📦 Mapped Stripe product ID ${portalProductId} to Tanja product ID ${STRIPE_TO_TANJA_MAPPING[portalProductId]}`);
    return STRIPE_TO_TANJA_MAPPING[portalProductId];
  }
  
  // Try case-insensitive match for base SKU
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

