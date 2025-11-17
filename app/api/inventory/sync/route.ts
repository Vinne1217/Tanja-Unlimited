import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { updateInventory, getInventoryStatus } from '@/lib/inventory';
import { mapProductId } from '@/lib/inventory-mapping';

const TENANT_ID = 'tanjaunlimited';

// Define payload shape - supports both formats
type InventorySyncPayload = {
  tenantId: string;
  item?: {
    id: string;           // e.g. productId or variantId
    sku?: string;
    name?: string;
    stock: number;        // current absolute stock
    delta?: number;       // optional: change (+/-)
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    lowStock?: boolean;
    outOfStock?: boolean;
  };
  // Alternative format from customer portal
  productId?: string;
  productName?: string;
  stock?: number;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
};

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    endpoint: '/api/inventory/sync',
    message: 'Inventory sync endpoint is active' 
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log('📥 Inventory sync endpoint called');
    
    // Use same authentication as campaign webhooks
    const auth = req.headers.get('authorization') ?? '';
    const expectedKey = process.env.FRONTEND_API_KEY || process.env.CUSTOMER_API_KEY;
    
    if (!expectedKey) {
      console.error('❌ FRONTEND_API_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    if (auth !== `Bearer ${expectedKey}`) {
      console.warn('❌ Unauthorized inventory sync attempt', {
        hasAuth: !!auth,
        authPrefix: auth.substring(0, 10),
        expectedPrefix: `Bearer ${expectedKey.substring(0, 5)}...`
      });
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = (await req.json()) as InventorySyncPayload;

    console.log('📥 Raw inventory sync payload received:', JSON.stringify(body, null, 2));

    // Validate tenant
    if (!body?.tenantId) {
      console.error('❌ Invalid inventory sync payload: missing tenantId', body);
      return NextResponse.json(
        { success: false, error: 'Invalid payload: missing tenantId' },
        { status: 400 }
      );
    }

    if (body.tenantId !== TENANT_ID) {
      console.warn(`⚠️  Inventory sync for unknown tenant: ${body.tenantId}`);
      return NextResponse.json(
        { success: false, error: 'Unknown tenant' },
        { status: 400 }
      );
    }

    // Handle two payload formats:
    // 1. Standard format: { tenantId, item: { id, stock, status, ... } }
    // 2. Customer portal format: { tenantId, productId, productName, stock, status }
    let productId: string;
    let stock: number;
    let status: 'in_stock' | 'low_stock' | 'out_of_stock';
    let name: string | undefined;
    let sku: string | undefined;

    if (body.item?.id) {
      // Standard format
      productId = body.item.id;
      stock = body.item.stock;
      status = body.item.status;
      name = body.item.name;
      sku = body.item.sku;
    } else if (body.productId) {
      // Customer portal format
      productId = body.productId;
      stock = body.stock ?? 0;
      status = body.status ?? 'in_stock';
      name = body.productName;
    } else {
      console.error('❌ Invalid inventory sync payload: missing productId/item.id', body);
      return NextResponse.json(
        { success: false, error: 'Invalid payload: missing productId or item.id' },
        { status: 400 }
      );
    }

    // Map customer portal product ID to Tanja product ID
    const mappedProductId = mapProductId(productId);
    
    console.log(`📥 Inventory sync received:`, {
      originalProductId: productId,
      mappedProductId,
      stock,
      status,
      name
    });

    // Update inventory storage
    await updateInventory(mappedProductId, {
      stock,
      status,
      lowStock: status === 'low_stock',
      outOfStock: status === 'out_of_stock',
      name,
      sku,
      lastUpdated: new Date().toISOString()
    });

    // Revalidate product pages to show updated stock status
    revalidatePath('/webshop');
    revalidatePath('/collection');
    revalidatePath('/');

    console.log('✅ Inventory synced successfully:', {
      originalProductId: productId,
      mappedProductId,
      name,
      stock,
      status
    });

    return NextResponse.json({ 
      success: true,
      productId: mappedProductId,
      originalProductId: productId,
      stock,
      status
    });
  } catch (error) {
    console.error('❌ Inventory sync handler error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

