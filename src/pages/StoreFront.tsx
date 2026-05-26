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
    </div>
  );
}
