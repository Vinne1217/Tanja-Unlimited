export function trackEvent(type: string, properties: Record<string, any> = {}) {
  return fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: [
        {
          type,
          url: location.href,
          path: location.pathname,
          title: document.title,
          timestamp: new Date().toISOString(),
          properties
        }
      ]
    })
  }).catch(() => {});
}

export const trackPageView = () => trackEvent('page_view');


