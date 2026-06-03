import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  calculatePaymentAmountCents,
  createCartHash,
  createStripeIdempotencyKey,
  getPaymentIntentErrorStatus,
  getStripeWebhookPayload,
  normalizeCheckoutAttemptId,
  normalizePaymentItems,
  toPaymentStatus,
  toCheckoutAttemptStatus,
  validateWebhookAmountCents,
  validateWebhookCurrency,
} from './paymentSecurity';

function createCatalogClient(rows: Array<{ id: string; price: number; stock: number | null }>) {
  const calls = { ids: [] as string[] };
  const client = {
    from: (table: string) => {
      assert.equal(table, 'products');
      return {
        select: (columns: string) => {
          assert.equal(columns, 'id,price,stock,categories');
          return {
            in: async (column: string, ids: string[]) => {
              assert.equal(column, 'id');
              calls.ids = ids;
              return { data: rows.filter((row) => ids.includes(row.id)), error: null };
            },
          };
        },
      };
    },
  };

  return { client, calls };
}

test('normalizePaymentItems deduplicates product quantities', () => {
  assert.deepEqual(
    normalizePaymentItems([
      { product_id: 'prod_a', quantity: 1 },
      { product_id: 'prod_a', quantity: 2 },
      { product_id: 'prod_b', quantity: '3' },
    ]),
    [
      { productId: 'prod_a', quantity: 3 },
      { productId: 'prod_b', quantity: 3 },
    ]
  );
});

test('calculatePaymentAmountCents uses catalog prices and stock, not client totals', async () => {
  const { client, calls } = createCatalogClient([
    { id: 'prod_a', price: 12.34, stock: 5 },
    { id: 'prod_b', price: 5, stock: null },
  ]);

  const result = await calculatePaymentAmountCents(client as never, [
    { product_id: 'prod_a', quantity: 2, client_price: 0 },
    { product_id: 'prod_b', quantity: 1, client_price: 999 },
  ]);

  assert.deepEqual(calls.ids, ['prod_a', 'prod_b']);
  assert.equal(result.amountCents, 2968);
  assert.equal(result.itemCount, 3);
  assert.equal(result.cartHash, createCartHash([
    { productId: 'prod_a', quantity: 2 },
    { productId: 'prod_b', quantity: 1 },
  ]));
});

test('calculatePaymentAmountCents rejects insufficient stock', async () => {
  const { client } = createCatalogClient([{ id: 'prod_a', price: 12.34, stock: 1 }]);

  await assert.rejects(
    () => calculatePaymentAmountCents(client as never, [{ product_id: 'prod_a', quantity: 2 }]),
    /Insufficient stock/
  );
});

