'use client';
import { useState } from 'react';

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget) as any);
    const res = await fetch('/api/contact', { method: 'POST', body: JSON.stringify(data) });
    setLoading(false);
    if (res.ok) e.currentTarget.reset();
    alert(res.ok ? 'Tack! Vi återkommer snart.' : 'Ett fel uppstod. Försök igen.');
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-md">
      <input className="w-full border p-2" name="name" placeholder="Namn" />
      <input className="w-full border p-2" name="email" type="email" placeholder="E‑post" required />
      <input className="w-full border p-2" name="subject" placeholder="Ämne" />
      <textarea className="w-full border p-2" name="message" placeholder="Meddelande" required />
      <input name="company" style={{ display: 'none' }} />
      <button className="bg-ochreRed text-white px-4 py-2" type="submit" disabled={loading}>
        {loading ? 'Skickar…' : 'Skicka'}
      </button>
    </form>
  );
}


