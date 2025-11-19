'use client';

import { Suspense } from 'react';
import { Phone } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import CartIcon from './CartIcon';
import { useTranslation } from '@/lib/useTranslation';

function HeaderContent() {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center justify-between py-3 text-xs text-graphite border-b border-ochre/10">
        <div className="flex items-center gap-2">
          <Phone className="w-3 h-3" />
          <a href="tel:+46706332220" className="hover:text-ochre transition">
            +46 706 332 220
          </a>
        </div>
        <LanguageSwitcher />
      </div>
      
      {/* Main header */}
      <div className="flex items-center justify-between py-6">
        <a href="/" className="group">
          <h1 className="text-3xl font-serif font-medium text-indigo tracking-tight">
            Tanja Unlimited
          </h1>
          <p className="text-xs text-graphite tracking-widest uppercase mt-1 font-light">
            Art-Forward Textiles
          </p>
        </a>
        
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium tracking-wider">
          <a href="/" className="text-warmBlack hover:text-ochre transition-colors duration-300">
            {t.nav.home}
          </a>
          <a href="/collection" className="text-warmBlack hover:text-ochre transition-colors duration-300">
            {t.nav.collection}
          </a>
          <a href="/events" className="text-warmBlack hover:text-ochre transition-colors duration-300">
            {t.nav.exhibitions}
          </a>
          <a href="/hand-lettering" className="text-warmBlack hover:text-ochre transition-colors duration-300">
            {t.nav.calligraphy}
          </a>
          <a href="/about" className="text-warmBlack hover:text-ochre transition-colors duration-300">
            {t.nav.about}
          </a>
          <a href="/contact" className="text-warmBlack hover:text-ochre transition-colors duration-300">
            {t.nav.contact}
          </a>
          <a 
            href="/webshop" 
            className="btn-primary"
          >
            {t.nav.webshop}
          </a>
          <CartIcon />
        </nav>
      </div>
    </>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-ivory/95 backdrop-blur-sm border-b border-ochre/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <Suspense fallback={
          <div className="py-3 text-xs text-graphite">Loading...</div>
        }>
          <HeaderContent />
        </Suspense>
      </div>
    </header>
  );
}

