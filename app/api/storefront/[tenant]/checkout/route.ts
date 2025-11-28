import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStorefrontProductById } from '@/lib/storefront-api';
import { getInventoryByStripePriceId } from '@/lib/inventory';

export async function POST(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenant = params.tenant;

    // Validate tenant
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Check API key authentication
    const authHeader = req.headers.get('authorization');
    const apiKey = authHeader?.replace(/^Bearer\s+/i, '');
    
    // Use FRONTEND_API_KEY or CUSTOMER_API_KEY for storefront checkout
    const expectedKey = process.env.FRONTEND_API_KEY || process.env.CUSTOMER_API_KEY;
    
    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Stripe configuration missing', code: 'STRIPE_NOT_CONFIGURED' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });

    // Parse request body
    const body = await req.json();
    const { items, customerEmail, successUrl, cancelUrl, metadata } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Items array is required', code: 'MISSING_ITEMS' },
        { status: 400 }
      );
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json(
        { success: false, error: 'successUrl and cancelUrl are required', code: 'MISSING_URLS' },
        { status: 400 }
      );
    }

    // Validate items and check inventory
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    
    for (const item of items) {
      if (!item.variantId) {
        return NextResponse.json(
          { success: false, error: 'variantId is required for each item', code: 'MISSING_VARIANT_ID' },
          { status: 400 }
        );
      }

      const quantity = item.quantity || 1;
      if (quantity < 1) {
        return NextResponse.json(
          { success: false, error: 'Quantity must be at least 1', code: 'INVALID_QUANTITY' },
          { status: 400 }
        );
      }

      // Find product by variant ID
      // Try to find variant by articleNumber (variantId) or stripePriceId
      // Also handle products without variants (use product stripePriceId)
      let variantFound = false;
      let stripePriceId: string | null = null;
      let variantStock = 0;
      let variantInStock = true;

      // First, try to get product by variant ID (might be a stripePriceId or product ID)
      const storefrontProduct = await getStorefrontProductById(item.variantId);
      
      if (storefrontProduct) {
        // Check if variantId matches a variant
        const variant = storefrontProduct.variants.find(
          v => v.articleNumber === item.variantId || v.stripePriceId === item.variantId
        );
        
        if (variant) {
          // Found variant
          stripePriceId = variant.stripePriceId;
          variantStock = variant.stock;
          variantInStock = variant.inStock;
          variantFound = true;
        } else if (storefrontProduct.variants.length === 0) {
          // Product has no variants - use product's stripePriceId if available
          // For products without variants, variantId might be the product ID
          const { getProductById } = await import('@/lib/products');
          const product = getProductById(storefrontProduct.id);
          if (product?.stripePriceId) {
            stripePriceId = product.stripePriceId;
            variantStock = storefrontProduct.inStock ? (variantStock || 999) : 0;
            variantInStock = storefrontProduct.inStock;
            variantFound = true;
          }
        }
      }

      // If not found, search through all products
      if (!variantFound) {
        const { products } = await import('@/lib/products');
        for (const product of products) {
          // Check if variantId matches product ID (for products without variants)
          if (product.id === item.variantId && product.stripePriceId) {
            stripePriceId = product.stripePriceId;
            const inventory = await import('@/lib/inventory').then(m => m.getInventoryStatus(product.id));
            variantStock = inventory?.stock ?? (product.inStock ? 999 : 0);
            variantInStock = product.inStock && !inventory?.outOfStock;
            variantFound = true;
            break;
          }
          
          // Check variants
          if (product.variants) {
            const variant = product.variants.find(v => v.sku === item.variantId || v.stripePriceId === item.variantId);
            if (variant) {
              stripePriceId = variant.stripePriceId;
              
              // Check inventory for variant
              const variantInventory = getInventoryByStripePriceId(variant.stripePriceId);
              if (variantInventory) {
                variantStock = variantInventory.stock ?? 0;
                variantInStock = !variantInventory.outOfStock && variantStock > 0;
              } else {
                // Fallback to product stock
                variantStock = variant.stock ?? 0;
                variantInStock = variantStock > 0;
              }
              
              variantFound = true;
              break;
            }
          }
        }
      }

      if (!variantFound || !stripePriceId) {
        return NextResponse.json(
          { success: false, error: `Variant or product ${item.variantId} not found`, code: 'VARIANT_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Check if variant is in stock
      if (!variantInStock) {
        return NextResponse.json(
          { success: false, error: `Variant ${item.variantId} is out of stock`, code: 'OUT_OF_STOCK' },
          { status: 400 }
        );
      }

      // Check if requested quantity exceeds available stock
      if (variantStock > 0 && quantity > variantStock) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for variant ${item.variantId}. Available: ${variantStock}, Requested: ${quantity}`, code: 'INSUFFICIENT_STOCK' },
          { status: 400 }
        );
      }

      lineItems.push({
        price: stripePriceId,
        quantity
      });
    }

    // Create Stripe checkout session
    const sessionMetadata: Record<string, string> = {
      tenant: tenant,
      source: 'storefront_api',
      ...metadata
    };

    // Add item metadata
    lineItems.forEach((item, index) => {
      if (items[index]?.variantId) {
        sessionMetadata[`item_${index}_variantId`] = items[index].variantId;
      }
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: sessionMetadata,
      // Enable shipping address collection
      shipping_address_collection: {
        allowed_countries: ['SE', 'NO', 'DK', 'FI', 'DE', 'GB', 'US', 'CA', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'PL', 'CZ'],
      },
      // Enable phone number collection
      phone_number_collection: {
        enabled: true,
      },
    });

    console.log(`✅ Storefront checkout session created for tenant ${tenant}:`, {
      sessionId: session.id,
      itemCount: lineItems.length
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      expiresAt: new Date(session.expires_at * 1000).toISOString()
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error creating storefront checkout session:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: error.type || 'STRIPE_ERROR'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

