import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, User } from './types';
import { supabase } from './lib/supabase';
import toast from 'react-hot-toast';

// Initial Seed DB for testing/syncing
export const SEED_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "T-Shirt Minimaliste",
    description: "Un t-shirt en coton bio avec une coupe parfaite. Conçu pour le confort au quotidien.",
    price: 35.0,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab", 
    category: "Vêtements",
    effects: ["Coton bio", "Coupe droite", "Confortable"],
    stock: 120,
  },
  {
    id: "prod_2",
    name: "Sacoche en Cuir",
    description: "Sacoche artisanale en cuir véritable. Pratique et élégante pour vos déplacements.",
    price: 110.0,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa", 
    category: "Accessoires",
    effects: ["Cuir", "Artisanal", "Durable"],
    stock: 30,
  },
  {
    id: "prod_3",
    name: "Tasse en Céramique",
    description: "Tasse façonnée à la main. Idéale pour le thé ou le café du matin.",
    price: 18.0,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d", 
    category: "Maison",
    effects: ["Céramique", "Fait main", "Minimaliste"],
    stock: 50,
  },
  {
    id: "prod_4",
    name: "Gourde Isotherme",
    description: "Gourde en acier inoxydable. Garde vos boissons chaudes ou froides pendant des heures.",
    price: 25.0,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8", 
    category: "Accessoires",
    effects: ["Inox", "Isotherme", "Écologique"],
    stock: 85,
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
  name: 'store-session',
  partialize: (state) => ({ cart: state.cart, favorites: state.favorites })
}));
