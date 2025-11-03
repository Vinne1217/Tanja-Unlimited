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
      subject: formData.get('subject') || 'Contact Form',
      message: formData.get('message'),
      company: formData.get('company') // Honeypot for spam protection
    };

    try {
      const res = await fetch('/api/contact', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) 
      });
      
      setLoading(false);
      
      if (res.ok) {
        setSuccess(true);
        e.currentTarget.reset();
        setTimeout(() => setSuccess(false), 5000);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      setLoading(false);
      alert('An error occurred. Please try again or contact us directly.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {success && (
        <div className="bg-sage/10 border border-sage text-sage p-4 text-center font-medium">
          Thank you! We'll get back to you soon.
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-indigo mb-2">
          Name
        </label>
        <input 
          id="name"
          className="w-full border border-ochre/20 p-3 focus:border-ochre focus:outline-none transition-colors bg-ivory text-graphite"
          name="name" 
          placeholder="Your name"
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
        <label htmlFor="subject" className="block text-sm font-medium text-indigo mb-2">
          Subject
        </label>
        <input 
          id="subject"
          className="w-full border border-ochre/20 p-3 focus:border-ochre focus:outline-none transition-colors bg-ivory text-graphite"
          name="subject" 
          placeholder="Subject"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-indigo mb-2">
          Message <span className="text-terracotta">*</span>
        </label>
        <textarea 
          id="message"
          className="w-full border border-ochre/20 p-3 focus:border-ochre focus:outline-none transition-colors bg-ivory text-graphite min-h-[150px]"
          name="message" 
          placeholder="Your message..." 
          required 
        />
      </div>

      {/* Honeypot field for spam protection */}
      <input name="company" type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

      <button 
        className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo text-ivory hover:bg-indigoDeep transition-all duration-300 font-medium tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
        type="submit" 
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            <span>Send Message</span>
          </>
        )}
      </button>
    </form>
  );
}


