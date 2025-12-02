import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { upsertCampaign, deleteCampaign } from '@/lib/campaigns';
import { 
  storeCampaignPrice, 
  expireCampaignPrice, 
  isEventProcessed,
  getActiveCampaignPrices 
} from '@/lib/campaign-price-service';

const TENANT_ID = 'tanjaunlimited';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  // Accept either FRONTEND_API_KEY (correct name) or CUSTOMER_API_KEY (legacy)
  const expectedKey = process.env.FRONTEND_API_KEY || process.env.CUSTOMER_API_KEY;
  
  if (auth !== `Bearer ${expectedKey}`) {
    console.warn('❌ Unauthorized webhook attempt', {
      hasAuth: !!auth,
      authPrefix: auth.substring(0, 20),
      expectedPrefix: expectedKey ? `Bearer ${expectedKey.substring(0, 5)}...` : 'NO_KEY_SET',
      hasExpectedKey: !!expectedKey
    });
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const action: string = body.action;
  const eventId: string | undefined = body.eventId;

  console.log(`📥 Webhook received: ${action}`, eventId ? `(event: ${eventId})` : '');

  // Check for duplicate events (idempotency)
  if (eventId && await isEventProcessed(TENANT_ID, eventId)) {
    console.log(`⚠️  Event ${eventId} already processed, skipping`);
    return NextResponse.json({ 
      success: true, 
      message: 'Event already processed',
      duplicate: true 
    });
  }

  // Handle ping
  if (action === 'ping') {
    console.log('🏓 Ping received');
    return NextResponse.json({ success: true, message: 'Pong' });
  }

  // Handle price events (campaign pricing)
  if (action === 'price.created' || action === 'price.updated') {
    const priceUpdate = body.priceUpdate;
    
    if (!priceUpdate?.stripePriceId || !priceUpdate?.originalProductId) {
      console.error('❌ Missing required price fields:', priceUpdate);
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }

    const result = await storeCampaignPrice(TENANT_ID, priceUpdate, eventId);
    
    if (result.success) {
      // Revalidate pages to show new campaign prices
      revalidatePath('/webshop');
      revalidatePath('/collection');
      revalidatePath('/');
    }

    return NextResponse.json({ 
      success: result.success, 
      message: result.message,
      priceId: priceUpdate.stripePriceId,
      productId: priceUpdate.originalProductId
    });
  }

  // Handle inventory events
  if (action?.startsWith('inventory.')) {
    const inventoryAction = action.replace('inventory.', ''); // 'updated', 'created', 'deleted'
    const inventoryUpdate = body.inventory || body.item;
    
    if (!inventoryUpdate) {
      console.error('❌ Missing inventory data in inventory update');
      return NextResponse.json({ 
        success: false, 
        message: 'Missing inventory data' 
      }, { status: 400 });
    }

    // Get product ID (handle both formats)
    let productId = inventoryUpdate.productId || inventoryUpdate.id;
    
    if (!productId) {
      console.error('❌ Missing productId in inventory update:', inventoryUpdate);
      return NextResponse.json({ 
        success: false, 
        message: 'Missing productId' 
      }, { status: 400 });
    }

    // Map customer portal product ID to Tanja product ID
    const { mapProductId } = await import('@/lib/inventory-mapping');
    const mappedProductId = mapProductId(productId);

    console.log(`📦 Inventory ${inventoryAction} received:`, {
      originalProductId: productId,
      mappedProductId,
      stock: inventoryUpdate.stock,
      status: inventoryUpdate.status
    });

    // Handle different inventory actions
    if (inventoryAction === 'updated' || inventoryAction === 'created') {
      // Update local inventory storage (for fast access)
      const { updateInventory } = await import('@/lib/inventory');
      
      // Determine status if not provided (following guide: in_stock, low_stock, out_of_stock)
      let status: 'in_stock' | 'low_stock' | 'out_of_stock' = inventoryUpdate.status;
      if (!status) {
        if (inventoryUpdate.stock === 0 || inventoryUpdate.stock <= 0) {
          status = 'out_of_stock';
        } else if (inventoryUpdate.lowStock) {
          status = 'low_stock';
        } else {
          status = 'in_stock';
        }
      }

      // Determine outOfStock flag (guide: always check outOfStock flag, not just stock === 0)
      const outOfStock = inventoryUpdate.outOfStock !== undefined 
        ? inventoryUpdate.outOfStock 
        : (inventoryUpdate.status === 'out_of_stock' || inventoryUpdate.stock === 0 || inventoryUpdate.stock <= 0);

      // Update inventory by productId (main product)
      await updateInventory(mappedProductId, {
        stock: inventoryUpdate.stock ?? 0,
        status: status,
        lowStock: inventoryUpdate.lowStock ?? inventoryUpdate.status === 'low_stock',
        outOfStock: outOfStock,
        name: inventoryUpdate.name,
        sku: inventoryUpdate.sku,
        lastUpdated: new Date().toISOString()
      });

      // If stripePriceId is provided, also update inventory for that specific price (for campaign prices)
      // Guide: "Match products by stripePriceId to update campaign price inventory"
      // CRITICAL: Stripe Price IDs already start with "price_", don't duplicate the prefix
      if (inventoryUpdate.stripePriceId) {
        const priceInventoryId = inventoryUpdate.stripePriceId.startsWith('price_') 
          ? inventoryUpdate.stripePriceId 
          : `price_${inventoryUpdate.stripePriceId}`;
        await updateInventory(priceInventoryId, {
          stock: inventoryUpdate.stock ?? 0,
          status: status,
          lowStock: inventoryUpdate.lowStock ?? inventoryUpdate.status === 'low_stock',
          outOfStock: outOfStock,
          name: inventoryUpdate.name,
          sku: inventoryUpdate.sku,
          lastUpdated: new Date().toISOString()
        });
        console.log(`📦 Inventory also updated for stripePriceId: ${inventoryUpdate.stripePriceId} (stored as: ${priceInventoryId})`);
      }

      // Handle variants if provided (guide: "Handle variant-level stock updates separately")
      if (inventoryUpdate.variants && Array.isArray(inventoryUpdate.variants)) {
        console.log(`📦 Processing ${inventoryUpdate.variants.length} variants for product ${mappedProductId}`);
        
        for (const variant of inventoryUpdate.variants) {
          if (variant.stripePriceId) {
            // CRITICAL: Stripe Price IDs already start with "price_", don't duplicate the prefix
            const variantInventoryId = variant.stripePriceId.startsWith('price_') 
              ? variant.stripePriceId 
              : `price_${variant.stripePriceId}`;
            const variantOutOfStock = variant.outOfStock ?? (variant.stock === 0 || variant.stock <= 0);
            const variantStatus = variant.status || (variantOutOfStock ? 'out_of_stock' : variant.lowStock ? 'low_stock' : 'in_stock');
            
            await updateInventory(variantInventoryId, {
              stock: variant.stock ?? 0,
              status: variantStatus,
              lowStock: variant.lowStock ?? variant.status === 'low_stock',
              outOfStock: variantOutOfStock,
              name: variant.name || inventoryUpdate.name,
              sku: variant.sku || variant.articleNumber || variant.key,
              lastUpdated: new Date().toISOString()
            });
            
            console.log(`📦 Variant inventory updated for stripePriceId: ${variant.stripePriceId} (stored as: ${variantInventoryId})`, {
              articleNumber: variant.articleNumber,
              size: variant.size,
              color: variant.color,
              stock: variant.stock,
              outOfStock: variantOutOfStock,
              status: variantStatus,
              hasSize: !!variant.size,
              hasColor: !!variant.color
            });
          } else {
            console.warn(`⚠️ Variant missing stripePriceId:`, {
              articleNumber: variant.articleNumber,
              key: variant.key,
              sku: variant.sku,
              size: variant.size,
              color: variant.color
            });
          }
        }
      }

      // Guide: "If a product is out of stock, all campaign prices for that product should also be unavailable"
      // This is handled by checking outOfStock flag in BuyNowButton, which applies to all prices for the product

      console.log(`✅ Inventory ${inventoryAction} processed for ${mappedProductId}`, {
        stock: inventoryUpdate.stock,
        status,
        outOfStock,
        hasStripePriceId: !!inventoryUpdate.stripePriceId,
        variantCount: inventoryUpdate.variants?.length || 0
      });

      // Revalidate pages to show updated inventory
      revalidatePath('/webshop');
      revalidatePath('/collection');
      revalidatePath('/');

      return NextResponse.json({ 
        success: true, 
        message: `Inventory ${inventoryAction} processed`,
        productId: mappedProductId,
        originalProductId: productId
      });
    } else if (inventoryAction === 'deleted') {
      // Remove inventory (optional - can just set stock to 0 instead)
      const { clearInventory } = await import('@/lib/inventory');
      clearInventory(mappedProductId);

      console.log(`🗑️  Inventory deleted for ${mappedProductId}`);

      revalidatePath('/webshop');
      revalidatePath('/collection');
      revalidatePath('/');

      return NextResponse.json({ 
        success: true, 
        message: 'Inventory deleted',
        productId: mappedProductId
      });
    } else {
      console.warn(`⚠️  Unknown inventory action: ${inventoryAction}`);
      return NextResponse.json({ 
        success: false, 
        message: `Unknown inventory action: ${inventoryAction}` 
      }, { status: 400 });
    }
  }

  if (action === 'price.deleted') {
    const campaignId = body.priceUpdate?.campaignId;
    
    if (!campaignId) {
      console.error('❌ Missing campaignId for price.deleted');
      return NextResponse.json({ 
        success: false, 
        message: 'Missing campaignId' 
      }, { status: 400 });
    }

    const result = await expireCampaignPrice(TENANT_ID, campaignId);
    
    if (result.success) {
      revalidatePath('/webshop');
      revalidatePath('/collection');
    }

    return NextResponse.json({ 
      success: result.success, 
      message: result.message 
    });
  }

  // Handle campaign metadata events (legacy support)
  const c = body.campaign;
  if (action === 'deleted' && c?.id) {
    deleteCampaign(c.id);
  } else if (action === 'created' || action === 'updated') {
    if (c) upsertCampaign(c);
  }

  revalidatePath('/');
  revalidatePath('/collection');
  revalidatePath('/webshop');

  return NextResponse.json({ 
    success: true, 
    message: 'Campaign webhook processed', 
    action 
  });
}

// GET endpoint - return active campaign prices
export async function GET() {
  try {
    const campaigns = await getActiveCampaignPrices(TENANT_ID);
    
    return NextResponse.json({
      success: true,
      campaigns,
      count: campaigns.length
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ 
      success: false, 
      campaigns: [], 
      count: 0 
    }, { status: 500 });
  }
}


