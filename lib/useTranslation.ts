'use client';

import { useSearchParams } from 'next/navigation';
import { translations, Locale } from './translations';

export function useTranslation() {
  const searchParams = useSearchParams();
  const locale = (searchParams.get('lang') || 'en') as Locale;
  
  // Get translation object for current locale
  const t = translations[locale] || translations.en;
  
  return {
    t,
    locale,
    translations: translations[locale] || translations.en
  };
}

