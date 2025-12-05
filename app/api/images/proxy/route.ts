import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route for product images to bypass CORS issues
 * Usage: /api/images/proxy?url=https://source-database.../uploads/image.webp
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const encodedUrl = searchParams.get('url');

  if (!encodedUrl) {
    console.error('❌ Image proxy: Missing url parameter');
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  // Decode the URL
  let imageUrl: string;
  try {
    imageUrl = decodeURIComponent(encodedUrl);
    console.log('🖼️ Image proxy: Requested URL:', imageUrl);
  } catch (error) {
    console.error('❌ Image proxy: Failed to decode URL:', encodedUrl);
    return NextResponse.json(
      { error: 'Invalid URL encoding' },
      { status: 400 }
    );
  }

  // Validate that the URL is from Source Portal
  const allowedHostname = 'source-database-809785351172.europe-north1.run.app';
  try {
    const url = new URL(imageUrl);
    if (url.hostname !== allowedHostname) {
      console.error('❌ Image proxy: Invalid hostname:', url.hostname);
      return NextResponse.json(
        { error: 'Invalid image source' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('❌ Image proxy: Invalid URL format:', imageUrl, error);
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400 }
    );
  }

  try {
    console.log('🔄 Image proxy: Fetching image from Source Portal...');
    // Fetch the image from Source Portal with X-Tenant header (required for authentication)
    const TENANT_ID = 'tanjaunlimited';
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Tanja-Unlimited-Image-Proxy/1.0',
        'X-Tenant': TENANT_ID, // ✅ Required for Source Portal authentication
      },
    });

    console.log('📦 Image proxy: Response status:', imageResponse.status, imageResponse.statusText);
    console.log('📦 Image proxy: Content-Type:', imageResponse.headers.get('content-type'));
    console.log('📦 Image proxy: Content-Length:', imageResponse.headers.get('content-length'));

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text().catch(() => 'Unable to read error');
      console.error(`❌ Image proxy: Failed to fetch image: ${imageUrl}`);
      console.error(`   Status: ${imageResponse.status} ${imageResponse.statusText}`);
      console.error(`   Response: ${errorText.substring(0, 200)}`);
      return NextResponse.json(
        { error: `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}` },
        { status: imageResponse.status }
      );
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/webp';
    
    console.log('✅ Image proxy: Successfully fetched image:', {
      size: imageBuffer.byteLength,
      contentType,
      url: imageUrl
    });

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Access-Control-Allow-Origin': '*', // Allow CORS
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('❌ Image proxy: Error proxying image:', error);
    console.error('   URL:', imageUrl);
    console.error('   Error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

