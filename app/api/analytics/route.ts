import { NextRequest, NextResponse } from 'next/server';
import { sourceFetch } from '@/lib/source';

export async function POST(req: NextRequest) {
  const { events } = await req.json();
  const res = await sourceFetch('/api/ingest/analytics', {
    method: 'POST',
    body: JSON.stringify({ tenant: process.env.SOURCE_TENANT_ID ?? 'tanja', events })
  });
  return new NextResponse(await res.text(), { status: res.status });
}


