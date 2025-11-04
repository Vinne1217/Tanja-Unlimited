import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { upsertCampaign, deleteCampaign } from '@/lib/campaigns';

export async function POST(req: NextRequest) {
  // Verify Authorization header with FRONTEND_API_KEY
  const auth = req.headers.get('authorization') ?? '';
  const expectedKey = process.env.FRONTEND_API_KEY || process.env.CUSTOMER_API_KEY;
  
  if (auth !== `Bearer ${expectedKey}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Get idempotency key (prevents duplicate processing)
  const idempotencyKey = req.headers.get('idempotency-key');

  // Parse campaign data from request body
  const campaign = await req.json();

  // Handle campaign sync based on status or action
  if (campaign.status === 'deleted' || campaign.action === 'deleted') {
    deleteCampaign(campaign.campaignId || campaign.id);
  } else {
    // Upsert campaign (create or update)
    upsertCampaign(campaign);
  }

  // Revalidate relevant pages to show updated campaigns
  revalidatePath('/');
  revalidatePath('/collection');
  revalidatePath('/webshop');

  return NextResponse.json({ 
    success: true, 
    message: 'Campaign synced successfully',
    campaignId: campaign.campaignId || campaign.id,
    idempotencyKey 
  });
}

