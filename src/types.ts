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
