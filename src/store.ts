import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, User, Category, Address } from './types';
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
    categories: ["Vêtements"],
    effects: ["Coton bio", "Coupe droite", "Confortable"],
    stock: 120,
    specs: [
      { title: "Allergènes", content: "Contient des traces de fruits à coque." },
      { title: "Conseils de dégustation", content: "Laver avant usage." },
      { title: "Valeurs nutritionnelles", content: "100 kcal pour 100g." }
    ]
  },
  {
    id: "prod_2",
    name: "Sacoche en Cuir",
    description: "Sacoche artisanale en cuir véritable. Pratique et élégante pour vos déplacements.",
    price: 110.0,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa",
    categories: ["Accessoires"],
    effects: ["Cuir", "Artisanal", "Durable"],
    stock: 30,
    specs: [
      { title: "Allergènes", content: "Cuir véritable, peut contenir des résidus de tannage." },
      { title: "Conseils d'entretien", content: "Essuyer avec un chiffon sec." }
    ]
  },
  {
    id: "prod_3",
    name: "Tasse en Céramique",
    description: "Tasse façonnée à la main. Idéale pour le thé ou le café du matin.",
    price: 18.0,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d",
    categories: ["Maison"],
    effects: ["Céramique", "Fait main", "Minimaliste"],
    stock: 50,
    specs: [
      { title: "Matériau", content: "Céramique émaillée, sans plomb." }
    ]
  },
  {
    id: "prod_4",
    name: "Gourde Isotherme",
    description: "Gourde en acier inoxydable. Garde vos boissons chaudes ou froides pendant des heures.",
    price: 25.0,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8",
    categories: ["Accessoires"],
    effects: ["Inox", "Isotherme", "Écologique"],
    stock: 85,
    specs: [
      { title: "Matériau", content: "Acier inoxydable 316L, sans BPA." },
      { title: "Capacité", content: "750ml, étanche." }
    ]
  }
];

