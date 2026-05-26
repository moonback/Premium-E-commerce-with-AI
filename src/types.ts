export type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  effects: string[];
  stock: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type User = {
  id: string;
  email: string;
  role: 'admin' | 'customer';
};

