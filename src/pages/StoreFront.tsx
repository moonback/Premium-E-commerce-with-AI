import React, { useState } from 'react';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';

export default function StoreFront() {
  const { products, searchQuery } = useStore();
  const [activeTab, setActiveTab] = useState('All');

  const categories = ['All', 'Fruits', 'Gourmandise', 'Noix & Graines'];

  const filteredProducts = products.filter(p => 
    (activeTab === 'All' || p.category === activeTab) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.effects.some(e => e.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="bg-bg flex-1">
      <div className="relative w-full h-[60vh] md:h-[70vh] bg-ink flex items-center justify-center overflow-hidden">
        <img 
           src="https://images.unsplash.com/photo-1578985545062-69928b1d9587" 
           alt="Pâtisserie artisanale" 
           className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/70 mb-6">Maison de Haute Pâtisserie</span>
          <h1 className="text-6xl md:text-8xl font-light font-serif text-white mb-6 leading-none">
            L'Illusion <br/><span className="italic">Gourmande</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl font-light">
            Découvrez nos créations trompe-l'œil artisanales. L'exquise fusion du visuel et du goût.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex gap-4 mb-12 overflow-x-auto pb-2 scrollbar-hide justify-center">
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
    </div>
  );
}
