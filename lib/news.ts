import { NewsItem, NewsApiResponse } from './news-types';
import { SOURCE_BASE } from './source';

const FETCH_TIMEOUT = 5000; // 5 sekunder timeout för att undvika att blockera renderingen

export async function fetchNews(): Promise<NewsItem[]> {
  const apiKey = process.env.TANJA_NYHETER_API_KEY;
  
  // Environment Variable Check - Detailed logging for debugging
  console.log('Environment Variable Check:', {
    variableName: 'TANJA_NYHETER_API_KEY',
    exists: !!apiKey,
    length: apiKey?.length || 0,
    preview: apiKey ? apiKey.substring(0, 20) + '...' : 'MISSING',
    startsWith_ek_live: apiKey?.startsWith('ek_live_') || false,
    startsWith_ek_test: apiKey?.startsWith('ek_test_') || false
  });
  
  if (!apiKey) {
    console.warn('TANJA_NYHETER_API_KEY is not set');
    return [];
  }

  try {
    // Använd samma SOURCE_BASE som resten av koden (Google Cloud Run)
    const PUBLIC_NEWS_API_URL = `${SOURCE_BASE}/public/news`;
    
    // Log test request details
    console.log('Test Request:', {
      url: PUBLIC_NEWS_API_URL,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      apiKeyPreview: apiKey?.substring(0, 30) + '...'
    });
    
    // Skapa en AbortController för timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const res = await fetch(PUBLIC_NEWS_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      // Next.js cache options - revalidera varje minut
      next: { revalidate: 60 },
    });

    clearTimeout(timeoutId);

    // Log response status
    console.log('Test Response:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok
    });

    if (!res.ok) {
      // Log full error response including headers and body
      const errorText = await res.text();
      let errorJson: any = {};
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // Not JSON, keep errorJson as empty object
      }
      
      console.error('Full News API Error Response:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        bodyText: errorText,
        bodyJson: errorJson,
        errorCode: errorJson.code,  // This is the important one!
        errorMessage: errorJson.message
      });
      return [];
    }

    const json: NewsApiResponse = await res.json();
    
    // Log successful response body for debugging
    console.log('Test Response Body:', json);

    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
      return [];
    }

    return json.data;
  } catch (err) {
    // Ignorera timeout-fel tyst (det är ok om news inte laddas)
    if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('timeout') || err.message.includes('HeadersTimeoutError'))) {
      console.warn('News fetch timeout from Google Cloud Run - continuing without news');
    } else {
      console.error('Failed to fetch news:', err);
    }
    return [];
  }
}

