// Session ID helper
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// User ID helper
function getUserId(): string | null {
  // If you have logged-in users, hash their ID here
  // Otherwise return null (users counted via session)
  return null;
}

// Device type detection
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

// Traffic source detection
function getTrafficSource(): 'direct' | 'organic' | 'social' | 'email' | 'referral' {
  if (typeof window === 'undefined') return 'direct';
  
  const referrer = document.referrer;
  if (!referrer) return 'direct';
  
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();
    
    // Search engines
    if (hostname.includes('google') || hostname.includes('bing') || hostname.includes('yahoo') || hostname.includes('duckduckgo')) {
      return 'organic';
    }
    
    // Social media
    if (hostname.includes('facebook') || hostname.includes('twitter') || hostname.includes('instagram') || 
        hostname.includes('linkedin') || hostname.includes('tiktok') || hostname.includes('pinterest')) {
      return 'social';
    }
    
    // Email
    if (hostname.includes('mail') || hostname.includes('email')) {
      return 'email';
    }
    
    return 'referral';
  } catch (e) {
    return 'referral';
  }
}

// Track event - matches customer portal format
export function trackEvent(type: string, eventProps: Record<string, any> = {}) {
  if (typeof window === 'undefined') return Promise.resolve();
  
  const event = {
    type,
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
  
  return fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: [event]
    })
  }).catch((err) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics tracking error:', err);
    }
  });
}

export const trackPageView = () => trackEvent('page_view', {
  page_title: document.title,
  load_time: performance.now()
});


