// src/stores/addressSlice.ts
// Handles user address management (address book).
import { supabase } from '../lib/supabase';
import { Address } from '../types';
import { ADDRESS_COLUMNS } from '../lib/columns';
import toast from 'react-hot-toast';
import type { StateCreator } from 'zustand';
import type { RootState } from './index';

export interface AddressSlice {
  addresses: Address[];

  fetchAddresses: () => Promise<void>;
  addAddress: (data: Omit<Address, 'id' | 'user_id'>) => Promise<void>;
  updateAddress: (id: string, data: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
}

export const createAddressSlice: StateCreator<RootState, [], [], AddressSlice> = (set, get) => ({
  addresses: [],

  fetchAddresses: async () => {
    const user = get().user;
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select(ADDRESS_COLUMNS)
        .eq('user_id', user.id) as any;
      if (error) throw error;
      set({ addresses: data as Address[] });
    } catch (e) {
      console.error('Failed to fetch addresses', e);
    }
  },

  addAddress: async (addr) => {
    const user = get().user;
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert({ ...addr, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      set((state) => ({ addresses: [...state.addresses, data as Address] }));
      toast.success('Adresse ajoutée');
    } catch (e) {
      console.error('Add address failed', e);
      toast.error("Impossible d'ajouter l'adresse");
    }
  },

  updateAddress: async (id, updates) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('addresses').update(updates).eq('id', id);
      if (error) throw error;
      set((state) => ({
        addresses: state.addresses.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      }));
      toast.success('Adresse mise à jour');
    } catch (e) {
      console.error('Update address failed', e);
      toast.error('Impossible de mettre à jour');
    }
  },

  deleteAddress: async (id) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ addresses: state.addresses.filter((a) => a.id !== id) }));
      toast.success('Adresse supprimée');
    } catch (e) {
      console.error('Delete address failed', e);
      toast.error('Impossible de supprimer');
    }
  },

  setDefaultAddress: async (id) => {
    if (!supabase) return;
    try {
      const userId = get().user?.id ?? '';
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);
      if (error) throw error;
      set((state) => ({
        addresses: state.addresses.map((a) => ({ ...a, is_default: a.id === id })),
      }));
      toast.success('Adresse par défaut mise à jour');
    } catch (e) {
      console.error('Set default address failed', e);
      toast.error('Impossible de définir défaut');
    }
  },
});
