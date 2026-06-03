// src/stores/uiSlice.ts
// Handles miscellaneous UI state: favorites (local), loyalty points.
import type { StateCreator } from 'zustand';
import type { RootState } from './index';

export interface UiSlice {
  favorites: string[];
  loyaltyPoints: number;

  toggleFavorite: (productId: string) => void;
}

export const createUiSlice: StateCreator<RootState, [], [], UiSlice> = (set) => ({
  favorites: [],
  loyaltyPoints: 0,

  toggleFavorite: (productId: string) =>
    set((state) => ({
      favorites: state.favorites.includes(productId)
        ? state.favorites.filter((id) => id !== productId)
        : [...state.favorites, productId],
    })),
});
