import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, User } from './types';
import { supabase } from './lib/supabase';
import toast from 'react-hot-toast';

// Initial Seed DB for testing/syncing
export const SEED_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "La Noisette Fraîche",
    description: "Un trompe-l'œil parfait d'une noisette géante. Coque en chocolat croquant, praliné coulant et mousse légère.",
    price: 12.0,
    image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e", // dessert
    category: "Noix & Graines",
    effects: ["Praliné", "Croquant", "Gourmand"],
    stock: 24,
  },
  {
    id: "prod_2",
    name: "Le Citron Jaune",
    description: "Une écorce en chocolat blanc, insert confit de citron jaune et yuzu, ganache montée acidulée.",
    price: 14.0,
    image: "https://images.unsplash.com/photo-1519869325930-281384150729", // lemon dessert
    category: "Fruits",
    effects: ["Acidulé", "Frais", "Agrumes"],
    stock: 12,
  },
  {
    id: "prod_3",
    name: "La Gousse de Vanille",
    description: "L'illusion bluffante d'une gousse charnue. Pâte sablée, caramel tendre et ganache infiniment vanille.",
    price: 15.0,
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87", // pastry
    category: "Gourmandise",
    effects: ["Vanille", "Caramel", "Doux"],
    stock: 5,
  },
  {
    id: "prod_4",
    name: "Le Grain de Café",
    description: "Un grain de café torréfié format dessert. Biscuit cuillère imbibé espresso, mousse café et cœur mascarpone.",
    price: 13.0,
    image: "https://images.unsplash.com/photo-1495147466023-e6a4b37bb96b", // coffee
    category: "Gourmandise",
    effects: ["Café", "Intense", "Fondant"],
    stock: 45,
  }
];

interface AppState {
  products: Product[];
  cart: CartItem[];
  favorites: string[];
  loyaltyPoints: number;
  searchQuery: string;
  isLoadingProducts: boolean;
  
  // Auth State
  user: User | null;
  isAuthModalOpen: boolean;
  isCartOpen: boolean;
  
  // Actions
  setAuthModalOpen: (isOpen: boolean) => void;
  setCartOpen: (isOpen: boolean) => void;
  setUser: (user: User | null) => void;
  
  setSearchQuery: (q: string) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  checkout: () => void;
  
  // Initialization
  initSession: () => void;
  fetchUserProfile: (userId: string, email: string) => Promise<void>;
  fetchProducts: () => Promise<void>;
  syncCatalogToDb: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  products: [],
  cart: [],
  favorites: [],
  loyaltyPoints: 1250,
  searchQuery: "",
  isLoadingProducts: true,
  
  user: null,
  isAuthModalOpen: false,
  isCartOpen: false,

  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
  setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
  setUser: (user) => set({ user }),

  setSearchQuery: (q) => set({ searchQuery: q }),
  addToCart: (product, quantity = 1) => {
    toast.success(`${quantity}x ${product.name} ajouté au panier`);
    set((state) => {
      const existing = state.cart.find((c) => c.product.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.product.id === product.id
              ? { ...c, quantity: c.quantity + quantity }
              : c
          ),
        };
      }
      return { cart: [...state.cart, { product, quantity }] };
    });
  },
  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((c) => c.product.id !== productId),
    })),
  toggleFavorite: (productId) =>
    set((state) => ({
      favorites: state.favorites.includes(productId)
        ? state.favorites.filter((id) => id !== productId)
        : [...state.favorites, productId],
    })),
  checkout: async () => {
    const state = get();
    if (state.cart.length === 0) return;
    const total = state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const pointsEarned = Math.floor(total / 10);
    
    if (supabase && state.user) {
      try {
        const { data: order, error } = await supabase.from('orders').insert([{
          user_id: state.user.id,
          total: total,
          status: 'En préparation'
        }]).select().single();
        
        if (error) throw error;
        
        const orderItems = state.cart.map(item => ({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        }));
        
        await supabase.from('order_items').insert(orderItems);
        toast.success(`Commande validée ! +${pointsEarned} points`);
      } catch (e: any) {
         toast.error("Erreur, commande hors-ligne simulée : " + e.message);
      }
    } else {
       toast.success(`Commande locale validée !`);
    }

    set((state) => ({ 
      cart: [], 
      loyaltyPoints: state.loyaltyPoints + pointsEarned
    }));
  },

  initSession: async () => {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      get().fetchUserProfile(session.user.id, session.user.email!);
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        get().fetchUserProfile(session.user.id, session.user.email!);
      } else {
        set({ user: null });
      }
    });
  },

  fetchUserProfile: async (userId: string, email: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (error && error.code === 'PGRST116') {
         // Profile not found, let's create it as a fallback in case the DB trigger didn't run
         const role = email.includes('admin') ? 'admin' : 'customer';
         const { data: newProfile, error: insertError } = await supabase.from('profiles').insert([{ id: userId, email, role }]).select().single();
         if (!insertError && newProfile) {
            set({ user: { id: userId, email, role: newProfile.role } });
            return;
         }
      }
      
      if (data) {
        set({ user: { id: userId, email, role: data.role } });
      } else {
        // Ultimate fallback
        set({ user: { id: userId, email, role: email.includes('admin') ? 'admin' : 'customer' } });
      }
    } catch (e) {
      console.error("Error fetching/creating profile:", e);
      set({ user: { id: userId, email, role: email.includes('admin') ? 'admin' : 'customer' } });
    }
  },

  fetchProducts: async () => {
    set({ isLoadingProducts: true });
    if (!supabase) {
      set({ isLoadingProducts: false });
      return;
    }
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        set({ products: data as Product[] });
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      set({ isLoadingProducts: false });
    }
  },

  syncCatalogToDb: async () => {
    if (!supabase) {
      alert("Supabase non configuré.");
      return;
    }
    try {
      const { error } = await supabase.from('products').upsert(SEED_PRODUCTS);
      if (error) throw error;
      alert("Catalogue synchronisé avec succès !");
      get().fetchProducts();
    } catch (err: any) {
      console.error("Error syncing products:", err);
      alert("Erreur de synchronisation : " + err.message);
    }
  }
}), {
  name: 'veridian-session',
  partialize: (state) => ({ cart: state.cart, favorites: state.favorites })
}));
