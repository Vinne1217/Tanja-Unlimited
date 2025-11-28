import { NextRequest, NextResponse } from 'next/server';
import { getAllStorefrontProducts, getStorefrontCategories } from '@/lib/storefront-api';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> }
) {
  try {
    const { tenant } = await params;

    // Validate tenant (optional - you can add tenant validation here)
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Get all products
    const products = await getAllStorefrontProducts();
    const categories = getStorefrontCategories();

    return NextResponse.json({
      success: true,
      tenant,
      generatedAt: new Date().toISOString(),
      version: 'v1',
      products,
      categories,
      meta: {
        totalProducts: products.length,
        totalVariants: products.reduce((sum, p) => sum + p.variants.length, 0)
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error fetching storefront products:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

