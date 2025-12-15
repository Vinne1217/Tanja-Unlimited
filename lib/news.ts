import { NewsItem, NewsApiResponse } from './news-types';

const PUBLIC_NEWS_API_URL = 'https://source-database.onrender.com/public/news';

export async function fetchNews(): Promise<NewsItem[]> {
  const apiKey = process.env.FRONTEND_API_KEY;
  
  if (!apiKey) {
    console.warn('FRONTEND_API_KEY is not set');
    return [];
  }

  try {
    const res = await fetch(PUBLIC_NEWS_API_URL, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      // Next.js cache options - revalidera varje minut
      next: { revalidate: 60 },
    });

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
    console.error('Failed to fetch news:', err);
    return [];
  }
}

