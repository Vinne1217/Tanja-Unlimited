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

    // ✅ Hämta CSRF-token från Source Database (server-till-server, inga CORS-problem)
    let csrfToken: string;
    try {
      console.log('🔐 Hämtar CSRF-token från:', `${SOURCE_BASE}/api/auth/csrf`);
      const csrfResponse = await fetch(`${SOURCE_BASE}/api/auth/csrf`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔐 CSRF response status:', csrfResponse.status, csrfResponse.statusText);
      
      if (!csrfResponse.ok) {
        const errorText = await csrfResponse.text();
        console.error('❌ CSRF token fetch failed:', {
          status: csrfResponse.status,
          statusText: csrfResponse.statusText,
          body: errorText
        });
        throw new Error(`Kunde inte hämta CSRF-token: ${csrfResponse.status} ${csrfResponse.statusText}`);
      }
      
      const csrfData = await csrfResponse.json();
      console.log('🔐 CSRF response data:', { hasToken: !!csrfData.csrfToken, tokenLength: csrfData.csrfToken?.length });
      
      csrfToken = csrfData.csrfToken;
      
      if (!csrfToken) {
        console.error('❌ CSRF token missing in response:', csrfData);
        throw new Error('CSRF-token saknas i svar från Source Database');
      }
    } catch (error) {
      console.error('❌ CSRF token error:', error);
      return NextResponse.json(
        { success: false, message: 'Kunde inte hämta säkerhetstoken. Försök igen senare.' },
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
    console.log('📤 Skickar meddelande till Source Database:', {
      endpoint: `${SOURCE_BASE}/api/messages`,
      tenant: TENANT,
      hasCsrfToken: !!csrfToken,
      messageData: {
        tenant: messageData.tenant,
        email: messageData.email,
        name: messageData.name,
        subject: messageData.subject,
        messageLength: messageData.message.length
      }
    });
    
    const res = await sourceFetch('/api/messages', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
        'X-Tenant': TENANT
      },
      body: JSON.stringify(messageData)
    });

    const responseText = await res.text();
    console.log('📥 Source Database response:', {
      status: res.status,
      statusText: res.statusText,
      bodyPreview: responseText.substring(0, 200)
    });
    
    if (!res.ok) {
      let errorMessage = 'Kunde inte skicka meddelande';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
        console.error('❌ Source Database error response:', errorData);
      } catch {
        // Om JSON parsing misslyckas, använd response text
        errorMessage = responseText || errorMessage;
        console.error('❌ Source Database error (non-JSON):', responseText);
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


