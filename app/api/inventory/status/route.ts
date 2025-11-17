import { NextRequest, NextResponse } from 'next/server';
import { getInventoryStatus } from '@/lib/inventory';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Inventory status requested for product: ${productId}`);
    const status = getInventoryStatus(productId);

    if (!status) {
      // No inventory data = assume in stock (default behavior)
      console.log(`ℹ️  No inventory data for ${productId}, returning default (in stock)`);
      return NextResponse.json({
        productId,
        stock: null,
        status: 'in_stock',
        lowStock: false,
        outOfStock: false,
        hasData: false
      });
    }

    console.log(`✅ Inventory status for ${productId}:`, {
      stock: status.stock,
      status: status.status,
      outOfStock: status.outOfStock
    });

    return NextResponse.json({
      productId,
      stock: status.stock,
      status: status.status,
      lowStock: status.lowStock,
      outOfStock: status.outOfStock,
      name: status.name,
      sku: status.sku,
      lastUpdated: status.lastUpdated,
      hasData: true
    });
  } catch (error) {
    console.error('❌ Error fetching inventory status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory status' },
      { status: 500 }
    );
  }
}

