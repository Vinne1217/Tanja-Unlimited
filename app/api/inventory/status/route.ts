import { NextRequest, NextResponse } from 'next/server';
import { getInventoryFromSource } from '@/lib/inventory-source';
// Keep in-memory as fallback
import { getInventoryStatus, getInventoryByStripePriceId } from '@/lib/inventory';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const stripePriceId = searchParams.get('stripePriceId'); // For variant inventory

    // Support querying by stripePriceId (for variants)
    if (stripePriceId) {
      const variantInventory = getInventoryByStripePriceId(stripePriceId);
      
      if (variantInventory) {
        return NextResponse.json({
          productId: productId || undefined,
          stripePriceId,
          stock: variantInventory.stock,
          status: variantInventory.status,
          lowStock: variantInventory.lowStock,
          outOfStock: variantInventory.outOfStock,
          name: variantInventory.name,
          sku: variantInventory.sku,
          lastUpdated: variantInventory.lastUpdated,
          hasData: true,
          source: 'in_memory'
        });
      } else {
        // No variant inventory data = assume in stock
        return NextResponse.json({
          productId: productId || undefined,
          stripePriceId,
          stock: null,
          status: 'in_stock',
          lowStock: false,
          outOfStock: false,
          hasData: false,
          source: 'default'
        });
      }
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'productId or stripePriceId is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Inventory status requested for product: ${productId}`);

    // Hybrid approach: Try Source API first (persistent storage), then in-memory (webhook updates)
    let inventory = await getInventoryFromSource(productId);
    let source = 'none';

    if (inventory) {
      source = 'source_api';
      console.log(`📦 Using inventory from Source API for ${productId}`);
    } else {
      // Fallback to in-memory if Source API has no data (updated via webhooks)
      const memoryStatus = getInventoryStatus(productId);
      if (memoryStatus) {
        source = 'in_memory';
        console.log(`📦 Using inventory from in-memory storage (webhook) for ${productId}`);
        inventory = {
          productId,
          stock: memoryStatus.stock,
          status: memoryStatus.status,
          lowStock: memoryStatus.lowStock,
          outOfStock: memoryStatus.outOfStock,
          name: memoryStatus.name,
          sku: memoryStatus.sku,
          lastUpdated: memoryStatus.lastUpdated
        };
      }
    }

    if (!inventory) {
      // No inventory data = assume in stock (default behavior)
      console.log(`ℹ️  No inventory data for ${productId} (checked Source API and in-memory), returning default (in stock)`);
      return NextResponse.json({
        productId,
        stock: null,
        status: 'in_stock',
        lowStock: false,
        outOfStock: false,
        hasData: false,
        source: 'default'
      });
    }

    console.log(`✅ Inventory status for ${productId} (source: ${source}):`, {
      stock: inventory.stock,
      status: inventory.status,
      outOfStock: inventory.outOfStock
    });

    return NextResponse.json({
      productId,
      stock: inventory.stock,
      status: inventory.status,
      lowStock: inventory.lowStock,
      outOfStock: inventory.outOfStock,
      name: inventory.name,
      sku: inventory.sku,
      lastUpdated: inventory.lastUpdated,
      hasData: true,
      source: source
    });
  } catch (error) {
    console.error('❌ Error fetching inventory status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory status' },
      { status: 500 }
    );
  }
}