export interface AppState {
  checkoutInfo: {
    clientInfo: {
      name: string;
      email: string;
      phone?: string;
      address?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      postalCode?: string;
      country?: string;
    };
    deliveryMethod: 'clickCollect' | 'courier';
    paymentStatus: 'idle' | 'processing' | 'succeeded' | 'failed';
  };
  setClientInfo: (info: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  }) => void;
  setDeliveryMethod: (method: 'clickCollect' | 'courier') => void;
  setPaymentStatus: (status: 'idle' | 'processing' | 'succeeded' | 'failed') => void;
  resetCheckout: () => void;
  // store slices
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  addresses: Address[];
  favorites: string[];
  loyaltyPoints: number;
  searchQuery: string;
  isLoadingProducts: boolean;
  user: User | null;
  isAuthModalOpen: boolean;
  isCartOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
  setCartOpen: (isOpen: boolean) => void;
  setUser: (user: User | null) => void;
  setSearchQuery: (q: string) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  checkout: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  initSession: () => Promise<void>;
  fetchUserProfile: (userId: string, email: string) => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  syncCatalogToDb: () => Promise<void>;
  // Address management
  fetchAddresses: () => Promise<void>;
  addAddress: (data: Omit<Address, 'id' | 'user_id'>) => Promise<void>;
  updateAddress: (id: string, data: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      cart: [],
      addresses: [],
      favorites: [],
      loyaltyPoints: 1250,
      searchQuery: "",
      isLoadingProducts: true,
      checkoutInfo: {
        clientInfo: { name: '', email: '', phone: '', address: '', addressLine1: '', addressLine2: '', city: '', postalCode: '', country: '' },
        deliveryMethod: 'courier',
        paymentStatus: 'idle'
      },
      user: null,
      isAuthModalOpen: false,
      isCartOpen: false,



      setClientInfo: (info) => set(state => ({ ...state, checkoutInfo: { ...state.checkoutInfo, clientInfo: { ...state.checkoutInfo.clientInfo, ...info } } })),
      setDeliveryMethod: (method) => set(state => ({ ...state, checkoutInfo: { ...state.checkoutInfo, deliveryMethod: method } })),
      setPaymentStatus: (status) => set(state => ({ ...state, checkoutInfo: { ...state.checkoutInfo, paymentStatus: status } })),
      resetCheckout: () => set(state => ({
        ...state,
        checkoutInfo: {
          clientInfo: {
            name: '',
            email: '',
            phone: '',
            address: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            postalCode: '',
            country: ''
          },
          deliveryMethod: 'courier',
          paymentStatus: 'idle'
        },
      })),
      setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
      setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
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
      // Address management
      fetchAddresses: async () => {
        const user = get().user;
        if (!supabase || !user) return;
        try {
          const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id);
          if (error) throw error;
          set({ addresses: data as Address[] });
        } catch (e) {
          console.error('Failed to fetch addresses', e);
        }
      },
      addAddress: async (addr: Omit<Address, 'id' | 'user_id'>) => {
        const user = get().user;
        if (!supabase || !user) return;
        try {
          const { data, error } = await supabase
            .from('addresses')
            .insert({ ...addr, user_id: user.id })
            .select()
            .single();
          if (error) throw error;
          set(state => ({ addresses: [...state.addresses, data as Address] }));
          toast.success('Adresse ajoutée');
        } catch (e) {
          console.error('Add address failed', e);
          toast.error('Impossible d’ajouter l’adresse');
        }
      },
      updateAddress: async (id: string, updates: Partial<Address>) => {
        if (!supabase) return;
        try {
          const { error } = await supabase.from('addresses').update(updates).eq('id', id);
          if (error) throw error;
          set(state => ({
            addresses: state.addresses.map(a => (a.id === id ? { ...a, ...updates } : a))
          }));
          toast.success('Adresse mise à jour');
        } catch (e) {
          console.error('Update address failed', e);
          toast.error('Impossible de mettre à jour');
        }
      },
      deleteAddress: async (id: string) => {
        if (!supabase) return;
        try {
          const { error } = await supabase.from('addresses').delete().eq('id', id);
          if (error) throw error;
          set(state => ({ addresses: state.addresses.filter(a => a.id !== id) }));
          toast.success('Adresse supprimée');
        } catch (e) {
          console.error('Delete address failed', e);
          toast.error('Impossible de supprimer');
        }
      },
      setDefaultAddress: async (id: string) => {
        if (!supabase) return;
        try {
          // clear previous defaults
          await supabase.from('addresses').update({ is_default: false }).eq('user_id', get().user?.id || '');
          // set new default
          const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', id);
          if (error) throw error;
          set(state => ({
            addresses: state.addresses.map(a => ({ ...a, is_default: a.id === id }))
          }));
          toast.success('Adresse par défaut mise à jour');
        } catch (e) {
          console.error('Set default address failed', e);
          toast.error('Impossible de définir défaut');
        }
      },
      // Order status
      updateOrderStatus: async (orderId: string, status: 'Nouvelle' | 'En préparation' | 'Prête' | 'Livrée' | 'Terminée') => {
        if (supabase && get().user) {
          try {
            await supabase.from('orders').update({ status }).eq('id', orderId);
          } catch (e) {
            console.error('Failed to update order status', e);
          }
        }
      },

      checkout: async () => {
        const state = get();
        if (state.cart.length === 0) return;
        const total = state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const pointsEarned = Math.floor(total / 10);

        if (supabase && state.user) {
          try {
            const { data: order, error } = await supabase
              .from('orders')
              .insert([
                { user_id: state.user.id, total, status: 'Nouvelle' }
              ])
              .select()
              .single();
            if (error) throw error;

            const orderItems = state.cart.map((item) => ({
              order_id: order.id,
              product_id: item.product.id,
              quantity: item.quantity,
              price_at_time: item.product.price,
            }));

            const { error: orderItemsError } = await supabase
              .from('order_items')
              .insert(orderItems);
            if (orderItemsError) throw orderItemsError;

            const { clientInfo } = state.checkoutInfo;
            // Persist client address and phone into user profile if available
            if (state.user) {
              await supabase
                .from('profiles')
                .update({
                  address: clientInfo.address || '',
                  phone: clientInfo.phone || '',
                  address_line1: clientInfo.addressLine1 || '',
                  address_line2: clientInfo.addressLine2 || '',
                  city: clientInfo.city || '',
                  postal_code: clientInfo.postalCode || '',
                  country: clientInfo.country || ''
                })
                .eq('id', state.user.id);
              // Update local user state
              set({
                user: { ...state.user, address: clientInfo.address || '', phone: clientInfo.phone || '' }
              });
            }
            toast.success(`Commande validée ! +${pointsEarned} points`);
          } catch (e: any) {
            toast.error('Erreur, commande hors-ligne simulée : ' + e.message);
          }
        } else {
          toast.success('Commande locale validée !');
        }
        set(state => ({
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
        // Profile not found, create fallback
        const role = email.includes('admin') ? 'admin' : 'customer';
        const { data: newProfile, error: insertError } = await supabase.from('profiles').insert([{ id: userId, email, role, address: '', phone: '' }]).select().single();
        if (!insertError && newProfile) {
          set({ user: { id: userId, email, role: newProfile.role } });
          set({ loyaltyPoints: 0 });
          return;
        }
      }
      if (data) {
        set({
          user: { id: userId, email, role: data.role, address: data.address ?? '', phone: data.phone ?? '' },
          loyaltyPoints: data.loyalty_points ?? 0,
        });
      } else {
        // Ultimate fallback
        set({
          user: { id: userId, email, role: email.includes('admin') ? 'admin' : 'customer', address: '', phone: '' },
          loyaltyPoints: 0,
        });
      }
    } catch (e) {
      console.error("Error fetching/creating profile:", e);
      set({
        user: { id: userId, email, role: email.includes('admin') ? 'admin' : 'customer' },
        loyaltyPoints: 0,
      });
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

      fetchCategories: async () => {
        if (!supabase) return;
        try {
          const { data, error } = await supabase.from('categories').select('*');
          if (error) throw error;
          if (data && data.length > 0) {
            set({ categories: data as Category[] });
          } else {
            set({ categories: [] });
          }
        } catch (e) {
          console.error(e);
          set({ categories: [] });
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
