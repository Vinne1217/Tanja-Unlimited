import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Format feedback for customer portal
    const feedbackData = {
      messageId: body.messageId,
      rating: body.rating, // 'positive' or 'negative'
      message: body.message, // The AI assistant's response
      userMessage: body.userMessage, // The user's question
      timestamp: body.timestamp,
      source: 'tanja-unlimited-website',
      type: 'ai-assistant-feedback',
    };

    const res = await fetch('https://admin-portal-rn5z.onrender.com/api/statistics/ai-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });

    if (!res.ok) {
      console.error('Failed to send feedback to customer portal:', res.status, await res.text());
      // Still return success to user even if portal fails
      return NextResponse.json({ success: true, message: 'Feedback received' });
    }

    return NextResponse.json({ success: true, message: 'Feedback sent successfully' });
  } catch (error) {
    console.error('Error sending feedback:', error);
    // Return success to user even if there's an error
    return NextResponse.json({ success: true, message: 'Feedback received' }, { status: 200 });
  }
}


