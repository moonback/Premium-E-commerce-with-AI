// src/stores/catalogSlice.ts
// Handles product catalogue, categories, and search state.
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types';
import { PRODUCT_COLUMNS, CATEGORY_COLUMNS } from '../lib/columns';
import { slugify } from '../lib/slugify';
import type { StateCreator } from 'zustand';
import type { RootState } from './index';

export interface CatalogSlice {
  products: Product[];
  categories: Category[];
  isLoadingProducts: boolean;
  searchQuery: string;

  setSearchQuery: (q: string) => void;
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  getCategoryBySlug: (slug: string) => Category | undefined;
}

export const createCatalogSlice: StateCreator<RootState, [], [], CatalogSlice> = (set, get) => ({
  products: [],
  categories: [],
  isLoadingProducts: true,
  searchQuery: '',

  setSearchQuery: (q) => set({ searchQuery: q }),

  fetchProducts: async () => {
    set({ isLoadingProducts: true });
    if (!supabase) {
      set({ isLoadingProducts: false });
      return;
    }
    try {
      const { data, error } = await supabase.from('products').select(PRODUCT_COLUMNS) as any;
      if (error) throw error;
      if (data && data.length > 0) {
        const mapped = data.map((p: any): Product => {
          const isNew =
            p.badges?.includes('new') ||
            (p.created_at &&
              new Date().getTime() - new Date(p.created_at).getTime() < 14 * 24 * 60 * 60 * 1000);
          return { ...p, isNew };
        });
        set({ products: mapped });
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      set({ isLoadingProducts: false });
    }
  },

  fetchCategories: async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('categories').select(CATEGORY_COLUMNS) as any;
      if (error) throw error;
      set({ categories: data ? (data as Category[]) : [] });
    } catch (e) {
      console.error('Error fetching categories:', e);
      set({ categories: [] });
    }
  },

  getCategoryBySlug: (slug: string) =>
    get().categories.find((c) => slugify(c.name) === slug),
});
