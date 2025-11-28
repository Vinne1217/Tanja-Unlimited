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

    // Get Source Database URL - throws if missing
    const sourceBase = getSourceDatabaseUrl();
    const apiUrl = `${sourceBase}/storefront/${tenant}/products`;
    
    console.log(`[Storefront API] Fetching products from: ${apiUrl}`);
    console.log(`[Storefront API] Tenant: ${tenant}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenant
      },
      cache: 'no-store'
    });

    console.log(`[Storefront API] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error(`[Storefront API] Source Database error: ${response.status} ${response.statusText}`);
      console.error(`[Storefront API] Error details: ${errorText}`);
      
      // Return error response instead of silently returning empty products
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch products from Source Database',
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
    console.log(`[Storefront API] Products received: ${data.products?.length || 0}`);

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
    
    console.error('[Storefront API] Error fetching storefront products:', error);
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

