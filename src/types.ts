export type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
};

export type Spec = {
  title: string;
  content: string;
};

export type Product = {
  id: string;
  name: string;
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

export type User = {
  id: string;
  email: string;
  role: 'admin' | 'customer';
  address?: string;
  phone?: string;
};

