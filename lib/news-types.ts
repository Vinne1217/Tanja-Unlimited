// Types for News API from Source Database

export type NewsType = 'alert' | 'campaign' | 'info';

export interface NewsItem {
  id: string;
  type: NewsType;
  title: string;
  body: string;
  startAt?: string;
  endAt?: string;
  published?: boolean; // Optional - backend already filters by published
  createdAt?: string; // Optional - not always in API response
  updatedAt?: string; // Optional - not always in API response
}

export interface NewsApiResponse {
  success: boolean;
  data: NewsItem[];
  message?: string;
}

