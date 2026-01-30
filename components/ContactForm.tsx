'use client';
import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || '',
      subject: formData.get('subject') || 'Kontaktformulär',
      message: formData.get('message'),
      company: '' // ✅ Honeypot måste vara tomt (spam-skydd)
    };

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      setLoading(false);
      alert('Vänligen fyll i alla obligatoriska fält.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email as string)) {
      setLoading(false);
      alert('Ogiltig e-postadress.');
      return;
    }

    try {
      // ✅ Hämta CSRF-token från klient-sidan
      let csrfToken: string;
      try {
        const csrfResponse = await fetch('https://source-database-809785351172.europe-north1.run.app/api/auth/csrf', {
          credentials: 'include'
        });
        
        if (!csrfResponse.ok) {
          throw new Error('Kunde inte hämta säkerhetstoken');
        }
        
        const csrfData = await csrfResponse.json();
        csrfToken = csrfData.csrfToken;
        
        if (!csrfToken) {
          throw new Error('CSRF-token saknas i svar');
        }
      } catch (error) {
        setLoading(false);
        alert('Kunde inte hämta säkerhetstoken. Ladda om sidan och försök igen.');
        return;
      }

      // ✅ Skicka meddelande med CSRF-token
      const res = await fetch('/api/contact', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(data) 
      });
      
      setLoading(false);
      
      if (res.ok) {
        setSuccess(true);
        e.currentTarget.reset();
        setTimeout(() => setSuccess(false), 5000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Kunde inte skicka meddelande');
      }
    } catch (error) {
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Ett fel uppstod. Försök igen senare.';
      alert(errorMessage);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {success && (
        <div className="bg-sage/10 border border-sage text-sage p-4 text-center font-medium">
          Tack! Ditt meddelande har skickats. Vi återkommer så snart som möjligt.
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-indigo mb-2">
          Namn
        </label>
        <input 
          id="name"
          className="w-full border border-ochre/20 p-3 focus:border-ochre focus:outline-none transition-colors bg-ivory text-graphite"
          name="name" 
          placeholder="Ditt namn"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-indigo mb-2">
          Email <span className="text-terracotta">*</span>
        </label>
        <input 
          id="email"
          className="w-full border border-ochre/20 p-3 focus:border-ochre focus:outline-none transition-colors bg-ivory text-graphite"
          name="email" 
          type="email" 
          placeholder="your.email@example.com" 
          required 
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-indigo mb-2">
          Telefon
        </label>
        <input 
          id="phone"
          className="w-full border border-ochre/20 p-3 focus:border-ochre focus:outline-none transition-colors bg-ivory text-graphite"
          name="phone" 
          type="tel" 
          placeholder="0701234567"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-indigo mb-2">
          Ämne
        </label>
        <input 
          id="subject"
          className="w-full border border-ochre/20 p-3 focus:border-ochre focus:outline-none transition-colors bg-ivory text-graphite"
          name="subject" 
          placeholder="Ämne"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-indigo mb-2">
          Meddelande <span className="text-terracotta">*</span>
        </label>
        <textarea 
          id="message"
          className="w-full border border-ochre/20 p-3 focus:border-ochre focus:outline-none transition-colors bg-ivory text-graphite min-h-[150px]"
          name="message" 
          placeholder="Ditt meddelande..." 
          required 
        />
      </div>

      {/* Honeypot field for spam protection - måste vara tomt */}
      <input name="company" type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

      <button 
        className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo text-ivory hover:bg-indigoDeep transition-all duration-300 font-medium tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
        type="submit" 
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Skickar...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            <span>Skicka meddelande</span>
          </>
        )}
      </button>
    </form>
  );
}


