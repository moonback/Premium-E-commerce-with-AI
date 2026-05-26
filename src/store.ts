import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, User } from './types';
import { supabase } from './lib/supabase';

// Mock DB
export const MOCK_PRODUCTS: Product[] = [
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
  fetchProducts: () => Promise<void>;
  syncCatalogToDb: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  products: MOCK_PRODUCTS,
  cart: [],
  favorites: [],
  loyaltyPoints: 1250,
  searchQuery: "",
  
  user: null,
  isAuthModalOpen: false,
  isCartOpen: false,

  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
  setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
  setUser: (user) => set({ user }),

  setSearchQuery: (q) => set({ searchQuery: q }),
  addToCart: (product, quantity = 1) =>
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
    }),
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
  checkout: () => set({ cart: [], loyaltyPoints: useStore.getState().loyaltyPoints + Math.floor(useStore.getState().cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0) / 10) }),

  initSession: async () => {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // In a real app, you would fetch role from a profiles table
      const role = session.user.email?.includes('admin') ? 'admin' : 'customer';
      set({ user: { id: session.user.id, email: session.user.email!, role } });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const role = session.user.email?.includes('admin') ? 'admin' : 'customer';
        set({ user: { id: session.user.id, email: session.user.email!, role } });
      } else {
        set({ user: null });
      }
    });
  },

  fetchProducts: async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        set({ products: data as Product[] });
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  },

  syncCatalogToDb: async () => {
    if (!supabase) {
      alert("Supabase non configuré.");
      return;
    }
    try {
      const { error } = await supabase.from('products').upsert(MOCK_PRODUCTS);
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
