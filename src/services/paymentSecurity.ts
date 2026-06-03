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
  categories: string[];
};

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data?: {
    object?: {
      id?: string;
      status?: string;
      amount_received?: number;
      currency?: string;
      metadata?: {
        order_id?: string;
        checkout_attempt_id?: string;
        source?: string;
        item_count?: string;
        cart_hash?: string;
        customer_name?: string;
      };
    };
  };
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
    .select('id,price,stock,categories')
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

  return {
    amountCents,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    cartHash: createCartHash(items),
    products,
  };
}


export function normalizeCheckoutAttemptId(value: unknown) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return /^[a-zA-Z0-9_-]{8,80}$/.test(normalized) ? normalized : null;
}

export function createStripeIdempotencyKey(input: { userId: string | null; attemptId: string | null; cartHash: string }) {
  if (!input.attemptId) return null;
  const userScope = input.userId || 'anonymous';
  return `checkout:${userScope}:${input.attemptId}:${input.cartHash}`.slice(0, 255);
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

/** Map Stripe PaymentIntent status to checkout_attempt status */
export function toCheckoutAttemptStatus(stripeStatus?: string): 'paid' | 'failed' | 'cancelled' {
  switch (stripeStatus) {
    case 'succeeded':
      return 'paid';
    case 'canceled':
      return 'cancelled';
    default:
      return 'failed';
  }
}

/** Validate Stripe payment intent amount received against expected order total */
export function validateWebhookAmountCents(amountReceived: number | undefined, orderTotalCents: number): boolean {
  if (typeof amountReceived !== 'number') return false;
  return amountReceived === orderTotalCents;
}

/** Validate Stripe payment intent currency against expected store currency */
export function validateWebhookCurrency(currency: string | undefined, expectedCurrency: string): boolean {
  if (typeof currency !== 'string') return false;
  return currency.toLowerCase() === expectedCurrency.toLowerCase();
}

export type DiscountValidationResult = {
  valid: boolean;
  error?: string;
  discountAmount?: number;
  discountAmountCents?: number;
  code?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
};

export function validateDiscount({
  discount,
  items,
  products,
  subtotal,
}: {
  discount: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    min_order_amount?: number | null;
    max_uses?: number | null;
    current_uses: number;
    valid_from: string;
    valid_until?: string | null;
    is_active: boolean;
    eligible_products?: string[] | null;
    eligible_categories?: string[] | null;
  };
  items: Array<{ productId: string; quantity: number }>;
  products: Map<string, { id: string; price: number; categories: string[] }>;
  subtotal: number;
}): DiscountValidationResult {
  // 1. Check is_active
  if (!discount.is_active) {
    return { valid: false, error: "Ce code promo n'est pas actif" };
  }

  // 2. Check dates
  const now = new Date();
  const validFrom = new Date(discount.valid_from);
  if (now < validFrom) {
    return { valid: false, error: "Ce code promo n'est pas encore valide" };
  }
  if (discount.valid_until) {
    const validUntil = new Date(discount.valid_until);
    if (now > validUntil) {
      return { valid: false, error: "Ce code promo a expiré" };
    }
  }

  // 3. Check uses limit
  if (discount.max_uses !== null && discount.max_uses !== undefined && discount.current_uses >= discount.max_uses) {
    return { valid: false, error: "Ce code promo a atteint sa limite d'utilisation" };
  }

  // 4. Check min_order_amount
  if (discount.min_order_amount !== null && discount.min_order_amount !== undefined) {
    if (subtotal < discount.min_order_amount) {
      return {
        valid: false,
        error: `Montant minimum de commande non atteint (${discount.min_order_amount.toFixed(2)}€ requis)`,
      };
    }
  }

  // 5. Calculate eligible subtotal
  let eligibleSubtotal = 0;
  let hasEligibleItem = false;

  for (const item of items) {
    const product = products.get(item.productId);
    if (!product) continue;

    let isProductEligible = true;

    // Check product restriction
    if (discount.eligible_products && discount.eligible_products.length > 0) {
      isProductEligible = discount.eligible_products.includes(item.productId);
    }

    // Check category restriction
    if (isProductEligible && discount.eligible_categories && discount.eligible_categories.length > 0) {
      const productCats = product.categories || [];
      isProductEligible = productCats.some((cat) => discount.eligible_categories?.includes(cat));
    }

    if (isProductEligible) {
      eligibleSubtotal += Number(product.price) * item.quantity;
      hasEligibleItem = true;
    }
  }

  const hasRestrictions =
    (discount.eligible_products && discount.eligible_products.length > 0) ||
    (discount.eligible_categories && discount.eligible_categories.length > 0);

  if (hasRestrictions && !hasEligibleItem) {
    return { valid: false, error: "Votre panier ne contient pas d'articles éligibles à ce code promo" };
  }

  // 6. Calculate discount amount
  let discountAmount = 0;
  if (discount.type === 'percentage') {
    discountAmount = eligibleSubtotal * (Number(discount.value) / 100);
  } else {
    discountAmount = Number(discount.value);
  }

  // Cap discount at eligible subtotal
  discountAmount = Math.min(discountAmount, eligibleSubtotal);

  return {
    valid: true,
    code: discount.code,
    type: discount.type,
    value: Number(discount.value),
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountAmountCents: Math.round(discountAmount * 100),
  };
}
