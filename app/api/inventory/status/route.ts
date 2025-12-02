import { NextRequest, NextResponse } from 'next/server';
import { getInventoryFromSource, type InventoryData } from '@/lib/inventory-source';
// Keep in-memory as fallback
import { getInventoryStatus, getInventoryByStripePriceId } from '@/lib/inventory';
import { getProduct } from '@/lib/catalog';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const stripePriceId = searchParams.get('stripePriceId'); // For variant inventory

    // Support querying by stripePriceId (for variants)
    if (stripePriceId) {
      // CRITICAL: Stripe Price IDs already start with "price_", don't duplicate the prefix
      const inventoryId = stripePriceId.startsWith('price_') ? stripePriceId : `price_${stripePriceId}`;
      console.log(`📊 Variant inventory requested:`, {
        productId,
        stripePriceId,
        inventoryId
      });
      
      const variantInventory = getInventoryByStripePriceId(stripePriceId);
      
      if (variantInventory) {
        console.log(`✅ Found variant inventory for ${stripePriceId}:`, {
          stock: variantInventory.stock,
          status: variantInventory.status,
          outOfStock: variantInventory.outOfStock,
          sku: variantInventory.sku,
          source: 'in_memory'
        });
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
        // CRITICAL: No variant inventory data = treat as OUT OF STOCK (not in stock)
        // This prevents overselling when inventory sync hasn't happened yet
        console.warn(`⚠️ No variant inventory found for ${stripePriceId}, treating as OUT OF STOCK`);
        return NextResponse.json({
          productId: productId || undefined,
          stripePriceId,
          stock: 0,
          status: 'out_of_stock',
          lowStock: false,
          outOfStock: true, // CRITICAL: Treat missing data as out of stock
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

    // PRIORITY: Use webhook data FIRST (fast, variant-level), then fall back to Source API
    let inventory: InventoryData | null = null;
    let source = 'none';

    // 1. FIRST: Check in-memory webhook data (fastest, has variant-level stock)
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
    } else {
      // 2. FALLBACK: Only call Source API if webhook data doesn't exist
      console.log(`📦 No webhook data found for ${productId}, checking Source API...`);
      inventory = await getInventoryFromSource(productId);
      if (inventory) {
        source = 'source_api';
        console.log(`📦 Using inventory from Source API for ${productId} (fallback)`);
      }
    }

    // Check if product has variants and if all variants are out of stock
    if (inventory && !inventory.outOfStock) {
      try {
        const product = await getProduct(productId);
        if (product?.variants && product.variants.length > 0) {
          // Check if all variants are out of stock
          const allVariantsOutOfStock = product.variants.every(variant => {
            // Check variant inventory from in-memory store
            const variantInventory = variant.stripePriceId 
              ? getInventoryByStripePriceId(variant.stripePriceId)
              : null;
            
            // Determine if variant is out of stock
            if (variantInventory) {
              return variantInventory.outOfStock || 
                     (variantInventory.stock !== null && variantInventory.stock <= 0) || 
                     variantInventory.status === 'out_of_stock';
            } else {
              // Use variant's own properties from product data
              return variant.outOfStock || 
                     variant.stock <= 0 || 
                     variant.status === 'out_of_stock' || 
                     variant.inStock === false;
            }
          });

          if (allVariantsOutOfStock) {
            console.log(`⚠️ All variants out of stock for product ${productId}, marking product as out of stock`);
            inventory.outOfStock = true;
            inventory.status = 'out_of_stock';
            inventory.stock = 0;
          }
        }
      } catch (error) {
        console.warn(`Failed to check variant stock for product ${productId}:`, error);
        // Continue with product-level inventory if variant check fails
      }
    }

    if (!inventory) {
      // CRITICAL: No inventory data = treat as OUT OF STOCK (not in stock)
      // This prevents overselling when inventory sync hasn't happened yet
      console.warn(`⚠️ No inventory data for ${productId} (checked Source API and in-memory), treating as OUT OF STOCK`);
      return NextResponse.json({
        productId,
        stock: 0,
        status: 'out_of_stock',
        lowStock: false,
        outOfStock: true, // CRITICAL: Treat missing data as out of stock
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

