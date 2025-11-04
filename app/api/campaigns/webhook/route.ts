import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { upsertCampaign, deleteCampaign } from '@/lib/campaigns';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  // Accept either FRONTEND_API_KEY (correct name) or CUSTOMER_API_KEY (legacy)
  const expectedKey = process.env.FRONTEND_API_KEY || process.env.CUSTOMER_API_KEY;
  if (auth !== `Bearer ${expectedKey}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const body = await req.json();
  const action: string = body.action;
  const c = body.campaign;
  if (action === 'deleted') deleteCampaign(c.id);
  else if (action === 'created' || action === 'updated' || action === 'price.updated' || action === 'ping') upsertCampaign(c);
  revalidatePath('/');
  revalidatePath('/collection');
  return NextResponse.json({ success: true, message: 'Campaign updated successfully', action });
}


