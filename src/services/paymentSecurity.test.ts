import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  calculatePaymentAmountCents,
  createCartHash,
  getPaymentIntentErrorStatus,
  getStripeWebhookPayload,
  normalizePaymentItems,
  toPaymentStatus,
} from './paymentSecurity';

function createCatalogClient(rows: Array<{ id: string; price: number; stock: number | null }>) {
  const calls = { ids: [] as string[] };
  const client = {
    from: (table: string) => {
      assert.equal(table, 'products');
      return {
        select: (columns: string) => {
          assert.equal(columns, 'id,price,stock');
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
