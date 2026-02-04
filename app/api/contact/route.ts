import { NextRequest, NextResponse } from 'next/server';
import { SOURCE_BASE, TENANT } from '@/lib/source';

/**
 * Legacy API route for contact form (fallback)
 * 
 * NOTE: The frontend now sends messages directly to Source Database
 * using CSRF tokens. This route is kept for backwards compatibility
 * but should use the new /api/messages endpoint with CSRF token.
 * 
 * @deprecated Use direct frontend integration with CSRF token instead
 */
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

    // ✅ Hämta CSRF-token först
    console.log('📤 Hämtar CSRF-token från Source Database...');
    const csrfResponse = await fetch(`${SOURCE_BASE}/api/auth/csrf`, {
      credentials: 'include'
    });

    if (!csrfResponse.ok) {
      throw new Error('Kunde inte hämta CSRF-token');
    }

    const { csrfToken } = await csrfResponse.json();

    // ✅ Skicka meddelande till Source Database via /api/messages med CSRF-token
    console.log('📤 Skickar meddelande till Source Database:', {
      endpoint: `${SOURCE_BASE}/api/messages`,
      tenant: TENANT,
      messageData: {
        tenant: messageData.tenant,
        email: messageData.email,
        name: messageData.name,
        subject: messageData.subject,
        messageLength: messageData.message.length
      }
    });
    
    const res = await fetch(`${SOURCE_BASE}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'X-Tenant': TENANT
      },
      credentials: 'include',
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


