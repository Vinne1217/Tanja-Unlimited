'use client';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

const locales = ['en', 'sv', 'de'] as const;

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const current = searchParams.get('lang') || 'en'; // Default to English

  function setLang(lang: string) {
    const params = new URLSearchParams(searchParams as any);
    params.set('lang', lang);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-3 py-1 border transition-all duration-200 ${
            current === l 
              ? 'bg-ochre border-ochre text-indigo font-medium' 
              : 'bg-transparent border-graphite/20 text-graphite hover:border-ochre hover:text-ochre'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}


