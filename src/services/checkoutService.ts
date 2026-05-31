import { supabase } from '../lib/supabase';
import { CartItem, CheckoutInfo, User } from '../types';

export type CheckoutOrderResult = {
  orderId: string | null;
  profileSynced: boolean;
};

type CreateCheckoutOrderInput = {
  cart: CartItem[];
  checkoutInfo: CheckoutInfo;
  user: User | null;
};

function toRpcOrderItems(cart: CartItem[]) {
  return cart.map((item) => ({
    product_id: item.product.id,
    quantity: item.quantity,
  }));
}

function toProfileUpdate(clientInfo: CheckoutInfo['clientInfo']) {
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

export async function createCheckoutOrder({
  cart,
  checkoutInfo,
  user,
}: CreateCheckoutOrderInput): Promise<CheckoutOrderResult> {
  if (!supabase || !user) {
    return { orderId: null, profileSynced: false };
  }

  if (cart.length === 0) {
    throw new Error('Le panier est vide.');
  }

  const { data: orderId, error } = await supabase.rpc('create_order_with_items', {
    p_items: toRpcOrderItems(cart),
    p_status: 'Nouvelle',
    p_checkout: {
      clientInfo: checkoutInfo.clientInfo,
      deliveryMethod: checkoutInfo.deliveryMethod,
    },
  });

  if (error) throw error;
  if (!orderId) throw new Error('La commande n’a pas pu être créée.');

  const { error: profileError } = await supabase
    .from('profiles')
    .update(toProfileUpdate(checkoutInfo.clientInfo))
    .eq('id', user.id);

  if (profileError) {
    console.warn('Order completed, but profile sync failed', profileError);
  }

  return { orderId, profileSynced: !profileError };
}
