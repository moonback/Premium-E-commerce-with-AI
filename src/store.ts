import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, User, Category, Address, UserRole, CheckoutClientInfo, CheckoutDeliveryMethod, CheckoutInfo, WishlistItem } from './types';
import { supabase } from './lib/supabase';
import toast from 'react-hot-toast';
import { createCheckoutOrder } from './services/checkoutService';
import { getErrorMessage } from './lib/errors';

const USER_ROLES: UserRole[] = ['admin', 'staff', 'kiosk', 'customer'];

function normalizeUserRole(role: unknown): UserRole {
  return typeof role === 'string' && USER_ROLES.includes(role as UserRole) ? (role as UserRole) : 'customer';
}

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
  checkoutInfo: CheckoutInfo;
  discountCode: string | null;
  discountAmount: number;
  setClientInfo: (info: CheckoutClientInfo) => void;
  setDeliveryMethod: (method: CheckoutDeliveryMethod) => void;
  setPaymentStatus: (status: 'idle' | 'processing' | 'succeeded' | 'failed') => void;
  setDiscount: (code: string, amount: number) => void;
  removeDiscount: () => void;
  resetCheckout: () => void;
  // store slices
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  addresses: Address[];
  favorites: string[];
  wishlist: WishlistItem[];
  loyaltyPoints: number;
  searchQuery: string;
  isLoadingProducts: boolean;
  user: User | null;
  isSessionLoading: boolean;
  isAuthModalOpen: boolean;
  isCartOpen: boolean;
  lastOrderId: string | null;
  lastOrderNumber: string | null;
  setAuthModalOpen: (isOpen: boolean) => void;
  setCartOpen: (isOpen: boolean) => void;
  setUser: (user: User | null) => void;
  setSearchQuery: (q: string) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  checkout: (paymentIntentId?: string | null, paymentProviderStatus?: string | null) => Promise<string | null>;
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
  // Wishlist (server-side)
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      cart: [],
      addresses: [],
      favorites: [],
      wishlist: [],
      loyaltyPoints: 0,
      searchQuery: "",
      isLoadingProducts: true,
      discountCode: null,
      discountAmount: 0,
      checkoutInfo: {
        clientInfo: { name: '', email: '', phone: '', address: '', addressLine1: '', addressLine2: '', city: '', postalCode: '', country: '' },
        deliveryMethod: 'courier',
        paymentStatus: 'idle',
        paymentIntentId: null,
        paymentProviderStatus: null
      },
      user: null,
      isSessionLoading: Boolean(supabase),
      isAuthModalOpen: false,
      isCartOpen: false,
      lastOrderId: null,
      lastOrderNumber: null,



      setClientInfo: (info) => set(state => ({ ...state, checkoutInfo: { ...state.checkoutInfo, clientInfo: { ...state.checkoutInfo.clientInfo, ...info } } })),
      setDeliveryMethod: (method) => set(state => ({ ...state, checkoutInfo: { ...state.checkoutInfo, deliveryMethod: method } })),
      setPaymentStatus: (status) => set(state => ({ ...state, checkoutInfo: { ...state.checkoutInfo, paymentStatus: status } })),
      setDiscount: (code, amount) => set({ discountCode: code, discountAmount: amount }),
      removeDiscount: () => set({ discountCode: null, discountAmount: 0 }),
      resetCheckout: () => set(state => ({
        ...state,
        discountCode: null,
        discountAmount: 0,
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
          paymentStatus: 'idle',
          paymentIntentId: null,
          paymentProviderStatus: null
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

      checkout: async (paymentIntentId?: string | null, paymentProviderStatus?: string | null) => {
        const state = get();
        if (state.cart.length === 0) return null;
        const total = state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const pointsEarned = Math.floor(total / 10);
        let completedOrderId: string | null = null;
        let completedOrderNumber: string | null = null;

        if (supabase && state.user) {
          try {
            const result = await createCheckoutOrder({
              cart: state.cart,
              checkoutInfo: {
                ...state.checkoutInfo,
                paymentStatus: paymentIntentId ? 'succeeded' : state.checkoutInfo.paymentStatus,
                paymentIntentId: paymentIntentId || state.checkoutInfo.paymentIntentId || null,
                paymentProviderStatus: paymentProviderStatus || state.checkoutInfo.paymentProviderStatus || null,
              },
              user: state.user,
            });
            completedOrderId = result.orderId;
            completedOrderNumber = result.orderNumber;

            if (!result.profileSynced) {
              toast.error('Commande validée, mais le profil n’a pas pu être mis à jour.');
            } else {
              set({
                user: {
                  ...state.user,
                  address: state.checkoutInfo.clientInfo.address || '',
                  phone: state.checkoutInfo.clientInfo.phone || '',
                },
              });
            }
            toast.success(`Commande validée ! +${pointsEarned} points`);
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Erreur inconnue';
            toast.error('Impossible de valider la commande : ' + message);
            throw e;
          }
        } else {
          toast.success('Commande locale validée !');
        }
        set(state => ({
          cart: [],
          loyaltyPoints: state.loyaltyPoints + pointsEarned,
          lastOrderId: completedOrderId,
          lastOrderNumber: completedOrderNumber,
        }));

        return completedOrderId;
      },

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

        supabase.auth.onAuthStateChange(async (event, session) => {
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
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (error && error.code === 'PGRST116') {
        // Profile not found: create a safe customer profile. Elevated roles must be assigned server-side.
        const role: UserRole = 'customer';
        const { data: newProfile, error: insertError } = await supabase.from('profiles').insert([{ id: userId, email, role, address: '', phone: '' }]).select().single();
        if (!insertError && newProfile) {
          set({ user: { id: userId, email, role: normalizeUserRole(newProfile.role) } });
          set({ loyaltyPoints: 0 });
          return;
        }
      }
      if (data) {
        set({
          user: { id: userId, email, role: normalizeUserRole(data.role), address: data.address ?? '', phone: data.phone ?? '' },
          loyaltyPoints: data.loyalty_points ?? 0,
        });
      } else {
        // Ultimate fallback
        set({
          user: { id: userId, email, role: 'customer', address: '', phone: '' },
          loyaltyPoints: 0,
        });
      }
    } catch (e) {
      console.error("Error fetching/creating profile:", e);
      set({
        user: { id: userId, email, role: 'customer' },
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
          toast.error('Supabase non configuré.');
          return;
        }
        try {
          const { error } = await supabase.from('products').upsert(SEED_PRODUCTS);
          if (error) throw error;
          toast.success('Catalogue synchronisé avec succès !');
          get().fetchProducts();
        } catch (err: unknown) {
          console.error("Error syncing products:", err);
          toast.error('Erreur de synchronisation : ' + getErrorMessage(err));
        }
      },

      // ── Wishlist (server-side) ──────────────────────────────────────────────
      fetchWishlist: async () => {
        const user = get().user;
        if (!supabase || !user) return;
        try {
          const { data, error } = await supabase
            .from('wishlist_items')
            .select('*')
            .eq('user_id', user.id);
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
        set(state => ({ wishlist: [...state.wishlist, tempItem] }));
        try {
          const { data, error } = await supabase
            .from('wishlist_items')
            .insert({ user_id: user.id, product_id: productId })
            .select()
            .single();
          if (error) throw error;
          // Replace temp with real row
          set(state => ({
            wishlist: state.wishlist.map(w =>
              w.id === tempItem.id ? (data as WishlistItem) : w
            ),
          }));
          toast.success('Ajouté aux favoris');
        } catch (e) {
          // Rollback
          set(state => ({ wishlist: state.wishlist.filter(w => w.id !== tempItem.id) }));
          console.error('Add to wishlist failed', e);
          toast.error('Impossible d\'ajouter aux favoris');
        }
      },

      removeFromWishlist: async (productId: string) => {
        const user = get().user;
        if (!supabase || !user) return;
        const prev = get().wishlist;
        // Optimistic update
        set(state => ({ wishlist: state.wishlist.filter(w => w.product_id !== productId) }));
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
    }), {
    name: 'store-session',
    partialize: (state) => ({ cart: state.cart, favorites: state.favorites })
  }));
