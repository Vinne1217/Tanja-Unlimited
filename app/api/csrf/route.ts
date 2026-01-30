import { NextRequest, NextResponse } from 'next/server';
import { SOURCE_BASE } from '@/lib/source';

/**
 * Proxy endpoint för CSRF-token
 * Klienten kan hämta CSRF-token via denna endpoint istället för direkt från Source Database
 * Detta undviker CORS-problem och säkerställer att cookies hanteras korrekt
 */
export async function GET(req: NextRequest) {
  try {
    // Hämta CSRF-token från Source Database
    const csrfResponse = await fetch(`${SOURCE_BASE}/api/auth/csrf`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!csrfResponse.ok) {
      console.error('❌ CSRF token fetch failed:', csrfResponse.status, csrfResponse.statusText);
      return NextResponse.json(
        { success: false, message: 'Kunde inte hämta CSRF-token' },
        { status: csrfResponse.status }
      );
    }
    
    const csrfData = await csrfResponse.json();
    
    if (!csrfData.csrfToken) {
      console.error('❌ CSRF token missing in response:', csrfData);
      return NextResponse.json(
        { success: false, message: 'CSRF-token saknas i svar' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      csrfToken: csrfData.csrfToken
    });
    
  } catch (error) {
    console.error('❌ CSRF proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Ett fel uppstod vid hämtning av CSRF-token' },
      { status: 500 }
    );
  }
}

