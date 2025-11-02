import './globals.css';
import type { ReactNode } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export const metadata = {
  title: 'Tanja Unlimited',
  description: 'Art-forward fashion and calligraphy by Tanja Unlimited',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <body className="min-h-screen antialiased">
        <header className="px-6 py-4 border-b">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Tanja Unlimited</h1>
              <div className="text-sm text-gray-600">
                For questions please call, WhatsApp or text Tanja Kisker at <a href="tel:+46706332220" className="text-ochreRed font-semibold">+46706332220</a>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <nav className="flex items-center gap-6 text-sm font-medium">
                <a href="/" className="hover:text-ochreRed transition">Home</a>
                <a href="/events" className="hover:text-ochreRed transition">Exhibitions/Messen/Mässor</a>
                <a href="/webshop" className="hover:text-ochreRed transition">Webshop</a>
                <a href="/collection" className="hover:text-ochreRed transition">Collection</a>
                <a href="/hand-lettering" className="hover:text-ochreRed transition">Hand Lettering & Calligraphy</a>
                <a href="/about" className="hover:text-ochreRed transition">About</a>
                <a href="/contact" className="hover:text-ochreRed transition">Contact</a>
                <a href="/book" className="hover:text-ochreRed transition">Book</a>
              </nav>
              <LanguageSwitcher />
            </div>
          </div>
        </header>
        <main className="px-6 py-12">{children}</main>
        <footer className="bg-indigoDeep text-white px-6 py-12">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Tanja Unlimited</h3>
              <p className="text-cream mb-4">Hand-crafted fashion from Rajasthan, India. Each piece tells a unique story.</p>
              <p className="text-sm">Molinsgatan 13<br/>411 33 Göteborg<br/>Sweden</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="mb-2">Phone/WhatsApp: <a href="tel:+46706332220" className="text-ochreRed">+46 70 633 22 20</a></p>
              <p className="mb-2">Email: <a href="mailto:info@tanjaunlimited.se" className="text-ochreRed">info@tanjaunlimited.se</a></p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/tanjaunlimited" target="_blank" rel="noopener noreferrer" className="hover:text-ochreRed transition">Facebook</a>
                <a href="https://se.linkedin.com/company/tanja-unlimited-ab" target="_blank" rel="noopener noreferrer" className="hover:text-ochreRed transition">LinkedIn</a>
                <a href="https://www.instagram.com/tanjaunlimited/" target="_blank" rel="noopener noreferrer" className="hover:text-ochreRed transition">Instagram</a>
              </div>
              <p className="mt-4 text-sm text-cream">Member of Swedish Chamber of Commerce India (SCCI)</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-white/20 text-center text-sm text-cream">
            © {new Date().getFullYear()} Tanja Unlimited AB. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}


