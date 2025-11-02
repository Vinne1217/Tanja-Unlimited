import { NextRequest, NextResponse } from 'next/server';
import { sourceFetch } from '@/lib/source';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await sourceFetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return new NextResponse(await res.text(), { status: res.status });
}


