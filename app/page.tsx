import HomePageClient from './HomePageClient';
import { fetchNews } from '@/lib/news';
import { NewsItem } from '@/lib/news-types';

// Mark as dynamic to support useSearchParams
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Hämta nyheter på serversidan med error handling
  let newsItems: NewsItem[] = [];
  let latestNews: NewsItem | null = null;
  try {
    const allNews = await fetchNews();
    console.log('HomePage: Fetched news:', {
      count: allNews.length,
      items: allNews.map(n => ({ id: n.id, title: n.title, type: n.type }))
    });
    latestNews = allNews.length > 0 ? allNews[0] : null;
    newsItems = allNews.slice(0, 3); // Visa de 3 senaste
    console.log('HomePage: Passing to client:', {
      latestNews: latestNews ? { id: latestNews.id, title: latestNews.title } : null,
      count: newsItems.length,
      items: newsItems.map(n => ({ id: n.id, title: n.title }))
    });
  } catch (error) {
    console.error('HomePage: Failed to fetch news:', error);
  }

  return <HomePageClient newsItems={newsItems} latestNews={latestNews} />;
}


