export type SEOData = {
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  canonical_url?: string | null;
};

export type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  image_url?: string | null;
  seo?: SEOData | null;
};

export type Spec = {
  title: string;
  content: string;
};

export type ProductPromotion = {
  promo_price: number;
  promo_start_date: string;
  promo_end_date: string;
  promo_label?: string; // Ex: "Soldes", "Black Friday", "-30%"
};

export type ProductBadge = 'featured' | 'bestseller' | 'top_sales' | 'new' | 'limited';

export type Product = {
  rating: number;
  id: string;
  name: string;
  description: string;
  price: number;
  purchase_price?: number; // Prix d'achat
  image: string;
  categories: string[];
  effects: string[];
  stock: number;
  isNew?: boolean; // Indicates if the product is newly added
  specs: Spec[];
  is_batch_product?: boolean; // Produit vendu en lots
  batch_size?: number; // Taille du lot (ex: 6 pour un pack de 6)
  batch_unit?: string; // Unité du lot (ex: "pièces", "unités", "bouteilles")
  seo?: SEOData | null;
  badges?: ProductBadge[]; // Badges du produit
  promotion?: ProductPromotion | null; // Promotion active
  total_sales?: number; // Nombre total de ventes (pour calculer les meilleures ventes)
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Address = {
  id: string;
  user_id: string;
  label?: string; // e.g., Home, Work
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
};


export type CheckoutClientInfo = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  pickupLocation?: string;
  fee?: string;
  timeSlot?: string;
};

export type CheckoutDeliveryMethod = 'clickCollect' | 'courier';

export type CheckoutInfo = {
  clientInfo: CheckoutClientInfo;
  deliveryMethod: CheckoutDeliveryMethod;
  paymentStatus: 'idle' | 'processing' | 'succeeded' | 'failed';
  paymentIntentId?: string | null;
  paymentProviderStatus?: string | null;
};

export type UserRole = 'admin' | 'staff' | 'kiosk' | 'customer';

export type User = {
  id: string;
  email: string;
  role: UserRole;
  address?: string;
  phone?: string;
};

export type WishlistItem = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

export type ProductReview = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  body?: string;
  is_published: boolean;
  created_at: string;
};

// Mega Menu Types
export type MegaMenuLinkType = 'category' | 'product' | 'page' | 'external';

export interface MegaMenuLink {
  id: string;
  label: string;
  type: MegaMenuLinkType;
  url?: string; // Pour external et page
  category_id?: string; // Pour category
  product_id?: string; // Pour product
  icon?: string; // Nom de l'icône Lucide
  description?: string;
  image_url?: string;
  order: number;
}

export interface MegaMenuColumn {
  id: string;
  title: string;
  links: MegaMenuLink[];
  order: number;
  highlight?: boolean; // Pour la colonne promotions/highlights
  background_color?: string;
}

export interface MegaMenuItem {
  id: string;
  label: string;
  category_id?: string; // Catégorie principale associée
  columns: MegaMenuColumn[];
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

