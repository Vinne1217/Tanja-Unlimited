import HomePageClient from './HomePageClient';
import { fetchNews } from '@/lib/news';

// Mark as dynamic to support useSearchParams
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Hämta nyheter på serversidan
  const allNews = await fetchNews();
  const newsItems = allNews.slice(0, 3); // Visa de 3 senaste

  return <HomePageClient newsItems={newsItems} />;
}


