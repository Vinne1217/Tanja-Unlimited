import { NextRequest, NextResponse } from 'next/server';
import { sourceFetch, SOURCE_BASE, TENANT } from '@/lib/source';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ✅ Validera honeypot - company måste vara tomt
    if (body.company && body.company.trim() !== '') {
      return NextResponse.json(
        { success: false, message: 'Spam detected' },
        { status: 400 }
      );
    }

    // ✅ Validera obligatoriska fält
    if (!body.email || !body.message) {
      return NextResponse.json(
        { success: false, message: 'E-post och meddelande krävs' },
        { status: 400 }
      );
    }

    // ✅ Hämta CSRF-token från Source Database
    let csrfToken: string;
    try {
      const csrfResponse = await fetch(`${SOURCE_BASE}/api/auth/csrf`, {
        credentials: 'include'
      });
      
      if (!csrfResponse.ok) {
        throw new Error('Kunde inte hämta CSRF-token');
      }
      
      const csrfData = await csrfResponse.json();
      csrfToken = csrfData.csrfToken;
      
      if (!csrfToken) {
        throw new Error('CSRF-token saknas i svar');
      }
    } catch (error) {
      console.error('❌ CSRF token error:', error);
      return NextResponse.json(
        { success: false, message: 'Kunde inte hämta säkerhetstoken. Ladda om sidan och försök igen.' },
        { status: 500 }
      );
    }

    // ✅ Förbered meddelandedata med tenant
    const messageData = {
      tenant: TENANT,
      name: body.name || '',
      email: body.email,
      phone: body.phone || '',
      subject: body.subject || 'Kontaktformulär',
      message: body.message,
      company: '' // ✅ Honeypot måste vara tomt
    };

    // ✅ Skicka meddelande till Source Database med CSRF-token
    const res = await sourceFetch('/api/messages', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
        'X-Tenant': TENANT
      },
      body: JSON.stringify(messageData)
    });

    const responseText = await res.text();
    
    if (!res.ok) {
      let errorMessage = 'Kunde inte skicka meddelande';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Om JSON parsing misslyckas, använd response text
        errorMessage = responseText || errorMessage;
      }
      
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: res.status }
      );
    }

    // ✅ Framgångsrikt skickat
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { success: true };
    }

    return NextResponse.json(responseData, { status: res.status });

  } catch (error) {
    console.error('❌ Contact form error:', error);
    return NextResponse.json(
      { success: false, message: 'Ett fel uppstod. Försök igen senare.' },
      { status: 500 }
    );
  }
}


