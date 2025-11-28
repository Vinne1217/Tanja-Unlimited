import { NextRequest, NextResponse } from 'next/server';
import { getStorefrontProductById } from '@/lib/storefront-api';

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

    // Get product by ID/SKU
    const product = await getStorefrontProductById(productId);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tenant,
      product,
      generatedAt: new Date().toISOString(),
      version: 'v1'
    }, {
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

