import './globals.css';
import type { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AIAssistant from '@/components/AIAssistant';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import { CartProvider } from '@/lib/cart-context';
export const metadata = {
  title: 'Tanja Unlimited – Art-Forward Textiles & Calligraphy',
  description: 'Sophisticated, handcrafted fashion from Rajasthan. Reversible jackets, silk textiles, and calligraphy art.',
};

// Force all pages to be dynamic to support useSearchParams throughout the app
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AnalyticsProvider>
          <CartProvider>
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