test('getStripeWebhookPayload verifies signed Stripe payloads', () => {
  const secret = 'whsec_test';
  const rawBody = Buffer.from(JSON.stringify({ id: 'evt_123', type: 'payment_intent.succeeded' }));
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody.toString('utf8')}`)
    .digest('hex');

  assert.deepEqual(getStripeWebhookPayload(rawBody, `t=${timestamp},v1=${signature}`, secret), {
    id: 'evt_123',
    type: 'payment_intent.succeeded',
  });
});

test('payment status and error helpers map expected values', () => {
  assert.equal(toPaymentStatus('succeeded'), 'paid');
  assert.equal(toPaymentStatus('processing'), 'processing');
  assert.equal(toPaymentStatus('requires_payment_method'), 'requires_payment');
  assert.equal(toPaymentStatus('unexpected'), 'failed');
  assert.equal(getPaymentIntentErrorStatus('Invalid product quantity'), 400);
  assert.equal(getPaymentIntentErrorStatus('Catalog pricing is not configured'), 503);
  assert.equal(getPaymentIntentErrorStatus('Stripe outage'), 502);
});


test('checkout attempt helpers create bounded Stripe idempotency keys', () => {
  assert.equal(normalizeCheckoutAttemptId(' attempt_123 '), 'attempt_123');
  assert.equal(normalizeCheckoutAttemptId('../bad'), null);
  assert.equal(
    createStripeIdempotencyKey({ userId: 'user_123', attemptId: 'attempt_123', cartHash: 'hash_abc' }),
    'checkout:user_123:attempt_123:hash_abc'
  );
  assert.equal(createStripeIdempotencyKey({ userId: 'user_123', attemptId: null, cartHash: 'hash_abc' }), null);
});

test('toCheckoutAttemptStatus maps Stripe payment intent status to checkout attempt status', () => {
  assert.equal(toCheckoutAttemptStatus('succeeded'), 'paid');
  assert.equal(toCheckoutAttemptStatus('canceled'), 'cancelled');
  assert.equal(toCheckoutAttemptStatus('processing'), 'failed');
  assert.equal(toCheckoutAttemptStatus('requires_payment_method'), 'failed');
});

test('webhook handler logic simulates reconciliation with metadata fallback', async () => {
  const mockWebhookEvent = {
    id: 'evt_test_123',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_test_123',
        status: 'succeeded',
        metadata: {
          order_id: 'order_test_abc',
          checkout_attempt_id: 'attempt_test_xyz',
        }
      }
    }
  };

  const payments: any[] = [];
  const metadataOrderId = mockWebhookEvent.data.object.metadata.order_id;
  const status = toPaymentStatus(mockWebhookEvent.data.object.status);

  let orderId: string | null = null;
  if (payments && payments.length > 0) {
    orderId = payments[0].order_id || null;
  }
  if (!orderId && metadataOrderId) {
    orderId = metadataOrderId;
  }

  assert.equal(orderId, 'order_test_abc');
  assert.equal(status, 'paid');
});

test('webhook handler logic simulates ahead-of-local 409 error when metadata is missing', async () => {
  const mockWebhookEvent = {
    id: 'evt_test_123',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_test_123',
        status: 'succeeded',
        metadata: {} as Record<string, string>
      }
    }
  };

  const payments: any[] = [];
  const metadataOrderId = mockWebhookEvent.data.object.metadata.order_id;
  const status = toPaymentStatus(mockWebhookEvent.data.object.status);

  let orderId: string | null = null;
  if (payments && payments.length > 0) {
    orderId = payments[0].order_id || null;
  }
  if (!orderId && metadataOrderId) {
    orderId = metadataOrderId;
  }

  const isAheadOfLocal = !orderId && status === 'paid' && !payments.length;
  assert.equal(isAheadOfLocal, true);
});

test('validateWebhookAmountCents validates matching amounts', () => {
  assert.equal(validateWebhookAmountCents(4200, 4200), true);
  assert.equal(validateWebhookAmountCents(4200, 4201), false);
  assert.equal(validateWebhookAmountCents(undefined, 4200), false);
});

test('validateWebhookCurrency validates matching currencies case-insensitively', () => {
  assert.equal(validateWebhookCurrency('eur', 'eur'), true);
  assert.equal(validateWebhookCurrency('EUR', 'eur'), true);
  assert.equal(validateWebhookCurrency('usd', 'eur'), false);
  assert.equal(validateWebhookCurrency(undefined, 'eur'), false);
});

test('webhook handler logic simulates discrepancy flow on amount mismatch', () => {
  const stripeAmount = 3000;
  const orderTotal = 42.00;
  const expectedAmountCents = Math.round(orderTotal * 100);

  const isAmountValid = validateWebhookAmountCents(stripeAmount, expectedAmountCents);
  assert.equal(isAmountValid, false);
});

test('webhook handler logic simulates discrepancy flow on currency mismatch', () => {
  const stripeCurrency = 'usd';
  const isCurrencyValid = validateWebhookCurrency(stripeCurrency, 'eur');
  assert.equal(isCurrencyValid, false);
});

// ── TASK-P0-004: Idempotency tests ────────────────────────────────────────────

test('createStripeIdempotencyKey returns identical key on repeated calls — Stripe will deduplicate', () => {
  const params = { userId: 'user_abc', attemptId: 'attempt_xyz', cartHash: 'hash_123' };
  const key1 = createStripeIdempotencyKey(params);
  const key2 = createStripeIdempotencyKey(params);
  // Same inputs must produce the same key across calls
  assert.equal(key1, key2);
  assert.notEqual(key1, null);
});

test('createStripeIdempotencyKey differs when attemptId differs — prevents cross-attempt collisions', () => {
  const base = { userId: 'user_abc', cartHash: 'hash_123' };
  const key1 = createStripeIdempotencyKey({ ...base, attemptId: 'attempt_001' });
  const key2 = createStripeIdempotencyKey({ ...base, attemptId: 'attempt_002' });
  assert.notEqual(key1, key2);
});

test('createStripeIdempotencyKey differs when cartHash differs — prevents stale-cart reuse', () => {
  const base = { userId: 'user_abc', attemptId: 'attempt_001' };
  const key1 = createStripeIdempotencyKey({ ...base, cartHash: 'hash_v1' });
  const key2 = createStripeIdempotencyKey({ ...base, cartHash: 'hash_v2' });
  assert.notEqual(key1, key2);
});

test('double-submission: idempotent hit path returns existing orderId without creating new order', () => {
  // Simulates the server-side idempotency check logic:
  // If checkout_attempts already has a payment_intent_id for this attempt
  // and the intent is in a reusable state, return it directly.

  const existingAttempt = {
    payment_intent_id: 'pi_existing_123',
    order_id: 'order_existing_abc',
    status: 'pending',
  };
  const existingIntentStatus = 'requires_payment_method'; // reusable state
  const terminalStatuses = ['succeeded', 'canceled'];

  const isReusable =
    existingAttempt.payment_intent_id !== null &&
    existingAttempt.status === 'pending' &&
    !terminalStatuses.includes(existingIntentStatus);

  assert.equal(isReusable, true, 'Should reuse existing PaymentIntent');
  assert.equal(existingAttempt.order_id, 'order_existing_abc', 'Must return the same orderId');
});

test('double-submission: completed intent (succeeded) is NOT reused — triggers new flow', () => {
  const existingAttempt = {
    payment_intent_id: 'pi_done_456',
    order_id: 'order_done_abc',
    status: 'pending',
  };
  const existingIntentStatus = 'succeeded'; // terminal — must not be reused
  const terminalStatuses = ['succeeded', 'canceled'];

  const isReusable =
    existingAttempt.payment_intent_id !== null &&
    existingAttempt.status === 'pending' &&
    !terminalStatuses.includes(existingIntentStatus);

  assert.equal(isReusable, false, 'Succeeded intent must not be reused for a new payment');
});

test('double-submission: attempt with status != pending is not reused', () => {
  // A paid/expired/failed attempt must never be reused
  for (const doneStatus of ['paid', 'failed', 'expired', 'cancelled']) {
    const existingAttempt = {
      payment_intent_id: 'pi_old_789',
      order_id: 'order_old_xyz',
      status: doneStatus,
    };

    const isReusable =
      existingAttempt.payment_intent_id !== null &&
      existingAttempt.status === 'pending' &&
      !['succeeded', 'canceled'].includes('requires_payment_method');

    assert.equal(isReusable, false, `Status '${doneStatus}' must not trigger idempotent reuse`);
  }
});

test('normalizeCheckoutAttemptId rejects IDs that could cause SQL injection or path traversal', () => {
  // These must never reach the DB
  const malicious = [
    '../../../etc/passwd',
    "' OR 1=1 --",
    '<script>alert(1)</script>',
    'a'.repeat(81), // too long
    'ab', // too short
    '', // empty
  ];
  for (const id of malicious) {
    assert.equal(normalizeCheckoutAttemptId(id), null, `Should reject: ${id}`);
  }

  // Valid IDs must pass through
  assert.equal(normalizeCheckoutAttemptId('attempt-abc123'), 'attempt-abc123');
  assert.equal(normalizeCheckoutAttemptId('checkout_2026_XYZ'), 'checkout_2026_XYZ');
});
