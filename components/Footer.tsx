'use client';

import { Suspense } from 'react';
import { Phone, Mail, Facebook, Instagram, Linkedin } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

function FooterContent() {
  const { t } = useTranslation();

  return (
    <>
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid md:grid-cols-12 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <h3 className="text-2xl font-serif mb-4">Tanja Unlimited</h3>
            <p className="text-ivory/80 leading-relaxed mb-6 max-w-md font-light">
              {t.footer.description}
            </p>
            <div className="space-y-2 text-sm text-ivory/70 font-light">
              <p>Molinsgatan 13</p>
              <p>411 33 Göteborg, Sweden</p>
            </div>
          </div>
          
          {/* Contact */}
          <div className="md:col-span-3">
            <h4 className="text-sm uppercase tracking-widest mb-4 text-ochre">{t.footer.contact}</h4>
            <div className="space-y-3">
              <a 
                href="tel:+46706332220" 
                className="flex items-center gap-2 text-sm hover:text-ochre transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>+46 70 633 22 20</span>
              </a>
              <a 
                href="mailto:info@tanjaunlimited.se" 
                className="flex items-center gap-2 text-sm hover:text-ochre transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>info@tanjaunlimited.se</span>
              </a>
            </div>
          </div>
          
          {/* Social & Links */}
          <div className="md:col-span-4">
            <h4 className="text-sm uppercase tracking-widest mb-4 text-ochre">{t.footer.connect}</h4>
            <div className="flex gap-4 mb-6">
              <a 
                href="https://www.facebook.com/tanjaunlimited" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-ivory/10 hover:bg-ochre hover:text-indigo transition-all duration-300 group"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-ivory group-hover:text-indigo" fill="currentColor" />
              </a>
              <a 
                href="https://www.instagram.com/tanjaunlimited/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-ivory/10 hover:bg-ochre hover:text-indigo transition-all duration-300 group"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-ivory group-hover:text-indigo" />
              </a>
              <a 
                href="https://se.linkedin.com/company/tanja-unlimited-ab" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-ivory/10 hover:bg-ochre hover:text-indigo transition-all duration-300 group"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-ivory group-hover:text-indigo" fill="currentColor" />
              </a>
            </div>
            <p className="text-xs text-ivory/60 font-light">
              {t.footer.scci}
            </p>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="pt-8 border-t border-ivory/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-ivory/60 font-light">
          <p>© {new Date().getFullYear()} Tanja Unlimited AB. {t.footer.rights}</p>
          <div className="flex gap-6">
            <a href="/about" className="hover:text-ochre transition-colors">{t.nav.about}</a>
            <a href="/contact" className="hover:text-ochre transition-colors">{t.nav.contact}</a>
            <a href="/events" className="hover:text-ochre transition-colors">{t.nav.exhibitions}</a>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Footer() {
  return (
    <footer className="bg-indigo text-ivory relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 pattern-block-print opacity-50"></div>
      
      <Suspense fallback={
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 text-center text-sm">Loading...</div>
      }>
        <FooterContent />
      </Suspense>
    </footer>
  );
}

