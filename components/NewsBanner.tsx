'use client';

import { NewsItem } from '@/lib/news-types';

function getTypeLabel(type: string): string {
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

interface NewsBannerProps {
  news: NewsItem | null;
}

export default function NewsBanner({ news }: NewsBannerProps) {
  // Debug logging
  console.log('NewsBanner: Received news:', news ? {
    id: news.id,
    title: news.title,
    type: news.type
  } : 'null');
  
  if (!news) {
    console.log('NewsBanner: No news, returning null');
    return null;
  }

  const label = getTypeLabel(news.type);
  const style = getTypeStyle(news.type);
  const displayText = news.title + (news.body ? ' – ' + news.body : '');

  return (
    <div
      className="news-banner flex items-center gap-2 px-4 py-2 text-sm"
      style={{
        backgroundColor: style.bg,
        color: style.fg,
        display: 'flex',
      }}
    >
      <span className="news-banner-type font-semibold uppercase text-xs tracking-wider">
        {label}
      </span>
      <span className="news-banner-text">{displayText}</span>
    </div>
  );
}

