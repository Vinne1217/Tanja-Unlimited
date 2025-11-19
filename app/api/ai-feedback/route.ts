import { NextRequest, NextResponse } from 'next/server';

const CUSTOMER_PORTAL_URL = 'https://admin-portal-rn5z.onrender.com/api/statistics/ai-feedback';
const TENANT_ID = process.env.SOURCE_TENANT_ID ?? 'tanjaunlimited';

// Rate limiting: Simple in-memory tracking (resets on server restart)
// Track requests per minute to prevent overwhelming the portal
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 10; // Limit to 10 requests per minute
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000; // Start with 1 second

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
    const res = await fetch(CUSTOMER_PORTAL_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Tenant': TENANT_ID,
      },
      body: JSON.stringify(feedbackData)
    });

    const responseText = await res.text();
    
    // Handle rate limiting (429) with retry
    if (res.status === 429 && retryCount < MAX_RETRIES) {
      // Check for Retry-After header
      const retryAfter = res.headers.get('Retry-After');
      let delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff
      
      if (retryAfter) {
        // Respect Retry-After header if provided (in seconds)
        delayMs = parseInt(retryAfter, 10) * 1000;
      }
      
      console.log(`⏳ Rate limited (429), retrying in ${delayMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
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
        { success: false, message: 'Missing required fields' },
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

    // Format feedback for customer portal
    const feedbackData = {
      messageId: body.messageId,
      rating: body.rating, // 'positive' or 'negative'
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
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': TENANT_ID, // ✅ X-Tenant header included for proper rate limiting
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
        });
      } else {
        console.error('❌ Failed to send feedback to customer portal:', {
          status: result.status,
          response: result.responseText.substring(0, 200),
          messageId: feedbackData.messageId,
          tenantId: feedbackData.tenantId,
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


