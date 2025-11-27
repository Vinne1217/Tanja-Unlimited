import { NextRequest, NextResponse } from 'next/server';
import { sourceFetch } from '@/lib/source';

export async function POST(req: NextRequest) {
  try {
    const { events } = await req.json();
    
    if (!events || !Array.isArray(events)) {
      console.error('❌ Analytics API: Events array is required');
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400 }
      );
    }

    const tenantId = process.env.SOURCE_TENANT_ID ?? 'tanjaunlimited';
    
    console.log(`📊 Analytics API: Processing ${events.length} event(s) for tenant: ${tenantId}`);

    // Transform events to match customer portal AnalyticsEvent format
    const transformedEvents = events.map((event: any) => {
      const transformed = {
        tenantId: tenantId, // ✅ CRITICAL: Add tenantId to each event
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
      };
      
      console.log(`  📤 Event: ${transformed.eventType} | Session: ${transformed.sessionId} | Page: ${transformed.page}`);
      return transformed;
    });
    
    const portalUrl = process.env.SOURCE_DATABASE_URL ?? 'https://source-database.onrender.com';
    console.log(`🌐 Sending to customer portal: ${portalUrl}/api/ingest/analytics`);
    
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
    
    const responseText = await res.text();
    console.log(`📥 Customer portal response: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      console.error(`❌ Customer portal error: ${responseText}`);
      return NextResponse.json(
        { error: 'Customer portal rejected events', details: responseText },
        { status: res.status }
      );
    }
    
    console.log(`✅ Successfully sent ${transformedEvents.length} event(s) to customer portal`);
    
    return new NextResponse(responseText, { status: res.status });
  } catch (error) {
    console.error('❌ Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


