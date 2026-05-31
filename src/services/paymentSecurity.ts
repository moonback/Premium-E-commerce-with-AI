import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

type PaymentIntentLineItem = {
  product_id?: unknown;
  quantity?: unknown;
};

type ProductPaymentRow = {
  id: string;
  price: number;
  stock: number | null;
};

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data?: { object?: { id?: string; status?: string } };
};

export function normalizePaymentItems(rawItems: unknown) {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 100) {
    throw new Error('Payment items are required');
  }

  const quantities = new Map<string, number>();
  for (const rawItem of rawItems as PaymentIntentLineItem[]) {
    const productId = typeof rawItem.product_id === 'string' ? rawItem.product_id.trim() : '';
    const quantity = Number(rawItem.quantity);

    if (!productId) {
      throw new Error('Invalid product id');
    }
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99) {
      throw new Error('Invalid product quantity');
    }

    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  return [...quantities.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

export function createCartHash(items: Array<{ productId: string; quantity: number }>) {
  const stablePayload = items
    .map((item) => `${item.productId}:${item.quantity}`)
    .sort()
    .join('|');
  return crypto.createHash('sha256').update(stablePayload).digest('hex').slice(0, 32);
}

export async function calculatePaymentAmountCents(
  catalogClient: SupabaseClient | null,
  rawItems: unknown
) {
  if (!catalogClient) {
    throw new Error('Catalog pricing is not configured');
  }

  const items = normalizePaymentItems(rawItems);
  const productIds = items.map((item) => item.productId);
  const { data, error } = await catalogClient
    .from('products')
    .select('id,price,stock')
    .in('id', productIds);

  if (error) throw error;

  const products = new Map((data ?? []).map((product) => {
    const row = product as ProductPaymentRow;
    return [row.id, row];
  }));

  let amountCents = 0;
  for (const item of items) {
    const product = products.get(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }
    if (typeof product.stock === 'number' && product.stock < item.quantity) {
      throw new Error(`Insufficient stock for product ${item.productId}`);
    }

    amountCents += Math.round(Number(product.price) * 100) * item.quantity;
  }

  if (!Number.isInteger(amountCents) || amountCents < 50 || amountCents > 9999999) {
    throw new Error('Invalid payment amount');
  }

  return { amountCents, itemCount: items.reduce((sum, item) => sum + item.quantity, 0), cartHash: createCartHash(items) };
}

export function getStripeWebhookPayload(rawBody: Buffer, signatureHeader: string, secret: string) {
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key, value];
    })
  );
  const timestamp = parts.t;
  const signature = parts.v1;

  if (!timestamp || !signature) {
    throw new Error('Invalid Stripe signature header');
  }

  const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  const provided = Buffer.from(signature, 'hex');
  const expected = Buffer.from(expectedSignature, 'hex');
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    throw new Error('Stripe signature verification failed');
  }

  const toleranceSeconds = 5 * 60;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > toleranceSeconds) {
    throw new Error('Stripe signature timestamp is outside tolerance');
  }

  return JSON.parse(rawBody.toString('utf8')) as StripeWebhookEvent;
}

export function toPaymentStatus(stripeStatus?: string) {
  switch (stripeStatus) {
    case 'succeeded':
      return 'paid';
    case 'processing':
      return 'processing';
    case 'canceled':
      return 'cancelled';
    case 'requires_payment_method':
    case 'requires_action':
    case 'requires_confirmation':
      return 'requires_payment';
    default:
      return 'failed';
  }
}

export function getPaymentIntentErrorStatus(message: string) {
  if (
    message === 'Payment items are required' ||
    message === 'Invalid product id' ||
    message === 'Invalid product quantity' ||
    message === 'Invalid payment amount' ||
    message.includes('not found') ||
    message.includes('Insufficient stock')
  ) {
    return 400;
  }
  if (message === 'Catalog pricing is not configured') {
    return 503;
  }
  return 502;
}
