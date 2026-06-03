import { supabase } from '../lib/supabase';
import { CartItem, CheckoutInfo, User } from '../types';

export type CheckoutOrderResult = {
  orderId: string | null;
  orderNumber: string | null;
  profileSynced: boolean;
};

export type PendingOrderResult = {
  orderId: string;
  orderNumber: string;
  checkoutAttemptId: string;
};

type CreateCheckoutOrderInput = {
  cart: CartItem[];
  checkoutInfo: CheckoutInfo;
  user: User | null;
  discountCode?: string | null;
  discountAmount?: number;
};

type RpcOrderItem = {
  product_id: string;
  quantity: number;
};

type ProfileUpdate = {
  address: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
};

type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;

type CreateOrderRpcResult = {
  order_id?: string | null;
  order_number?: string | null;
};

type ProfileUpdateQuery = {
  eq: (column: 'id', value: string) => Promise<{ error: Error | null }>;
};

type ProfileTableQuery = {
  update: (payload: ProfileUpdate) => ProfileUpdateQuery;
};

export type CheckoutSupabaseClient = {
  rpc: (
    functionName: 'create_order_with_items',
    args: {
      p_items: RpcOrderItem[];
      p_status: 'Nouvelle';
      p_checkout: {
        clientInfo: CheckoutInfo['clientInfo'];
        deliveryMethod: CheckoutInfo['deliveryMethod'];
        payment_intent_id?: string | null;
        payment_provider?: 'stripe';
        payment_status?: string | null;
      };
    }
  ) => QueryResult<CreateOrderRpcResult>;
  from: (table: 'profiles') => ProfileTableQuery;
};

export function toRpcOrderItems(cart: CartItem[]): RpcOrderItem[] {
  return cart.map((item) => ({
    // Support both new format (productId) and legacy format (product.id) during transition
    product_id: item.productId ?? (item as any).product?.id,
    quantity: item.quantity,
  }));
}

export function toProfileUpdate(clientInfo: CheckoutInfo['clientInfo']): ProfileUpdate {
  return {
    address: clientInfo.address || '',
    phone: clientInfo.phone || '',
    address_line1: clientInfo.addressLine1 || '',
    address_line2: clientInfo.addressLine2 || '',
    city: clientInfo.city || '',
    postal_code: clientInfo.postalCode || '',
    country: clientInfo.country || '',
  };
}

/**
 * @deprecated Use atomic checkout flow with create_pending_order_with_items on the server instead.
 */
export async function createCheckoutOrderWithClient(
  client: CheckoutSupabaseClient | null,
  { cart, checkoutInfo, user }: CreateCheckoutOrderInput
): Promise<CheckoutOrderResult> {
  if (!client || !user) {
    return { orderId: null, orderNumber: null, profileSynced: false };
  }

  if (cart.length === 0) {
    throw new Error('Le panier est vide.');
  }

  const { data: orderResult, error } = await client.rpc('create_order_with_items', {
    p_items: toRpcOrderItems(cart),
    p_status: 'Nouvelle',
    p_checkout: {
      clientInfo: checkoutInfo.clientInfo,
      deliveryMethod: checkoutInfo.deliveryMethod,
      payment_intent_id: checkoutInfo.paymentIntentId || null,
      payment_provider: checkoutInfo.paymentIntentId ? 'stripe' : undefined,
      payment_status: checkoutInfo.paymentProviderStatus || null,
    },
  });

  if (error) throw error;

  const orderId = orderResult?.order_id || null;
  const orderNumber = orderResult?.order_number || null;

  if (!orderId) throw new Error('La commande n’a pas pu être créée.');

  const { error: profileError } = await client
    .from('profiles')
    .update(toProfileUpdate(checkoutInfo.clientInfo))
    .eq('id', user.id);

  if (profileError) {
    console.warn('Order completed, but profile sync failed', profileError);
  }

  return { orderId, orderNumber, profileSynced: !profileError };
}

/**
 * @deprecated Use atomic checkout flow with create_pending_order_with_items on the server instead.
 */
export async function createCheckoutOrder(input: CreateCheckoutOrderInput): Promise<CheckoutOrderResult> {
  return createCheckoutOrderWithClient(supabase as unknown as CheckoutSupabaseClient | null, input);
}
