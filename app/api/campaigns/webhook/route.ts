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

  // Handle inventory events (optional - only for cache revalidation)
  // NOTE: We now use Storefront API directly, so inventory webhooks are optional
  // They can be used to trigger cache revalidation, but we don't store inventory locally
  if (action?.startsWith('inventory.')) {
    const inventoryAction = action.replace('inventory.', ''); // 'updated', 'created', 'deleted'
    const inventoryUpdate = body.inventory || body.item;
    
    console.log(`📨 Inventory webhook received (for cache revalidation):`, {
      action: inventoryAction,
      productId: inventoryUpdate?.productId || inventoryUpdate?.id,
      variantCount: inventoryUpdate?.variants?.length || 0
    });
    
    // Get product ID for cache revalidation
    let productId = inventoryUpdate?.productId || inventoryUpdate?.id;
    
    if (productId) {
      // Map customer portal product ID to Tanja product ID
      const { mapProductId } = await import('@/lib/inventory-mapping');
      const mappedProductId = mapProductId(productId);
      
      // Revalidate product pages to refresh Storefront API cache
      revalidatePath('/webshop');
      revalidatePath('/collection');
      revalidatePath('/');
      
      // Optionally revalidate specific product page
      if (mappedProductId) {
        revalidatePath(`/webshop/${mappedProductId}`);
      }
      
      console.log(`✅ Cache revalidated for product ${mappedProductId} (inventory ${inventoryAction})`);
    }
    
    // Return success - we don't store inventory locally anymore
    return NextResponse.json({ 
      success: true, 
      message: `Inventory ${inventoryAction} processed (cache revalidated)`,
      note: 'Inventory is now fetched from Storefront API directly'
    });
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


