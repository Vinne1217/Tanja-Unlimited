'use client';

import { NewsItem } from '@/lib/news-types';

function newsTypeLabel(type: string): string {
  switch (type) {
    case 'alert':
      return 'Varning';
    case 'campaign':
      return 'Kampanj';
    default:
      return 'Info';
  }
}

function getTypeStyle(type: string): { bg: string; fg: string } {
  switch (type) {
    case 'alert':
      return { bg: '#fee2e2', fg: '#991b1b' };
    case 'campaign':
      return { bg: '#ecfdf5', fg: '#065f46' };
    default:
      return { bg: '#eff6ff', fg: '#1d4ed8' };
  }
}

interface NewsSectionProps {
  newsItems: NewsItem[];
}

export default function NewsSection({ newsItems }: NewsSectionProps) {
  // Debug logging
  console.log('NewsSection: Received items:', {
    count: newsItems?.length || 0,
    items: newsItems?.map(n => ({ id: n.id, title: n.title, type: n.type, endAt: n.endAt })) || [],
    isArray: Array.isArray(newsItems),
    newsItems: newsItems
  });
  
  // Backend already filters by published and date ranges, so we trust the data
  // No need for client-side date filtering - backend handles it
  const validNewsItems = newsItems || [];
  
  if (validNewsItems.length === 0) {
    console.log('NewsSection: No items, returning null');
    return null;
  }

  return (
    <section className="news-section py-16 bg-ivory">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="news-section-header mb-8">
          <h2 className="text-4xl font-serif font-medium text-indigo mb-4">Nyheter</h2>
        </div>
        <div className="news-section-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {validNewsItems.map((item) => {
            console.log('NewsSection: Rendering item', item.id, item.title);
            const typeStyle = getTypeStyle(item.type);
            return (
              <article
                key={item.id}
                className="news-section-card bg-cream rounded-xl p-5 border border-ochre/20 shadow-sm hover:border-ochre transition-all duration-300"
              >
                <div
                  className="news-section-card-type inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider mb-3"
                  style={{
                    backgroundColor: typeStyle.bg,
                    color: typeStyle.fg,
                  }}
                >
                  {newsTypeLabel(item.type)}
                </div>
                <h3 className="news-section-card-title text-lg font-serif font-semibold text-indigo mb-2">
                  {item.title || ''}
                </h3>
                <p className="news-section-card-body text-sm text-graphite leading-relaxed font-light">
                  {item.body || ''}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

