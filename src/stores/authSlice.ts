// src/stores/authSlice.ts
// Handles authentication session, user profile, and role management.
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import { PROFILE_COLUMNS } from '../lib/columns';
import type { StateCreator } from 'zustand';
import type { RootState } from './index';

const USER_ROLES: UserRole[] = ['admin', 'staff', 'kiosk', 'customer'];

function normalizeUserRole(role: unknown): UserRole {
  return typeof role === 'string' && USER_ROLES.includes(role as UserRole)
    ? (role as UserRole)
    : 'customer';
}

export interface AuthSlice {
  user: User | null;
  isSessionLoading: boolean;
  isAuthModalOpen: boolean;

  setUser: (user: User | null) => void;
  setAuthModalOpen: (isOpen: boolean) => void;
  initSession: () => Promise<void>;
  fetchUserProfile: (userId: string, email: string) => Promise<void>;
}

export const createAuthSlice: StateCreator<RootState, [], [], AuthSlice> = (set, get) => ({
  user: null,
  isSessionLoading: Boolean(supabase),
  isAuthModalOpen: false,

  setUser: (user) => set({ user }),
  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),

  initSession: async () => {
    if (!supabase) {
      set({ isSessionLoading: false });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await get().fetchUserProfile(session.user.id, session.user.email!);
      } else {
        set({ user: null });
      }
    } finally {
      set({ isSessionLoading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ isSessionLoading: true });
      try {
        if (session?.user) {
          await get().fetchUserProfile(session.user.id, session.user.email!);
        } else {
          set({ user: null });
        }
      } finally {
        set({ isSessionLoading: false });
      }
    });
  },

  fetchUserProfile: async (userId: string, email: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', userId)
        .single() as any;

      if (error && error.code === 'PGRST116') {
        // Profile not found — create a safe customer profile.
        // Elevated roles must be assigned server-side only.
        const role: UserRole = 'customer';
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: userId, email, role, address: '', phone: '' }])
          .select()
          .single();
        if (!insertError && newProfile) {
          set({
            user: { id: userId, email, role: normalizeUserRole(newProfile.role) },
            loyaltyPoints: 0,
          });
          return;
        }
      }

      if (data) {
        set({
          user: {
            id: userId,
            email,
            role: normalizeUserRole(data.role),
            address: data.address ?? '',
            phone: data.phone ?? '',
          },
          loyaltyPoints: data.loyalty_points ?? 0,
        });
      } else {
        set({
          user: { id: userId, email, role: 'customer', address: '', phone: '' },
          loyaltyPoints: 0,
        });
      }
    } catch (e) {
      console.error('Error fetching/creating profile:', e);
      set({ user: { id: userId, email, role: 'customer' }, loyaltyPoints: 0 });
    }
  },
});
