import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route for product images to bypass CORS issues
 * Usage: /api/images/proxy?url=https://source-database.../uploads/image.webp
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  // Validate that the URL is from Source Portal
  const allowedHostname = 'source-database-809785351172.europe-north1.run.app';
  try {
    const url = new URL(imageUrl);
    if (url.hostname !== allowedHostname) {
      return NextResponse.json(
        { error: 'Invalid image source' },
        { status: 403 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400 }
    );
  }

  try {
    // Fetch the image from Source Portal
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Tanja-Unlimited-Image-Proxy/1.0',
      },
    });

    if (!imageResponse.ok) {
      console.error(`❌ Failed to fetch image: ${imageUrl} - Status: ${imageResponse.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: imageResponse.status }
      );
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Access-Control-Allow-Origin': '*', // Allow CORS
      },
    });
  } catch (error) {
    console.error('❌ Error proxying image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

