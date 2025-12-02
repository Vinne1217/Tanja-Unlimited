import { NextRequest, NextResponse } from 'next/server';
import { getProductFromStorefront, getVariantByPriceId } from '@/lib/inventory-storefront';
import { getProduct } from '@/lib/catalog';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const stripePriceId = searchParams.get('stripePriceId'); // For variant inventory

    // Support querying by stripePriceId (for variants)
    if (stripePriceId) {
      console.log(`📊 Variant inventory requested:`, {
        productId,
        stripePriceId
      });
      
      // Fetch variant from Storefront API
      const variant = await getVariantByPriceId(stripePriceId, productId || undefined);
      
      if (variant) {
        console.log(`✅ Found variant inventory for ${stripePriceId}:`, {
          stock: variant.stock,
          status: variant.status,
          outOfStock: variant.outOfStock,
          size: variant.size,
          color: variant.color,
          source: 'storefront_api'
        });
        return NextResponse.json({
          productId: variant.productId,
          stripePriceId,
          stock: variant.stock,
          status: variant.status || (variant.outOfStock ? 'out_of_stock' : variant.lowStock ? 'low_stock' : 'in_stock'),
          lowStock: variant.lowStock || variant.stock < 10,
          outOfStock: variant.outOfStock || variant.stock <= 0,
          sku: variant.sku || variant.articleNumber,
          name: variant.productName,
          hasData: true,
          source: 'storefront_api'
        });
      } else {
        // CRITICAL: No variant found = treat as OUT OF STOCK (not in stock)
        // This prevents overselling when variant doesn't exist
        console.warn(`⚠️ No variant found for ${stripePriceId}, treating as OUT OF STOCK`);
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

    // Use Storefront API directly - simpler and more reliable than webhook system
    const product = await getProductFromStorefront(productId);
    let inventory: {
      productId: string;
      stock: number | null;
      status: 'in_stock' | 'low_stock' | 'out_of_stock';
      lowStock: boolean;
      outOfStock: boolean;
      name?: string;
      sku?: string;
      lastUpdated?: string;
    } | null = null;
    let source = 'none';

    if (product) {
      source = 'storefront_api';
      console.log(`📦 Using inventory from Storefront API for ${productId}`);
      
      // Calculate product-level inventory from variants
      const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
      const hasInStockVariants = product.variants?.some(v => v.stock > 0 && !v.outOfStock) || false;
      const allOutOfStock = product.variants?.every(v => v.outOfStock || v.stock <= 0) || false;
      
      inventory = {
        productId: product.baseSku || product.id,
        stock: totalStock > 0 ? totalStock : null,
        status: allOutOfStock ? 'out_of_stock' : (hasInStockVariants ? 'in_stock' : 'out_of_stock'),
        lowStock: product.variants?.some(v => v.lowStock || (v.stock > 0 && v.stock < 10)) || false,
        outOfStock: allOutOfStock || !hasInStockVariants,
        name: product.title,
        sku: product.baseSku || product.id,
        lastUpdated: new Date().toISOString()
      };
    }

    // Variant-level stock is already calculated from Storefront API product data above
    // No need for additional checks

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

