// src/stores/checkoutSlice.ts
// Handles checkout state: client info, delivery method, payment status,
// discount codes, and the order creation flow.
import { supabase } from '../lib/supabase';
import { CheckoutClientInfo, CheckoutDeliveryMethod, CheckoutInfo } from '../types';
import { createCheckoutOrder } from '../services/checkoutService';
import toast from 'react-hot-toast';
import type { StateCreator } from 'zustand';
import type { RootState } from './index';

const EMPTY_CLIENT_INFO: CheckoutClientInfo = {
  name: '',
  email: '',
  phone: '',
  address: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postalCode: '',
  country: '',
};

const EMPTY_CHECKOUT_INFO: CheckoutInfo = {
  clientInfo: EMPTY_CLIENT_INFO,
  deliveryMethod: 'courier',
  paymentStatus: 'idle',
  paymentIntentId: null,
  paymentProviderStatus: null,
};

export interface CheckoutSlice {
  checkoutInfo: CheckoutInfo;
  discountCode: string | null;
  discountAmount: number;
  lastOrderId: string | null;
  lastOrderNumber: string | null;

  setClientInfo: (info: CheckoutClientInfo) => void;
  setDeliveryMethod: (method: CheckoutDeliveryMethod) => void;
  setPaymentStatus: (status: 'idle' | 'processing' | 'succeeded' | 'failed') => void;
  setDiscount: (code: string, amount: number) => void;
  removeDiscount: () => void;
  resetCheckout: () => void;

  checkout: (
    paymentIntentId?: string | null,
    paymentProviderStatus?: string | null
  ) => Promise<string | null>;

  confirmOrderLocally: (orderId: string, orderNumber: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
}

export const createCheckoutSlice: StateCreator<RootState, [], [], CheckoutSlice> = (set, get) => ({
  checkoutInfo: EMPTY_CHECKOUT_INFO,
  discountCode: null,
  discountAmount: 0,
  lastOrderId: null,
  lastOrderNumber: null,

  setClientInfo: (info) =>
    set((state) => ({
      checkoutInfo: {
        ...state.checkoutInfo,
        clientInfo: { ...state.checkoutInfo.clientInfo, ...info },
      },
    })),

  setDeliveryMethod: (method) =>
    set((state) => ({ checkoutInfo: { ...state.checkoutInfo, deliveryMethod: method } })),

  setPaymentStatus: (status) =>
    set((state) => ({ checkoutInfo: { ...state.checkoutInfo, paymentStatus: status } })),

  setDiscount: (code, amount) => set({ discountCode: code, discountAmount: amount }),
  removeDiscount: () => set({ discountCode: null, discountAmount: 0 }),

  resetCheckout: () =>
    set({
      discountCode: null,
      discountAmount: 0,
      checkoutInfo: EMPTY_CHECKOUT_INFO,
    }),

  checkout: async (paymentIntentId, paymentProviderStatus) => {
    const state = get();
    if (state.cart.length === 0) return null;

    // Compute total from snapshots (server re-validates)
    const total = state.cart.reduce(
      (sum, item) => sum + item.snapshot.price * item.quantity,
      0
    );
    const pointsEarned = Math.floor(total / 10);
    let completedOrderId: string | null = null;
    let completedOrderNumber: string | null = null;

    if (supabase && state.user) {
      try {
        // Build a cart compatible with createCheckoutOrder (needs product objects).
        // Merge snapshots with live products to reconstruct minimal Product shape.
        const productsById = Object.fromEntries(state.products.map((p) => [p.id, p]));
        const cartForOrder: any[] = state.cart.map((item) => {
          const liveProduct = productsById[item.productId];
          return {
            product: liveProduct ?? {
              id: item.productId,
              name: item.snapshot.name,
              price: item.snapshot.price,
              image: item.snapshot.image,
              description: '',
              categories: [],
              effects: [],
              stock: 0,
              specs: [],
              rating: 0,
            },
            quantity: item.quantity,
          };
        });

        const result = await createCheckoutOrder({
          cart: cartForOrder,
          checkoutInfo: {
            ...state.checkoutInfo,
            paymentStatus: paymentIntentId ? 'succeeded' : state.checkoutInfo.paymentStatus,
            paymentIntentId: paymentIntentId ?? state.checkoutInfo.paymentIntentId ?? null,
            paymentProviderStatus:
              paymentProviderStatus ?? state.checkoutInfo.paymentProviderStatus ?? null,
          },
          user: state.user,
        });

        completedOrderId = result.orderId;
        completedOrderNumber = result.orderNumber;

        if (!result.profileSynced) {
          toast.error('Commande validée, mais le profil n\'a pas pu être mis à jour.');
        } else {
          set({
            user: {
              ...state.user,
              address: state.checkoutInfo.clientInfo.address ?? '',
              phone: state.checkoutInfo.clientInfo.phone ?? '',
            },
          });
        }
        toast.success(`Commande validée ! +${pointsEarned} points`);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Erreur inconnue';
        toast.error('Impossible de valider la commande : ' + message);
        throw e;
      }
    } else {
      toast.success('Commande locale validée !');
    }

    set((s) => ({
      cart: [],
      loyaltyPoints: s.loyaltyPoints + pointsEarned,
      lastOrderId: completedOrderId,
      lastOrderNumber: completedOrderNumber,
    }));

    return completedOrderId;
  },

  confirmOrderLocally: async (orderId: string, orderNumber: string) => {
    const state = get();
    const total = state.cart.reduce(
      (sum, item) => sum + item.snapshot.price * item.quantity,
      0
    );
    const pointsEarned = Math.floor(total / 10);

    if (supabase && state.user) {
      try {
        const { error: profileError } = await supabase.from('profiles').update({
          address: state.checkoutInfo.clientInfo.address ?? '',
          phone: state.checkoutInfo.clientInfo.phone ?? '',
          address_line1: state.checkoutInfo.clientInfo.addressLine1 ?? '',
          address_line2: state.checkoutInfo.clientInfo.addressLine2 ?? '',
          city: state.checkoutInfo.clientInfo.city ?? '',
          postal_code: state.checkoutInfo.clientInfo.postalCode ?? '',
          country: state.checkoutInfo.clientInfo.country ?? '',
        }).eq('id', state.user.id);

        if (profileError) {
          console.warn('Profile sync failed', profileError);
        } else {
          set({
            user: {
              ...state.user,
              address: state.checkoutInfo.clientInfo.address ?? '',
              phone: state.checkoutInfo.clientInfo.phone ?? '',
            },
          });
        }
      } catch (e) {
        console.error('Failed to sync profile', e);
      }
    }

    set((s) => ({
      cart: [],
      loyaltyPoints: s.loyaltyPoints + pointsEarned,
      lastOrderId: orderId,
      lastOrderNumber: orderNumber,
    }));

    toast.success(`Commande validée ! +${pointsEarned} points`);
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    if (!supabase || !get().user) return;
    try {
      await supabase.from('orders').update({ status }).eq('id', orderId);
    } catch (e) {
      console.error('Failed to update order status', e);
    }
  },
});
