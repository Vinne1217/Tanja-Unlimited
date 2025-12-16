import './globals.css';
import type { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AIAssistant from '@/components/AIAssistant';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import { CartProvider } from '@/lib/cart-context';
import NewsBanner from '@/components/NewsBanner';
import { fetchNews } from '@/lib/news';

export const metadata = {
  title: 'Tanja Unlimited – Art-Forward Textiles & Calligraphy',
  description: 'Sophisticated, handcrafted fashion from Rajasthan. Reversible jackets, silk textiles, and calligraphy art.',
};

// Force all pages to be dynamic to support useSearchParams throughout the app
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Hämta senaste nyheten på serversidan med timeout-hantering
  // Om news-fetching timeoutar, fortsätt utan news (blockerar inte renderingen)
  let latestNews = null;
  try {
    const allNews = await fetchNews();
    latestNews = allNews.length > 0 ? allNews[0] : null;
  } catch (error) {
    // Ignorera fel - fortsätt utan news
    console.warn('Failed to load news in layout:', error);
  }

  return (
    <html lang="en">
      <body className="min-h-screen">
        <AnalyticsProvider>
          <CartProvider>
            <NewsBanner news={latestNews} />
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
            <AIAssistant />
          </CartProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}


