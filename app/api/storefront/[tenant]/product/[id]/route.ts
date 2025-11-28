import { NextRequest, NextResponse } from 'next/server';

/**
 * Get Source Database URL - MANDATORY, no fallbacks
 * Throws error if missing to prevent silent failures
 */
function getSourceDatabaseUrl(): string {
  const url = process.env.SOURCE_DATABASE_URL;
  if (!url) {
    const error = 'SOURCE_DATABASE_URL environment variable is required. Set it to your Google Cloud Run Source Database URL.';
    console.error(`[Storefront API] ERROR: ${error}`);
    throw new Error(error);
  }
  return url;
}

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

    // Get Source Database URL - throws if missing
    const sourceBase = getSourceDatabaseUrl();
    const apiUrl = `${sourceBase}/storefront/${tenant}/product/${encodeURIComponent(productId)}`;
    
    console.log(`[Storefront API] Fetching product from: ${apiUrl}`);
    console.log(`[Storefront API] Tenant: ${tenant}, Product ID: ${productId}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenant
      },
      cache: 'no-store'
    });

    console.log(`[Storefront API] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }
      
      const errorText = await response.text().catch(() => 'No error details');
      console.error(`[Storefront API] Source Database error: ${response.status} ${response.statusText}`);
      console.error(`[Storefront API] Error details: ${errorText}`);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch product from Source Database',
          status: response.status,
          statusText: response.statusText,
          details: errorText
        },
        { 
          status: response.status || 502,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        }
      );
    }

    const data = await response.json();
    console.log(`[Storefront API] Product received: ${data.product?.id || 'none'}`);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    // Handle missing SOURCE_DATABASE_URL
    if (error instanceof Error && error.message.includes('SOURCE_DATABASE_URL')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'SOURCE_DATABASE_URL missing',
          message: error.message
        },
        { status: 500 }
      );
    }
    
    console.error('[Storefront API] Error fetching storefront product:', error);
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

