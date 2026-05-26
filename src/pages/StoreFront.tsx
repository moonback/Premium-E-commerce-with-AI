import React, { useState } from 'react';
import { useStore } from '../store';
import { ShoppingBag, Search, User, Star, MapPin } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import CartDrawer from '../components/CartDrawer';

export default function StoreFront() {
  const { products, searchQuery, setSearchQuery } = useStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const categories = ['All', 'Fruits', 'Gourmandise', 'Noix & Graines'];

  const filteredProducts = products.filter(p => 
    (activeTab === 'All' || p.category === activeTab) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.effects.some(e => e.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 w-full bg-bg/80 backdrop-blur-md border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold tracking-tighter font-serif italic text-ink">Véridian</span>
            </div>
            
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <input 
                  type="text"
                  placeholder="Rechercher par saveur, fruit ou texture..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-soft-green border border-ink/10 rounded-none text-sm focus:bg-white focus:border-ink/30 focus:ring-0 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button className="text-ink/60 hover:text-ink transition-colors">
                <User className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="text-ink/60 hover:text-ink transition-colors relative"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-ink text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {useStore(state => state.cart.length)}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mb-12">
          <h1 className="text-5xl md:text-6xl font-light font-serif text-ink mb-4 leading-none">
            L'Illusion <br/><span className="italic">Gourmande</span>
          </h1>
          <p className="text-lg text-ink/60">
            Pâtisseries trompe-l'œil artisanales. Découvrez l'exquise fusion du visuel et du goût.
          </p>
        </div>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                activeTab === cat 
                  ? 'bg-ink text-white' 
                  : 'bg-transparent text-ink/60 hover:bg-soft-green border border-ink/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
