import { NextRequest, NextResponse } from 'next/server';

const CUSTOMER_PORTAL_URL = 'https://admin-portal-rn5z.onrender.com/api/statistics/ai-feedback';
const TENANT_ID = process.env.SOURCE_TENANT_ID ?? 'tanjaunlimited';

// Rate limiting: Simple in-memory tracking (resets on server restart)
// Track requests per minute to prevent overwhelming the portal
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 5; // Reduced to 5 requests per minute (very conservative)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 5000; // Increased to 5 seconds (more time for portal to reset)

/**
 * Check if we're rate limited (too many requests in the last minute)
 */
function checkRateLimit(): boolean {
  const now = Date.now();
  const key = 'global'; // Simple global rate limit
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, []);
  }
  
  const requests = rateLimitMap.get(key)!;
  
  // Remove requests older than 1 minute
  const recentRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);
  rateLimitMap.set(key, recentRequests);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return true; // Rate limited
  }
  
  // Add current request
  recentRequests.push(now);
  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send feedback with retry logic and exponential backoff
 */
async function sendFeedbackWithRetry(
  feedbackData: Record<string, unknown>,
  retryCount = 0
): Promise<{ success: boolean; status: number; responseText: string }> {
  try {
    // Build headers object to ensure X-Tenant is included
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant': TENANT_ID,
    };
    
    // Log headers being sent (first attempt only)
    if (retryCount === 0) {
      console.log('📋 Request headers being sent:', {
        'Content-Type': headers['Content-Type'],
        'X-Tenant': headers['X-Tenant'],
        'X-Tenant-Length': headers['X-Tenant']?.length || 0,
      });
    }
    
    const res = await fetch(CUSTOMER_PORTAL_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(feedbackData)
    });

    const responseText = await res.text();
    
    // Log response for debugging (first attempt only to avoid spam)
    if (retryCount === 0) {
      console.log('📥 Customer portal response:', {
        status: res.status,
        statusText: res.statusText,
        responsePreview: responseText.substring(0, 200),
        headers: {
          'Retry-After': res.headers.get('Retry-After') || 'not-set',
          'Content-Type': res.headers.get('Content-Type') || 'not-set',
        },
        note: 'X-Tenant is a request header we send, not a response header (so "not-set" is expected here)',
      });
    }
    
    // Handle server errors (500/503) with retry - these are often transient database issues
    if ((res.status === 500 || res.status === 503) && retryCount < MAX_RETRIES) {
      const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff: 5s, 10s, 20s
      console.log(`⏳ Server error (${res.status}), retrying in ${Math.round(delayMs / 1000)}s (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      console.log(`   Error: ${responseText.substring(0, 100)}`);
      
      await sleep(delayMs);
      return sendFeedbackWithRetry(feedbackData, retryCount + 1);
    }
    
    // Handle rate limiting (429) with retry
    if (res.status === 429 && retryCount < MAX_RETRIES) {
      // Check for Retry-After header
      const retryAfter = res.headers.get('Retry-After');
      let delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff: 5s, 10s, 20s
      
      if (retryAfter) {
        // Respect Retry-After header if provided (in seconds)
        delayMs = parseInt(retryAfter, 10) * 1000;
      }
      
      // Minimum delay of 5 seconds for rate limit retries
      delayMs = Math.max(delayMs, 5000);
      
      console.log(`⏳ Rate limited (429), retrying in ${Math.round(delayMs / 1000)}s (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      console.log(`   X-Tenant header: ${TENANT_ID} (verify portal is using per-tenant rate limiting)`);
      
      await sleep(delayMs);
      return sendFeedbackWithRetry(feedbackData, retryCount + 1);
    }
    
    return {
      success: res.ok,
      status: res.status,
      responseText,
    };
  } catch (error) {
    // Retry on network errors
    if (retryCount < MAX_RETRIES) {
      const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
      console.log(`🔄 Network error, retrying in ${delayMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(delayMs);
      return sendFeedbackWithRetry(feedbackData, retryCount + 1);
    }
    
    throw error; // Re-throw if max retries reached
  }
}

export async function POST(req: NextRequest) {
  try {
  const body = await req.json();
    
    // Validate required fields
    if (!body.messageId || !body.rating || !body.message) {
      console.error('❌ Missing required fields in feedback request:', {
        hasMessageId: !!body.messageId,
        hasRating: !!body.rating,
        hasMessage: !!body.message,
      });
      return NextResponse.json(
        { success: false, message: 'Missing required fields: messageId, rating, or message' },
        { status: 400 }
      );
    }

    // Validate message is not empty (customer portal requirement)
    if (!body.message.trim()) {
      console.error('❌ Message field is empty:', {
        messageId: body.messageId,
      });
      return NextResponse.json(
        { success: false, message: 'Message field cannot be empty' },
        { status: 400 }
      );
    }

    // Check rate limit before sending
    if (checkRateLimit()) {
      console.warn('⚠️ Rate limit: Too many feedback requests, skipping this one');
      // Still return success to user, but don't send to portal
      return NextResponse.json({ 
        success: true, 
        message: 'Feedback received',
        sent: false,
        rateLimited: true,
      });
    }

    // Ensure rating is lowercase (customer portal requires exact "positive" or "negative")
    const rating = body.rating?.toLowerCase()?.trim();
    
    // Validate rating is exactly "positive" or "negative" (case-sensitive requirement)
    if (rating !== 'positive' && rating !== 'negative') {
      console.error('❌ Invalid rating value:', {
        received: body.rating,
        normalized: rating,
        messageId: body.messageId,
      });
      return NextResponse.json(
        { success: false, message: 'Rating must be exactly "positive" or "negative" (lowercase)' },
        { status: 400 }
      );
    }

    // Format feedback for customer portal
    const feedbackData = {
      messageId: body.messageId,
      rating: rating, // Guaranteed to be "positive" or "negative" (lowercase)
      message: body.message, // The AI assistant's response
      userMessage: body.userMessage || '', // The user's question (optional)
      timestamp: body.timestamp || new Date().toISOString(),
      source: 'tanja-unlimited-website',
      type: 'ai-assistant-feedback',
      tenantId: TENANT_ID,
    };

    console.log('📤 Sending AI feedback to customer portal:', {
      messageId: feedbackData.messageId,
      rating: feedbackData.rating,
      tenantId: feedbackData.tenantId,
      timestamp: feedbackData.timestamp,
      messageLength: feedbackData.message?.length || 0,
      userMessageLength: feedbackData.userMessage?.length || 0,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': TENANT_ID, // ✅ X-Tenant header included for proper rate limiting
      },
      payloadPreview: {
        messageId: feedbackData.messageId,
        rating: feedbackData.rating,
        message: feedbackData.message?.substring(0, 50) + '...',
        hasUserMessage: !!feedbackData.userMessage,
      },
    });

    // Send with retry logic
    const result = await sendFeedbackWithRetry(feedbackData);
    
    if (!result.success) {
      // Handle different error statuses
      if (result.status === 429) {
        console.error('❌ Rate limited by customer portal (429) - max retries reached:', {
          messageId: feedbackData.messageId,
          tenantId: feedbackData.tenantId,
          note: 'X-Tenant header is being sent. Portal may need to verify per-tenant rate limiting is working.',
        });
      } else if (result.status === 500 || result.status === 503) {
        // 500/503 errors usually indicate server/database issues on portal side
        console.error(`❌ Customer portal returned ${result.status} error (server/database issue):`, {
          status: result.status,
          response: result.responseText,
          messageId: feedbackData.messageId,
          tenantId: feedbackData.tenantId,
          payloadSent: {
            messageId: feedbackData.messageId,
            rating: feedbackData.rating,
            messageLength: feedbackData.message?.length || 0,
            messagePreview: feedbackData.message?.substring(0, 100),
            hasUserMessage: !!feedbackData.userMessage,
            timestamp: feedbackData.timestamp,
            source: feedbackData.source,
            type: feedbackData.type,
          },
          note: 'This is likely a database or server issue on the customer portal side. We retried 3 times. Request format appears correct.',
          action: 'Contact customer portal team to check database connection and server logs.',
        });
      } else {
        console.error('❌ Failed to send feedback to customer portal:', {
          status: result.status,
          response: result.responseText.substring(0, 200),
          messageId: feedbackData.messageId,
          tenantId: feedbackData.tenantId,
          payloadSent: {
            messageId: feedbackData.messageId,
            rating: feedbackData.rating,
            messageLength: feedbackData.message?.length || 0,
          },
        });
      }
      
      // Still return success to user even if portal fails (don't break UX)
      return NextResponse.json({ 
        success: true, 
        message: 'Feedback received',
        sent: false,
        rateLimited: result.status === 429,
      });
    }

    console.log('✅ AI feedback sent successfully to customer portal:', {
      messageId: feedbackData.messageId,
      rating: feedbackData.rating,
      tenantId: feedbackData.tenantId,
      portalResponse: result.responseText.substring(0, 100),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback sent successfully',
      sent: true,
    });
  } catch (error) {
    console.error('❌ Error sending AI feedback:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Return success to user even if there's an error (don't break UX)
    return NextResponse.json({ 
      success: true, 
      message: 'Feedback received',
      sent: false,
    }, { status: 200 });
  }
}


