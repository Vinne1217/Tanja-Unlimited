import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch('https://admin-portal-rn5z.onrender.com/api/statistics/ai-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return new NextResponse(await res.text(), { status: res.status });
}


