import { NextRequest, NextResponse } from 'next/server';
import { getAllInventory } from '@/lib/inventory';

/**
 * Debug endpoint to view all current inventory data
 * GET /api/inventory/debug
 */
export async function GET(req: NextRequest) {
  try {
    const allInventory = getAllInventory();
    const inventoryArray = Array.from(allInventory.entries()).map(([id, status]) => ({
      productId: id,
      ...status
    }));

    return NextResponse.json({
      count: inventoryArray.length,
      inventory: inventoryArray
    });
  } catch (error) {
    console.error('Error getting inventory debug info:', error);
    return NextResponse.json(
      { error: 'Failed to get inventory' },
      { status: 500 }
    );
  }
}

