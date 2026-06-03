// src/stores/wishlistSlice.ts
// Handles the server-side wishlist (saved items per user).
import { supabase } from '../lib/supabase';
import { WishlistItem } from '../types';
import { WISHLIST_COLUMNS } from '../lib/columns';
import toast from 'react-hot-toast';
import type { StateCreator } from 'zustand';
import type { RootState } from './index';

export interface WishlistSlice {
  wishlist: WishlistItem[];

  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
}

export const createWishlistSlice: StateCreator<RootState, [], [], WishlistSlice> = (set, get) => ({
  wishlist: [],

  fetchWishlist: async () => {
    const user = get().user;
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select(WISHLIST_COLUMNS)
        .eq('user_id', user.id) as any;
      if (error) throw error;
      set({ wishlist: (data ?? []) as WishlistItem[] });
    } catch (e) {
      console.error('Failed to fetch wishlist', e);
    }
  },

  addToWishlist: async (productId: string) => {
    const user = get().user;
    if (!supabase || !user) {
      toast.error('Connectez-vous pour sauvegarder vos favoris.');
      return;
    }
    // Optimistic update
    const tempItem: WishlistItem = {
      id: `temp_${productId}`,
      user_id: user.id,
      product_id: productId,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ wishlist: [...state.wishlist, tempItem] }));

    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .insert({ user_id: user.id, product_id: productId })
        .select()
        .single();
      if (error) throw error;
      // Replace temp item with real server row
      set((state) => ({
        wishlist: state.wishlist.map((w) => (w.id === tempItem.id ? (data as WishlistItem) : w)),
      }));
      toast.success('Ajouté aux favoris');
    } catch (e) {
      // Rollback
      set((state) => ({ wishlist: state.wishlist.filter((w) => w.id !== tempItem.id) }));
      console.error('Add to wishlist failed', e);
      toast.error("Impossible d'ajouter aux favoris");
    }
  },

  removeFromWishlist: async (productId: string) => {
    const user = get().user;
    if (!supabase || !user) return;
    const prev = get().wishlist;
    // Optimistic update
    set((state) => ({
      wishlist: state.wishlist.filter((w) => w.product_id !== productId),
    }));
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      if (error) throw error;
      toast.success('Retiré des favoris');
    } catch (e) {
      // Rollback
      set({ wishlist: prev });
      console.error('Remove from wishlist failed', e);
      toast.error('Impossible de retirer des favoris');
    }
  },
});
