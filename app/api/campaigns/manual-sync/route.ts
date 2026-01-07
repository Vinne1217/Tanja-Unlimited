import { NextRequest, NextResponse } from 'next/server';
import { sourceFetch, SOURCE_BASE, TENANT } from '@/lib/source';
import { upsertCampaign } from '@/lib/campaigns';
import { revalidatePath } from 'next/cache';

/**
 * Manual campaign sync endpoint
 * Fetches all active campaigns from Source Portal and syncs them to local storage
 * 
 * This is useful when frontend sync is not configured or failing.
 * Can be called manually or via cron job.
 */
export async function POST(req: NextRequest) {
  // Verify Authorization header
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
    console.warn('❌ Unauthorized manual sync attempt');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const tenantId = process.env.SOURCE_TENANT_ID ?? TENANT;

  try {
    console.log(`🔄 Manual campaign sync started for tenant: ${tenantId}`);
    
    // Fetch all campaigns from Source Portal
    const response = await sourceFetch(`/api/campaigns?tenant=${tenantId}`, {
      headers: {
        'X-Tenant': tenantId,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Failed to fetch campaigns: ${response.status}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to fetch campaigns: ${response.status}`,
          status: response.status
        },
        { status: response.status }
      );
    }

    const campaigns = await response.json();
    const campaignsArray = Array.isArray(campaigns) ? campaigns : campaigns.campaigns || [];
    
    console.log(`📦 Fetched ${campaignsArray.length} campaigns from Source Portal`);

    let syncedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Sync each campaign
    for (const campaign of campaignsArray) {
      try {
        const campaignId = campaign.campaignId || campaign.id;
        
        if (!campaignId) {
          console.warn('⚠️ Campaign missing ID, skipping:', campaign);
          skippedCount++;
          continue;
        }

        // Only sync active campaigns
        if (campaign.status !== 'active') {
          console.log(`⏭️ Skipping inactive campaign: ${campaignId} (status: ${campaign.status})`);
          skippedCount++;
          continue;
        }

        // Validate stripePriceIds
        if (!campaign.stripePriceIds || campaign.stripePriceIds.length === 0) {
          console.warn(`⚠️ Campaign ${campaignId} has no stripePriceIds, syncing anyway`);
        } else {
          console.log(`✅ Campaign ${campaignId} has ${campaign.stripePriceIds.length} price IDs`);
        }

        // Upsert campaign
        upsertCampaign(campaign);
        syncedCount++;
        
        console.log(`✅ Synced campaign: ${campaignId} - ${campaign.name}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to sync campaign:`, error);
        errors.push(errorMsg);
      }
    }

    // Revalidate pages
    revalidatePath('/');
    revalidatePath('/collection');
    revalidatePath('/webshop');

    console.log(`✅ Manual sync completed: ${syncedCount} synced, ${skippedCount} skipped, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      message: 'Manual sync completed',
      synced: syncedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
      total: campaignsArray.length
    });
  } catch (error) {
    console.error('❌ Manual sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

