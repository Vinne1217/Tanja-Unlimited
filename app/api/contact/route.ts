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

    // ✅ Skicka meddelande till Source Database via /api/contact (ingen CSRF-token behövs!)
    console.log('📤 Skickar meddelande till Source Database:', {
      endpoint: `${SOURCE_BASE}/api/contact`,
      tenant: TENANT,
      messageData: {
        tenant: messageData.tenant,
        email: messageData.email,
        name: messageData.name,
        subject: messageData.subject,
        messageLength: messageData.message.length
      }
    });
    
    const res = await sourceFetch('/api/contact', {
      method: 'POST',
      headers: {
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


