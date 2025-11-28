import { getSourceDatabaseUrl, getTenantId } from './source';

export async function sendPaymentToSourceDirect(p: {
  sessionId: string;
  customerEmail: string;
  customerName: string;
  amountSek: number;
  currency?: string;
  status?: 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  paymentIntentId?: string;
  customerId?: string;
  productType?: string;
  productName?: string;
  priceId?: string;
  productId?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
}) {
  // Lazy evaluation - only get values when function is called, not at module load time
  const sourceBase = getSourceDatabaseUrl();
  const tenant = getTenantId();
  
  const body = {
    tenant: tenant,
    sessionId: p.sessionId,
    customerEmail: p.customerEmail,
    customerName: p.customerName,
    amount: Math.round(p.amountSek * 100),
    currency: p.currency ?? 'SEK',
    status: p.status ?? 'completed',
    paymentMethod: p.paymentMethod,
    paymentIntentId: p.paymentIntentId,
    customerId: p.customerId,
    productType: p.productType,
    productName: p.productName,
    priceId: p.priceId,
    productId: p.productId,
    quantity: p.quantity ?? 1,
    inventoryAction: 'purchase',
    timestamp: new Date().toISOString(),
    metadata: p.metadata ?? {}
  };

  const res = await fetch(`${sourceBase}/webhooks/tanja-customer-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Webhook failed ${res.status}`);
  return res.json();
}


