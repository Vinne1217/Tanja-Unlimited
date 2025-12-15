// Types for News API from Source Database

export type NewsType = 'alert' | 'campaign' | 'info';

export interface NewsItem {
  id: string;
  type: NewsType;
  title: string;
  body: string;
  startAt?: string;
  endAt?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewsApiResponse {
  success: boolean;
  data: NewsItem[];
  message?: string;
}

