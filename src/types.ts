export type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  image_url?: string | null;
};

export type Spec = {
  title: string;
  content: string;
};

export type Product = {
  id: string;
  name: string;
  slug?: string | null;
  description: string;
  price: number;
  image: string;
  categories: string[];
  effects: string[];
  stock: number;
  isNew?: boolean; // Indicates if the product is newly added
  specs: Spec[];
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
};

export type UserRole = 'admin' | 'staff' | 'kiosk' | 'customer';

export type User = {
  id: string;
  email: string;
  role: UserRole;
  address?: string;
  phone?: string;
};

