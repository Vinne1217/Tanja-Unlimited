import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> }
) {
  try {
    const { tenant, id: productId } = await params;

    if (!tenant || !productId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID and product ID are required' },
        { status: 400 }
      );
    }

    // Fetch product from Source Database Storefront API
    const sourceBase = process.env.SOURCE_DATABASE_URL ?? 'https://source-database.onrender.com';
    const response = await fetch(`${sourceBase}/storefront/${tenant}/product/${encodeURIComponent(productId)}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenant
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }
      console.error(`Source Database Storefront API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch product' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error fetching storefront product:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch product',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

