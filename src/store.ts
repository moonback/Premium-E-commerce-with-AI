import { create } from 'zustand';
import { Product, CartItem } from './types';

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
