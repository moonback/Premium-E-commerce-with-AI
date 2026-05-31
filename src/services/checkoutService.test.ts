import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CheckoutSupabaseClient,
  createCheckoutOrderWithClient,
  toProfileUpdate,
  toRpcOrderItems,
} from './checkoutService';
import { CartItem, CheckoutInfo, Product, User } from '../types';

const product: Product = {
  id: 'prod_test',
  name: 'Produit test',
  description: 'Produit pour test checkout',
  price: 42,
  image: '/test.jpg',
  categories: ['Tests'],
  effects: ['Stable'],
  stock: 5,
  specs: [],
};

const cart: CartItem[] = [{ product, quantity: 2 }];

const checkoutInfo: CheckoutInfo = {
  clientInfo: {
    name: 'Client Test',
    email: 'client@example.com',
    phone: '0600000000',
    address: '1 rue du Test',
    addressLine1: '1 rue du Test',
    city: 'Paris',
    postalCode: '75001',
    country: 'FR',
  },
  deliveryMethod: 'courier',
  paymentStatus: 'idle',
};

const user: User = {
  id: 'user_123',
  email: 'client@example.com',
  role: 'customer',
};

function createMockClient(options: { orderId?: string | null; orderNumber?: string | null; rpcError?: Error | null; profileError?: Error | null } = {}) {
  const calls = {
    rpcArgs: null as unknown,
    profileUpdate: null as unknown,
    profileUserId: '',
  };

  const client: CheckoutSupabaseClient = {
    rpc: async (_functionName, args) => {
      calls.rpcArgs = args;
      return {
        data: {
          order_id: options.orderId ?? 'order_123',
          order_number: options.orderNumber ?? 'VER-20260531-ABC12345',
        },
        error: options.rpcError ?? null,
      };
    },
    from: () => ({
      update: (payload) => {
        calls.profileUpdate = payload;
        return {
          eq: async (_column, value) => {
            calls.profileUserId = value;
            return { error: options.profileError ?? null };
          },
        };
      },
    }),
  };

  return { client, calls };
}

test('toRpcOrderItems maps cart lines to the RPC payload', () => {
  assert.deepEqual(toRpcOrderItems(cart), [{ product_id: 'prod_test', quantity: 2 }]);
});

test('toProfileUpdate normalizes optional checkout fields', () => {
  assert.deepEqual(toProfileUpdate({ name: 'A', email: 'a@example.com' }), {
    address: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: '',
  });
});

test('createCheckoutOrderWithClient creates an order and syncs the profile', async () => {
  const { client, calls } = createMockClient();

  const result = await createCheckoutOrderWithClient(client, { cart, checkoutInfo, user });

  assert.deepEqual(result, { orderId: 'order_123', orderNumber: 'VER-20260531-ABC12345', profileSynced: true });
  assert.deepEqual(calls.rpcArgs, {
    p_items: [{ product_id: 'prod_test', quantity: 2 }],
    p_status: 'Nouvelle',
    p_checkout: {
      clientInfo: checkoutInfo.clientInfo,
      deliveryMethod: 'courier',
    },
  });
  assert.equal(calls.profileUserId, 'user_123');
});

test('createCheckoutOrderWithClient keeps a completed order when profile sync fails', async () => {
  const { client } = createMockClient({ profileError: new Error('profile denied') });
  const originalWarn = console.warn;
  console.warn = () => undefined;

  try {
    const result = await createCheckoutOrderWithClient(client, { cart, checkoutInfo, user });

    assert.deepEqual(result, { orderId: 'order_123', orderNumber: 'VER-20260531-ABC12345', profileSynced: false });
  } finally {
    console.warn = originalWarn;
  }
});

test('createCheckoutOrderWithClient throws before clearing flow when the RPC fails', async () => {
  const { client } = createMockClient({ rpcError: new Error('stock unavailable') });

  await assert.rejects(
    () => createCheckoutOrderWithClient(client, { cart, checkoutInfo, user }),
    /stock unavailable/
  );
});
