import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { updateInventory, getInventoryStatus } from '@/lib/inventory';

const TENANT_ID = 'tanjaunlimited';

// Define payload shape based on INVENTORY_SYNC_INTEGRATION.md
type InventorySyncPayload = {
  tenantId: string;
  item: {
    id: string;           // e.g. productId or variantId
    sku?: string;
    name?: string;
    stock: number;        // current absolute stock
    delta?: number;       // optional: change (+/-)
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    lowStock?: boolean;
    outOfStock?: boolean;
  };
};

export async function POST(req: NextRequest) {
  try {
    // Use same authentication as campaign webhooks
    const auth = req.headers.get('authorization') ?? '';
    const expectedKey = process.env.FRONTEND_API_KEY || process.env.CUSTOMER_API_KEY;
    
    if (auth !== `Bearer ${expectedKey}`) {
      console.warn('❌ Unauthorized inventory sync attempt');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = (await req.json()) as InventorySyncPayload;

    if (!body?.tenantId || !body?.item?.id) {
      console.error('❌ Invalid inventory sync payload:', body);
      return NextResponse.json(
        { success: false, error: 'Invalid payload: missing tenantId or item.id' },
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

    // Update inventory storage
    await updateInventory(body.item.id, {
      stock: body.item.stock,
      status: body.item.status,
      lowStock: body.item.lowStock ?? body.item.status === 'low_stock',
      outOfStock: body.item.outOfStock ?? body.item.status === 'out_of_stock',
      name: body.item.name,
      sku: body.item.sku,
      lastUpdated: new Date().toISOString()
    });

    // Revalidate product pages to show updated stock status
    revalidatePath('/webshop');
    revalidatePath('/collection');
    revalidatePath('/');

    console.log('✅ Inventory synced successfully:', {
      productId: body.item.id,
      name: body.item.name,
      stock: body.item.stock,
      status: body.item.status
    });

    return NextResponse.json({ 
      success: true,
      productId: body.item.id,
      stock: body.item.stock,
      status: body.item.status
    });
  } catch (error) {
    console.error('❌ Inventory sync handler error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

