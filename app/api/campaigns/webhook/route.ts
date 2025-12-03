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

  console.log('📦 Campaign webhook received');
  console.log('📦 Payload:', JSON.stringify(body, null, 2));

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
    try {
      // Support both formats:
      // 1. Source Portal format: fields directly on body (priceId, productId, campaignId, etc.)
      // 2. Legacy format: nested in body.priceUpdate
      let priceUpdate: {
        stripePriceId: string;
        originalProductId: string;
        campaignId: string;
        campaignName?: string;
        metadata?: Record<string, any>;
      };

      if (body.priceUpdate) {
        // Legacy format
        priceUpdate = {
          stripePriceId: body.priceUpdate.stripePriceId,
          originalProductId: body.priceUpdate.originalProductId,
          campaignId: body.priceUpdate.campaignId,
          campaignName: body.priceUpdate.campaignName,
          metadata: body.priceUpdate.metadata,
        };
      } else {
        // Source Portal format: fields directly on body
        const stripePriceId = body.priceId || (body.stripePriceIds && body.stripePriceIds[0]);
        const productId = body.productId;
        const campaignId = body.campaignId;

        console.log('🔍 Parsed data:', {
          action,
          priceId: stripePriceId,
          productId,
          campaignId,
          campaignName: body.campaignName,
          discountPercent: body.discountPercent,
          stripePriceIdsCount: body.stripePriceIds?.length,
        });

        // Validate required fields
        if (!stripePriceId) {
          console.error('❌ Missing priceId or stripePriceIds in webhook payload');
          return NextResponse.json({ 
            success: false, 
            message: 'Missing required field: priceId or stripePriceIds',
            error: 'No price ID found in payload'
          }, { status: 400 });
        }

        if (!productId) {
          console.error('❌ Missing productId in webhook payload');
          return NextResponse.json({ 
            success: false, 
            message: 'Missing required field: productId',
            error: 'No product ID found in payload'
          }, { status: 400 });
        }

        if (!campaignId) {
          console.error('❌ Missing campaignId in webhook payload');
          return NextResponse.json({ 
            success: false, 
            message: 'Missing required field: campaignId',
            error: 'No campaign ID found in payload'
          }, { status: 400 });
        }

        // Check price ID format
        console.log('🔍 Price ID format check:', {
          priceId: stripePriceId,
          startsWithPrice: stripePriceId?.startsWith('price_'),
          length: stripePriceId?.length
        });

        priceUpdate = {
          stripePriceId,
          originalProductId: productId,
          campaignId,
          campaignName: body.campaignName,
          metadata: {
            discount_percent: body.discountPercent,
            ...body.metadata,
          },
        };
      }

      // Validate priceUpdate object
      if (!priceUpdate.stripePriceId || !priceUpdate.originalProductId || !priceUpdate.campaignId) {
        console.error('❌ Missing required price fields:', priceUpdate);
        return NextResponse.json({ 
          success: false, 
          message: 'Missing required fields',
          error: `Missing: ${!priceUpdate.stripePriceId ? 'stripePriceId ' : ''}${!priceUpdate.originalProductId ? 'originalProductId ' : ''}${!priceUpdate.campaignId ? 'campaignId' : ''}`
        }, { status: 400 });
      }

      console.log('✅ Validated priceUpdate:', {
        stripePriceId: priceUpdate.stripePriceId,
        productId: priceUpdate.originalProductId,
        campaignId: priceUpdate.campaignId,
        campaignName: priceUpdate.campaignName,
      });

      // Store campaign price
      const result = await storeCampaignPrice(TENANT_ID, priceUpdate, eventId);
      
      if (result.success) {
        console.log('✅ Successfully stored campaign');
        // Revalidate pages to show new campaign prices
        revalidatePath('/webshop');
        revalidatePath('/collection');
        revalidatePath('/');
      } else {
        console.error('❌ Failed to store campaign:', result.message);
      }

      return NextResponse.json({ 
        success: result.success, 
        message: result.message,
        priceId: priceUpdate.stripePriceId,
        productId: priceUpdate.originalProductId,
        campaignId: priceUpdate.campaignId,
        error: result.success ? undefined : result.message
      });
    } catch (error) {
      console.error('❌ Campaign webhook error:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to store campaign price',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
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
    try {
      // Support both formats
      const campaignId = body.campaignId || body.priceUpdate?.campaignId;
      
      if (!campaignId) {
        console.error('❌ Missing campaignId for price.deleted');
        console.error('📦 Received body:', JSON.stringify(body, null, 2));
        return NextResponse.json({ 
          success: false, 
          message: 'Missing campaignId',
          error: 'No campaignId found in payload'
        }, { status: 400 });
      }

      console.log(`🗑️  Expiring campaign: ${campaignId}`);
      const result = await expireCampaignPrice(TENANT_ID, campaignId);
      
      if (result.success) {
        console.log(`✅ Successfully expired campaign: ${campaignId}`);
        revalidatePath('/webshop');
        revalidatePath('/collection');
      } else {
        console.error(`❌ Failed to expire campaign: ${campaignId}`, result.message);
      }

      return NextResponse.json({ 
        success: result.success, 
        message: result.message,
        campaignId,
        error: result.success ? undefined : result.message
      });
    } catch (error) {
      console.error('❌ Error expiring campaign:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to expire campaign',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
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


