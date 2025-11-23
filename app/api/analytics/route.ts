import { NextRequest, NextResponse } from 'next/server';
import { sourceFetch } from '@/lib/source';

export async function POST(req: NextRequest) {
  try {
    const { events } = await req.json();
    
    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400 }
      );
    }

    // Transform events to match customer portal AnalyticsEvent format
    const transformedEvents = events.map((event: any) => ({
      eventType: event.type || event.eventType,
      sessionId: event.session_id || event.sessionId,
      userId: event.user_id || event.userId || null,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      source: event.source || 'direct',
      device: event.device || 'desktop',
      page: event.page || event.path || '/',
      referrer: event.referrer || '',
      eventProps: {
        ...event.event_props,
        ...event.properties,
        url: event.url,
        page_title: event.page_title || event.title,
        load_time: event.load_time,
        duration: event.event_props?.duration || event.properties?.duration,
        form_id: event.event_props?.form_id || event.properties?.form_id,
        form_action: event.event_props?.form_action || event.properties?.form_action,
        field_count: event.event_props?.field_count || event.properties?.field_count,
        order_id: event.event_props?.order_id || event.properties?.order_id,
        amount: event.event_props?.amount || event.properties?.amount,
        currency: event.event_props?.currency || event.properties?.currency,
        items: event.event_props?.items || event.properties?.items
      }
    }));

    const tenantId = process.env.SOURCE_TENANT_ID ?? 'tanjaunlimited';
    
    const res = await sourceFetch('/api/ingest/analytics', {
      method: 'POST',
      headers: {
        'X-Tenant': tenantId
      },
      body: JSON.stringify({ 
        tenant: tenantId, 
        events: transformedEvents 
      })
    });
    
    return new NextResponse(await res.text(), { status: res.status });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics events' },
      { status: 500 }
    );
  }
}


