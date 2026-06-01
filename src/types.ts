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

// ── Shipping Carrier Types ────────────────────────────────────────────────

export type CarrierType = 'home' | 'relay' | 'express' | 'international';

export type ShippingCarrier = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  carrier_type: CarrierType;
  description?: string | null;
  base_price: number;
  free_above?: number | null;
  extra_kg_price?: number;
  min_days: number;
  max_days: number;
  is_active: boolean;
  available_countries: string[];
  max_weight_kg?: number;
  tracking_url_template?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

// Store Settings Types
export type StoreSettings = {
  id: string;
  // Informations boutique
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address?: string;
  store_description?: string;
  store_logo_url?: string;
  // Paramètres commerce
  currency: string;
  tax_rate: number;
  shipping_fee: number;
  free_shipping_threshold: number;
  low_stock_threshold: number;
  // Paramètres de notification
  enable_notifications: boolean;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  notification_email?: string;
  // Paramètres analytics
  enable_analytics: boolean;
  google_analytics_id?: string;
  facebook_pixel_id?: string;
  // Paramètres SEO
  default_meta_title?: string;
  default_meta_description?: string;
  default_meta_keywords?: string;
  // Paramètres sociaux
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  // Paramètres de maintenance
  maintenance_mode: boolean;
  maintenance_message: string;
  // Paramètres de catalogue
  auto_publish_products: boolean;
  require_product_approval: boolean;
  enable_product_reviews: boolean;
  enable_wishlist: boolean;
  // Paramètres de paiement
  enable_stripe: boolean;
  stripe_public_key?: string;
  enable_paypal: boolean;
  paypal_client_id?: string;
  // Métadonnées
  created_at: string;
  updated_at: string;
};

