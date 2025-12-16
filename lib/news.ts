import { NewsItem, NewsApiResponse } from './news-types';

const PUBLIC_NEWS_API_URL = 'https://source-database.onrender.com/public/news';
const FETCH_TIMEOUT = 5000; // 5 sekunder timeout för att undvika att blockera renderingen

export async function fetchNews(): Promise<NewsItem[]> {
  const apiKey = process.env.FRONTEND_API_KEY;
  
  if (!apiKey) {
    console.warn('FRONTEND_API_KEY is not set');
    return [];
  }

  try {
    // Skapa en AbortController för timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const res = await fetch(PUBLIC_NEWS_API_URL, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: controller.signal,
      // Next.js cache options - revalidera varje minut
      next: { revalidate: 60 },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn('News API returned HTTP', res.status);
      return [];
    }

    const json: NewsApiResponse = await res.json();

    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
      return [];
    }

    return json.data;
  } catch (err) {
    // Ignorera timeout-fel tyst (det är ok om news inte laddas)
    if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('timeout') || err.message.includes('HeadersTimeoutError'))) {
      console.warn('News fetch timeout from Render.com - continuing without news');
    } else {
      console.error('Failed to fetch news:', err);
    }
    return [];
  }
}

