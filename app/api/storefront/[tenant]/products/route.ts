import { NextRequest, NextResponse } from 'next/server';
import { sourceFetch } from '@/lib/source';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> }
) {
  try {
    const { tenant } = await params;

    // Validate tenant
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Fetch products from Source Database Storefront API
    const sourceBase = process.env.SOURCE_DATABASE_URL ?? 'https://source-database.onrender.com';
    const response = await fetch(`${sourceBase}/storefront/${tenant}/products`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenant
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`Source Database Storefront API error: ${response.status} ${response.statusText}`);
      // Fallback to empty products if Source API fails
      return NextResponse.json({
        success: true,
        tenant,
        generatedAt: new Date().toISOString(),
        version: 'v1',
        products: [],
        categories: [],
        meta: {
          totalProducts: 0,
          totalVariants: 0
        }
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    const data = await response.json();

    // Return the data from Source Database (it already has the correct format)
    return NextResponse.json(data, {
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

