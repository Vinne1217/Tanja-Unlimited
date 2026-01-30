'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Session ID (sparas i localStorage)
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// User ID (hashat, valfritt - används för unika användare)
function getUserId(): string | null {
  // Om du har inloggade användare, hasha deras ID här
  // Annars returnera null (användare räknas via session)
  return null;
}

// Detektera enhetstyp
function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('tablet') || ua.includes('ipad') || (ua.includes('android') && !ua.includes('mobile'))) {
    return 'tablet';
  } else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    return 'mobile';
  }
  return 'desktop';
}

// Detektera trafikkälla
function getTrafficSource(): 'direct' | 'organic' | 'social' | 'email' | 'referral' {
  if (typeof window === 'undefined') return 'direct';
  
  const referrer = document.referrer;
  if (!referrer) return 'direct';
  
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();
    
    // Sökmotorer
    if (hostname.includes('google') || hostname.includes('bing') || hostname.includes('yahoo') || hostname.includes('duckduckgo')) {
      return 'organic';
    }
    
    // Sociala medier
    if (hostname.includes('facebook') || hostname.includes('twitter') || hostname.includes('instagram') || 
        hostname.includes('linkedin') || hostname.includes('tiktok') || hostname.includes('pinterest')) {
      return 'social';
    }
    
    // E-post (om referrer innehåller e-postrelaterade domäner)
    if (hostname.includes('mail') || hostname.includes('email')) {
      return 'email';
    }
    
    return 'referral';
  } catch (e) {
    return 'referral';
  }
}

// Skicka event till Source.database
async function trackEvent(eventType: string, eventProps: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  
  const event = {
    type: eventType,
    url: window.location.href,
    page: window.location.pathname,
    referrer: document.referrer,
    source: getTrafficSource(),
    device: getDeviceType(),
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id: getUserId(),
    user_agent: navigator.userAgent,
    event_props: eventProps
  };
  
  // ✅ Add logging for debugging
  console.log(`📊 Tracking event: ${eventType}`, {
    page: event.page,
    session: event.session_id,
    source: event.source,
    device: event.device
  });
  
  // Skicka event via vår API route
  try {
    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        events: [event]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Analytics API error (${response.status}):`, errorText);
    } else {
      console.log(`✅ Event tracked successfully: ${eventType}`);
    }
  } catch (err) {
    // ✅ Always log errors, not just in development
    console.error('❌ Analytics tracking error:', err);
  }
}

// Spåra sidvisning
function trackPageView() {
  trackEvent('page_view', {
    page_title: document.title,
    load_time: performance.now()
  });
}

// Spåra tid på sida (skickas när användaren lämnar sidan)
let pageStartTime = Date.now();

function trackTimeOnPage() {
  const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000); // i sekunder
  if (timeOnPage > 0) {
    trackEvent('time_on_page', {
      duration: timeOnPage,
      page: window.location.pathname
    });
  }
}

// Export trackEvent för användning i andra komponenter
export { trackEvent };

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Track initial page view
    trackPageView();
    pageStartTime = Date.now();

    // Track time on page when leaving
    const handleBeforeUnload = () => {
      trackTimeOnPage();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Track form submissions
    const handleSubmit = (event: Event) => {
      try {
        const form = event.target as HTMLFormElement;
        // ✅ Säkerställ att vi bara skickar primitiva värden (inga DOM-element)
        const formProps: Record<string, any> = {
          form_id: form.id || form.name || 'unknown',
          form_action: form.action || '',
          field_count: form.elements ? form.elements.length : 0
        };
        
        // ✅ Filtrera bort eventuella icke-primitiva värden
        const safeProps: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(formProps)) {
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            safeProps[key] = value;
          }
        }
        
        trackEvent('form_submit', safeProps);
      } catch (error) {
        // ✅ Ignorera analytics-fel så att de inte stör formulärfunktionaliteten
        console.warn('Analytics tracking error (non-critical):', error);
      }
    };
    
    document.addEventListener('submit', handleSubmit);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('submit', handleSubmit);
    };
  }, []);

  // Track page views on route changes (for Next.js App Router)
  useEffect(() => {
    trackPageView();
    pageStartTime = Date.now();
  }, [pathname]);

  return <>{children}</>;
}

