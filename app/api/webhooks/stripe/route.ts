import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const res = await fetch(`${process.env.SOURCE_DATABASE_URL}/webhooks/stripe-payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant': process.env.SOURCE_TENANT_ID ?? 'tanja'
    },
    body: raw
  });
  return new NextResponse(await res.text(), { status: res.status });
}


