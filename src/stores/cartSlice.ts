// src/stores/cartSlice.ts
// Handles the shopping cart.
// Cart items are stored as { productId, quantity, snapshot } — NOT as full Product objects.
// This keeps localStorage compact and prevents stale product data from persisting.
import { Product, CartItem } from '../types';
import toast from 'react-hot-toast';
import type { StateCreator } from 'zustand';
import type { RootState } from './index';

export interface CartSlice {
  cart: CartItem[];
  isCartOpen: boolean;

  setCartOpen: (isOpen: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const createCartSlice: StateCreator<RootState, [], [], CartSlice> = (set) => ({
  cart: [],
  isCartOpen: false,

  setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),

  addToCart: (product: Product, quantity = 1) => {
    toast.success(`${quantity}× ${product.name} ajouté au panier`);
    set((state) => {
      const existing = state.cart.find((c) => c.productId === product.id);
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.productId === product.id
              ? { ...c, quantity: c.quantity + quantity }
              : c
          ),
        };
      }
      const newItem: CartItem = {
        productId: product.id,
        quantity,
        snapshot: {
          name: product.name,
          price: product.price,
          image: product.image,
        },
      };
      return { cart: [...state.cart, newItem] };
    });
  },

  removeFromCart: (productId: string) =>
    set((state) => ({
      cart: state.cart.filter((c) => c.productId !== productId),
    })),

  updateCartQuantity: (productId: string, quantity: number) =>
    set((state) => ({
      cart:
        quantity <= 0
          ? state.cart.filter((c) => c.productId !== productId)
          : state.cart.map((c) =>
              c.productId === productId ? { ...c, quantity } : c
            ),
    })),

  clearCart: () => set({ cart: [] }),
});
