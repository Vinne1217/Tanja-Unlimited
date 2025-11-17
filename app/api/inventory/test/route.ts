import { NextRequest, NextResponse } from 'next/server';
import { updateInventory } from '@/lib/inventory';

/**
 * Test endpoint to manually set inventory for testing
 * Usage: POST /api/inventory/test
 * Body: { productId: "ljsf-001", stock: 0, status: "out_of_stock" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, stock, status } = body;

    if (!productId || stock === undefined || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, stock, status' },
        { status: 400 }
      );
    }

    await updateInventory(productId, {
      stock,
      status: status as 'in_stock' | 'low_stock' | 'out_of_stock',
      lowStock: status === 'low_stock',
      outOfStock: status === 'out_of_stock',
      lastUpdated: new Date().toISOString()
    });

    console.log(`🧪 Test inventory set for ${productId}:`, { stock, status });

    return NextResponse.json({
      success: true,
      message: `Inventory set for ${productId}`,
      productId,
      stock,
      status
    });
  } catch (error) {
    console.error('Error setting test inventory:', error);
    return NextResponse.json(
      { error: 'Failed to set inventory' },
      { status: 500 }
    );
  }
}

