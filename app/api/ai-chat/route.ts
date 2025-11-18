import { NextRequest, NextResponse } from 'next/server';
import { categories, products } from '@/lib/products';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set in environment variables');
}

// Build comprehensive knowledge base about the website
function getWebsiteContext() {
  const productList = products
    .slice(0, 20) // Limit to first 20 for context
    .map((p) => `- ${p.name} (ID: ${p.id}): ${p.description || 'No description'} - ${p.price} ${p.currency}`)
    .join('\n');

  const categoryList = categories.map((c) => `- ${c.name}: ${c.description}`).join('\n');

  return `You are a helpful AI assistant for Tanja Unlimited, a Swedish fashion brand specializing in handcrafted, reversible jackets and textiles from Rajasthan, India.

## About Tanja Unlimited

Tanja Unlimited offers art-forward textiles and calligraphy. Each piece is a unique work of wearable art—hand-quilted jackets from antique fabrics, reversible designs, and original calligraphy. The brand combines Rajasthani craftsmanship with Scandinavian design.

## Key Information

**Location:**
- Atelier: Molinsgatan 13, 411 33 Göteborg, Sweden
- Phone: +46 706 332 220
- Also available at: Bra Under i Focus, Göteborg
- European trade fairs and exhibitions
- Online at shop.tanjaunlimited.se

**The Tanja Jacket:**
- Signature piece: Completely reversible with two different fronts
- Made from hand-quilted cotton or silk fabrics
- Previously worn by women of Rajasthan as camel blankets or saris
- Each jacket is unique and one-of-a-kind
- Latest collection includes Tanja rugs made from recycled antique camel blankets

**Product Categories:**
${categoryList}

**Sample Products:**
${productList}

**Website Structure:**
- Home page (/): Overview of the brand and philosophy
- Collection (/collection): Browse all product categories
- Webshop (/webshop): Shop by category
- About (/about): Brand story, values, and information
- Contact (/contact): Contact form and information
- Events (/events): Exhibitions and trade fairs
- Hand Lettering (/hand-lettering): Calligraphy services and courses

**Key Features:**
- Reversible design: Two jackets in one
- Handcrafted quality: Sewn by Tanja's own seamstresses
- Sustainable fashion: Upcycled antique fabrics
- One-of-a-kind pieces: No two items are exactly alike
- Calligraphy art: Original artwork on blouses, tunics, and accessories
- Global artistry: Showcased at European trade fairs

**Navigation Help:**
- Collection page shows all product categories
- Each category has multiple products
- Product pages show details, images, and purchase options
- Webshop allows browsing by category
- Contact page for inquiries and custom orders

**Important Guidelines:**
- Be friendly, helpful, and knowledgeable about the brand
- Help customers navigate the website
- Provide information about products, categories, and the brand
- If you don't know something specific, suggest contacting them directly
- Always be respectful and professional
- Prices are in SEK (Swedish Krona)
- Emphasize the unique, handcrafted nature of the products`;
}

export async function POST(req: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { message: 'AI assistant is not configured. Please contact us directly at +46 706 332 220.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    const systemMessage = {
      role: 'system',
      content: getWebsiteContext(),
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { message: 'I apologize, but I encountered an error. Please try again or contact us at +46 706 332 220.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const message = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { message: 'I apologize, but I encountered an error. Please try again or contact us directly at +46 706 332 220.' },
      { status: 500 }
    );
  }
}

