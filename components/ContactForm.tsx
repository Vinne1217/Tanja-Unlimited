'use client';
import { useState, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { SOURCE_BASE, TENANT } from '@/lib/source';

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || '',
      subject: formData.get('subject') || 'Kontaktformulär',
      message: formData.get('message'),
      company: formData.get('company') || '' // ✅ Honeypot måste vara tomt (spam-skydd)
    };

    // ✅ Honeypot-validering - om company har värde, är det spam
    if (data.company && data.company.toString().trim() !== '') {
      setLoading(false);
      return; // Bot detected, silently fail
    }

    // Validate required fields
    if (!data.email || !data.message) {
      setLoading(false);
      setError('E-post och meddelande krävs.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email as string)) {
      setLoading(false);
      setError('Ogiltig e-postadress.');
      return;
    }

    try {
      // 1. Hämta CSRF-token
      const csrfResponse = await fetch(`${SOURCE_BASE}/api/auth/csrf`, {
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Kunde inte hämta CSRF-token');
      }

      const { csrfToken } = await csrfResponse.json();

      // ✅ Validera att CSRF-token faktiskt finns
      if (!csrfToken) {
        throw new Error('Kunde inte hämta säkerhetstoken. Ladda om sidan och försök igen.');
      }

      // 2. Skicka meddelande till /api/messages
      const res = await fetch(`${SOURCE_BASE}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'X-Tenant': TENANT // ✅ Använd exakt tenant-värde
        },
        credentials: 'include',
        body: JSON.stringify({
          tenant: TENANT, // ✅ Använd exakt tenant-värde
          name: data.name || '',
          email: data.email,
          phone: data.phone || '',
          subject: data.subject || 'Kontaktformulär',
          message: data.message,
          company: '' // ✅ Honeypot (måste vara tomt)
        })
      });
      
      setLoading(false);
      
      if (res.ok) {
        setSuccess(true);
        // ✅ Använd ref istället för e.currentTarget för att undvika null-fel
        if (formRef.current) {
          formRef.current.reset();
        }
        setTimeout(() => setSuccess(false), 5000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Kunde inte skicka meddelande');
      }
    } catch (error) {
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Ett fel uppstod. Försök igen senare.';
      setError(errorMessage);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      {success && (
        <div className="bg-sage/10 border border-sage text-sage p-4 text-center font-medium">
          Tack! Ditt meddelande har skickats. Vi återkommer så snart som möjligt.
        </div>
      )}
      
      {error && (
        <div className="bg-terracotta/10 border border-terracotta text-terracotta p-4 text-center font-medium">
          {error}
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


