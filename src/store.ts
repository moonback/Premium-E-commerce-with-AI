import { create } from 'zustand';
import { Product, CartItem } from './types';

// Mock DB
export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "Premium Indica Blend",
    description: "A deep, relaxing blend perfect for evening wind-down.",
    price: 45.0,
    image: "https://images.unsplash.com/photo-1603908861937-2fb0dbeb775e", // aesthetic herb/plant
    category: "Flower",
    effects: ["Relaxing", "Sleep", "Pain Relief"],
    stock: 24,
  },
  {
    id: "prod_2",
    name: "Sativa Citrus Spark",
    description: "An uplifting, energetic strain with bright citrus notes.",
    price: 50.0,
    image: "https://images.unsplash.com/photo-1595431623910-b977bc6fdfad",
    category: "Flower",
    effects: ["Energy", "Focus", "Creative"],
    stock: 12,
  },
  {
    id: "prod_3",
    name: "CBD Sleep Tincture",
    description: "Fast-acting broad spectrum drops for deep rest.",
    price: 65.0,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be",
    category: "Tinctures",
    effects: ["Sleep", "Calm"],
    stock: 5,
  },
  {
    id: "prod_4",
    name: "Hybrid Balance Gummies",
    description: "Perfectly balanced effects in a delicious mango treat.",
    price: 30.0,
    image: "https://images.unsplash.com/photo-1600350711904-4c45b85a1a1f",
    category: "Edibles",
    effects: ["Happy", "Relaxing", "Social"],
    stock: 45,
  }
];

interface AppState {
  products: Product[];
  cart: CartItem[];
  favorites: string[];
  loyaltyPoints: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  checkout: () => void;
}

export const useStore = create<AppState>((set) => ({
  products: MOCK_PRODUCTS,
  cart: [],
  favorites: [],
  loyaltyPoints: 1250,
  searchQuery: "",
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
}));
