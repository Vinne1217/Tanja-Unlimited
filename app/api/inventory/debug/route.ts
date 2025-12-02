import { NextRequest, NextResponse } from 'next/server';
import { getAllInventory, getInventoryByStripePriceId } from '@/lib/inventory';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stripePriceId = searchParams.get('stripePriceId');
    
    if (stripePriceId) {
      // Check specific variant
      const variant = getInventoryByStripePriceId(stripePriceId);
      return NextResponse.json({
        stripePriceId,
        found: !!variant,
        inventory: variant,
        allKeys: Array.from(new Set([stripePriceId]))
      });
    }
    
    // Return all inventory data
    const allInventory = getAllInventory();
    const keys = Array.from(allInventory.keys());
    
    return NextResponse.json({
      totalKeys: keys.length,
      keys: keys.slice(0, 20), // First 20 keys
      sampleEntries: Array.from(allInventory.entries())
        .slice(0, 5)
        .map(([key, value]) => ({
          key,
          stock: value.stock,
          status: value.status,
          outOfStock: value.outOfStock,
          name: value.name,
          sku: value.sku
        }))
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
