import React, { useState } from 'react';
import { useStore } from '../store';
import { Search, ShoppingCart, User, Plus, Minus, CreditCard, Banknote, ScanBarcode, ArrowRight } from 'lucide-react';
import KitchenOrders from '../components/KitchenOrders';
import type { CartItem, Product } from '../types';

export default function POS() {
  const { products } = useStore();
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const total = posCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const addToCart = (product: Product) => {
    setPosCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const checkout = () => {
    alert("Transaction completed!");
    setPosCart([]);
  };

  return (
    <div className="min-h-screen bg-bg flex overflow-hidden font-sans">
      {/* Left side: Products catalog */}
      <div className="flex-1 flex flex-col h-screen">
        <header className="bg-white border-b border-ink/10 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-serif tracking-tight text-ink">Point of Sale</h1>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
            <input
              type="text"
              placeholder="Search products or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-soft-green border border-ink/10 text-sm focus:outline-none focus:border-ink/30 transition-all rounded-none"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40">
              <ScanBarcode className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-3 border border-ink/10 hover:border-ink transition-all text-left flex flex-col h-40"
              >
                <div className="w-full h-16 bg-soft-green rounded-t-xl overflow-hidden mb-2">
                  <img src={product.image} className="w-full h-full object-cover mix-blend-overlay opacity-80" alt="" />
                </div>
                <h3 className="font-serif text-sm line-clamp-2 leading-tight flex-1">{product.name}</h3>
                <span className="font-semibold text-sm block mt-1">{product.price.toFixed(2)}€</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right side: Current Order and Kitchen Orders */}
      <div className="w-[400px] bg-white border-l border-ink/10 flex flex-col h-screen shrink-0 z-10">
        <div className="px-6 py-4 border-b border-ink/10 bg-soft-green/30 flex items-center justify-between">
          <h2 className="font-serif flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-ink/60" />
            Current Order
          </h2>
          <button className="text-ink/60 hover:text-ink transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>

        {/* POS Cart */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {posCart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-ink/40 italic">
              Select products to start order
            </div>
          ) : (
            posCart.map(item => (
              <div key={item.product.id} className="flex flex-col gap-2 p-3 bg-soft-green/30 border border-ink/5">
                <div className="flex justify-between items-start">
                  <span className="font-serif text-sm">{item.product.name}</span>
                  <span className="font-semibold text-sm">{(item.product.price * item.quantity).toFixed(2)}€</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-white border border-ink/10 p-1">
                    <button
                      onClick={() => setPosCart(prev => prev.map(p => p.product.id === item.product.id ? { ...p, quantity: Math.max(0, p.quantity - 1) } : p).filter(p => p.quantity > 0))}
                      className="p-1 hover:bg-soft-green/50 text-ink/60 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => setPosCart(prev => prev.map(p => p.product.id === item.product.id ? { ...p, quantity: p.quantity + 1 } : p))}
                      className="p-1 hover:bg-soft-green/50 text-ink/60 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Orders */}
        <div className="p-4 border-t border-ink/10 bg-soft-green/20">
          <h3 className="text-lg font-serif mb-2">Commandes en cours</h3>
          <KitchenOrders />
        </div>

        <div className="p-6 border-t border-ink/10 bg-soft-green/20">
          <div className="flex justify-between items-center mb-6 text-xl">
            <span className="text-ink/60 text-sm font-bold uppercase tracking-widest">Total</span>
            <span className="font-semibold">{total.toFixed(2)}€</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button className="py-3 bg-white border border-ink/20 font-bold text-xs uppercase tracking-widest text-ink flex items-center justify-center gap-2 hover:bg-soft-green transition-colors">
              <Banknote className="w-5 h-5" />
              Cash
            </button>
            <button className="py-3 bg-white border border-ink/20 font-bold text-xs uppercase tracking-widest text-ink flex items-center justify-center gap-2 hover:bg-soft-green transition-colors">
              <CreditCard className="w-5 h-5" />
              Card
            </button>
          </div>
          <button
            disabled={posCart.length === 0}
            onClick={checkout}
            className="w-full py-4 bg-ink text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Complete Order <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
