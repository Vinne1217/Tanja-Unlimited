import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { upsertCampaign, deleteCampaign } from '@/lib/campaigns';

export async function POST(req: NextRequest) {
  // Verify Authorization header with FRONTEND_API_KEY
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
    console.warn('❌ Unauthorized campaign sync attempt', {
      hasAuth: !!auth,
      authPrefix: auth.substring(0, 20),
      expectedPrefix: `Bearer ${expectedKey.substring(0, 5)}...`
    });
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get idempotency key (prevents duplicate processing)
  const idempotencyKey = req.headers.get('idempotency-key');
  
  // Optional: Verify X-Signature header if HMAC is configured
  const signature = req.headers.get('x-signature');
  if (process.env.CAMPAIGN_SYNC_HMAC_SECRET && signature) {
    // TODO: Implement HMAC verification if needed
    console.log('📝 X-Signature header received (HMAC verification not yet implemented)');
  }

  // Parse campaign data from request body
  let campaign;
  try {
    campaign = await req.json();
  } catch (error) {
    console.error('❌ Failed to parse campaign sync payload:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  console.log('📥 Campaign sync received:', {
    campaignId: campaign.campaignId || campaign.id,
    name: campaign.name,
    status: campaign.status,
    stripePriceIdsCount: campaign.stripePriceIds?.length || 0,
    idempotencyKey
  });

  // Validate required fields
  if (!campaign.campaignId && !campaign.id) {
    console.error('❌ Campaign sync missing campaignId/id');
    return NextResponse.json(
      { success: false, error: 'Missing required field: campaignId or id' },
      { status: 400 }
    );
  }

  const campaignId = campaign.campaignId || campaign.id;

  // Handle campaign sync based on status or action
  if (campaign.status === 'deleted' || campaign.action === 'deleted') {
    console.log(`🗑️ Deleting campaign: ${campaignId}`);
    deleteCampaign(campaignId);
    
    // Revalidate pages
    revalidatePath('/');
    revalidatePath('/collection');
    revalidatePath('/webshop');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Campaign deleted successfully',
      campaignId,
      idempotencyKey 
    });
  }

  // Validate stripePriceIds if provided (important for Stripe Connect)
  if (campaign.stripePriceIds && Array.isArray(campaign.stripePriceIds)) {
    console.log(`✅ Campaign has ${campaign.stripePriceIds.length} Stripe price IDs:`, {
      priceIds: campaign.stripePriceIds.slice(0, 3), // Log first 3
      total: campaign.stripePriceIds.length
    });
    
    // Warn if price IDs are missing (may indicate Stripe Connect issue)
    if (campaign.stripePriceIds.length === 0 && campaign.status === 'active') {
      console.warn(`⚠️ Active campaign ${campaignId} has no stripePriceIds - may indicate Stripe Connect price creation failure`);
    }
  } else if (campaign.status === 'active') {
    console.warn(`⚠️ Active campaign ${campaignId} missing stripePriceIds array`);
  }

  // Upsert campaign (create or update)
  try {
    upsertCampaign(campaign);
    console.log(`✅ Campaign synced successfully: ${campaignId}`);
  } catch (error) {
    console.error(`❌ Failed to sync campaign ${campaignId}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sync campaign',
        campaignId 
      },
      { status: 500 }
    );
  }

  // Revalidate relevant pages to show updated campaigns
  revalidatePath('/');
  revalidatePath('/collection');
  revalidatePath('/webshop');

  return NextResponse.json({ 
    success: true, 
    message: 'Campaign synced successfully',
    campaignId,
    idempotencyKey,
    stripePriceIdsCount: campaign.stripePriceIds?.length || 0
  });
}

