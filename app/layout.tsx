import './globals.css';
import type { ReactNode } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Phone, Mail, Facebook, Instagram, Linkedin } from 'lucide-react';

export const metadata = {
  title: 'Tanja Unlimited – Art-Forward Textiles & Calligraphy',
  description: 'Sophisticated, handcrafted fashion from Rajasthan. Reversible jackets, silk textiles, and calligraphy art.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <body className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-ivory/95 backdrop-blur-sm border-b border-warmOchre/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            {/* Top bar */}
            <div className="flex items-center justify-between py-3 text-xs text-softCharcoal border-b border-warmOchre/10">
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3" />
                <a href="tel:+46706332220" className="hover:text-warmOchre transition">
                  +46 706 332 220
                </a>
              </div>
              <LanguageSwitcher />
            </div>
            
            {/* Main header */}
            <div className="flex items-center justify-between py-6">
              <a href="/" className="group">
                <h1 className="text-3xl font-serif font-medium text-deepIndigo tracking-tight">
                  Tanja Unlimited
                </h1>
                <p className="text-xs text-softCharcoal tracking-widest uppercase mt-1">
                  Art-Forward Textiles
                </p>
              </a>
              
              <nav className="hidden lg:flex items-center gap-8 text-sm font-medium tracking-wide">
                <a href="/" className="text-warmBlack hover:text-warmOchre transition-colors duration-200">
                  Home
                </a>
                <a href="/collection" className="text-warmBlack hover:text-warmOchre transition-colors duration-200">
                  Collection
                </a>
                <a href="/events" className="text-warmBlack hover:text-warmOchre transition-colors duration-200">
                  Exhibitions
                </a>
                <a href="/hand-lettering" className="text-warmBlack hover:text-warmOchre transition-colors duration-200">
                  Calligraphy
                </a>
                <a href="/about" className="text-warmBlack hover:text-warmOchre transition-colors duration-200">
                  About
                </a>
                <a href="/contact" className="text-warmBlack hover:text-warmOchre transition-colors duration-200">
                  Contact
                </a>
                <a 
                  href="/book" 
                  className="px-6 py-2 bg-deepIndigo text-ivory hover:bg-indigoDeep transition-all duration-300"
                >
                  Book Visit
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-deepIndigo text-ivory relative overflow-hidden">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 pattern-block-print opacity-50"></div>
          
          <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-16">
            <div className="grid md:grid-cols-12 gap-12 mb-12">
              {/* Brand */}
              <div className="md:col-span-5">
                <h3 className="text-2xl font-serif mb-4">Tanja Unlimited</h3>
                <p className="text-warmIvory/80 leading-relaxed mb-6 max-w-md">
                  Hand-quilted textiles from Rajasthan, transformed into wearable art. 
                  Each piece tells a story of craftsmanship, sustainability, and cultural heritage.
                </p>
                <div className="space-y-2 text-sm text-warmIvory/70">
                  <p>Molinsgatan 13</p>
                  <p>411 33 Göteborg, Sweden</p>
                </div>
              </div>
              
              {/* Contact */}
              <div className="md:col-span-3">
                <h4 className="text-sm uppercase tracking-widest mb-4 text-warmOchre">Contact</h4>
                <div className="space-y-3">
                  <a 
                    href="tel:+46706332220" 
                    className="flex items-center gap-2 text-sm hover:text-warmOchre transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>+46 70 633 22 20</span>
                  </a>
                  <a 
                    href="mailto:info@tanjaunlimited.se" 
                    className="flex items-center gap-2 text-sm hover:text-warmOchre transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>info@tanjaunlimited.se</span>
                  </a>
                </div>
              </div>
              
              {/* Social & Links */}
              <div className="md:col-span-4">
                <h4 className="text-sm uppercase tracking-widest mb-4 text-warmOchre">Connect</h4>
                <div className="flex gap-4 mb-6">
                  <a 
                    href="https://www.facebook.com/tanjaunlimited" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 border border-ivory/20 hover:border-warmOchre hover:bg-warmOchre/10 transition-all duration-300"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a 
                    href="https://www.instagram.com/tanjaunlimited/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 border border-ivory/20 hover:border-warmOchre hover:bg-warmOchre/10 transition-all duration-300"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a 
                    href="https://se.linkedin.com/company/tanja-unlimited-ab" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 border border-ivory/20 hover:border-warmOchre hover:bg-warmOchre/10 transition-all duration-300"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
                <p className="text-xs text-warmIvory/60">
                  Member of Swedish Chamber of Commerce India (SCCI)
                </p>
              </div>
            </div>
            
            {/* Bottom bar */}
            <div className="pt-8 border-t border-ivory/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-warmIvory/60">
              <p>© {new Date().getFullYear()} Tanja Unlimited AB. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="/about" className="hover:text-warmOchre transition-colors">About</a>
                <a href="/contact" className="hover:text-warmOchre transition-colors">Contact</a>
                <a href="/events" className="hover:text-warmOchre transition-colors">Events</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}


