// src/stores/index.ts
// Root store — assembles all slices into a single Zustand store.
//
// Persistence strategy:
//   - cart: stored as { productId, quantity, snapshot } — compact, no stale product objects.
//   - favorites: local list of product IDs.
//   - All other state is transient (re-fetched from Supabase on mount).
//
// Cart migration:
//   If the user has a "cart-v1" entry in localStorage (full Product objects),
//   it is migrated on first hydration via the `migrate` option.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { createAuthSlice, AuthSlice } from './authSlice';
import { createCatalogSlice, CatalogSlice } from './catalogSlice';
import { createCartSlice, CartSlice } from './cartSlice';
import { createCheckoutSlice, CheckoutSlice } from './checkoutSlice';
import { createWishlistSlice, WishlistSlice } from './wishlistSlice';
import { createAddressSlice, AddressSlice } from './addressSlice';
import { createUiSlice, UiSlice } from './uiSlice';

// ── Root state type — union of all slice types ────────────────────────────────
export type RootState = AuthSlice &
  CatalogSlice &
  CartSlice &
  CheckoutSlice &
  WishlistSlice &
  AddressSlice &
  UiSlice;

// ── Migration: cart-v1 (full Product) → cart-v2 (productId + snapshot) ───────
function migratePersistedState(persisted: any): Partial<RootState> {
  if (!persisted) return {};

  const cart = (persisted.cart ?? []).map((item: any) => {
    // Already in v2 format
    if (item.productId) return item;
    // Legacy v1: { product: Product, quantity: number }
    if (item.product) {
      return {
        productId: item.product.id,
        quantity: item.quantity,
        snapshot: {
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
        },
      };
    }
    return item;
  });

  return { cart, favorites: persisted.favorites ?? [] };
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useStore = create<RootState>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createCatalogSlice(...a),
      ...createCartSlice(...a),
      ...createCheckoutSlice(...a),
      ...createWishlistSlice(...a),
      ...createAddressSlice(...a),
      ...createUiSlice(...a),
    }),
    {
      name: 'store-session',
      storage: createJSONStorage(() => localStorage),
      // Only persist lightweight data
      partialize: (state) => ({
        cart: state.cart,
        favorites: state.favorites,
      }),
      // Migrate legacy cart format (v1 → v2)
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          return migratePersistedState(persistedState);
        }
        return persistedState as Partial<RootState>;
      },
    }
  )
);

// Re-export slice types for convenience
export type { AuthSlice, CatalogSlice, CartSlice, CheckoutSlice, WishlistSlice, AddressSlice, UiSlice };
