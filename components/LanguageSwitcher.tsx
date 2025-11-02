'use client';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

const locales = ['sv', 'de', 'en'] as const;

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const current = searchParams.get('lang') || 'sv';

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
          className={`px-2 py-1 border rounded ${current === l ? 'bg-cream border-ochreRed' : 'bg-white'}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}


