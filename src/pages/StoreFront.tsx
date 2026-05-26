import React, { useState } from 'react';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';
import { motion } from 'motion/react';

export default function StoreFront() {
  const { products, categories: storeCategories, searchQuery, isLoadingProducts } = useStore();
  const [activeTab, setActiveTab] = useState('Tout');

  const categories = ['Tout', ...storeCategories.filter(c => c.level === 1).map(c => c.name)];

  const filteredProducts = products.filter(p => 
    (activeTab === 'Tout' || (p.categories || []).includes(activeTab)) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.effects.some(e => e.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="bg-bg flex-1">
      <div className="relative w-full h-[60vh] md:h-[70vh] bg-ink flex items-center justify-center overflow-hidden">
        <motion.img 
           initial={{ scale: 1.1 }}
           animate={{ scale: 1 }}
           transition={{ duration: 10, ease: "easeOut" }}
           src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04" 
           alt="Boutique artisanale" 
           className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center"
        >
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/70 mb-6">Maison de Qualité</span>
          <h1 className="text-6xl md:text-8xl font-light font-serif text-white mb-6 leading-none">
            La Collection <br/><span className="italic">Essentielle</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl font-light">
            Découvrez notre sélection de produits intemporels. L'alliance parfaite entre esthétique et utilité.
          </p>
        </motion.div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex gap-4 mb-12 overflow-x-auto pb-2 scrollbar-hide justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                activeTab === cat 
                  ? 'bg-ink text-bg scale-105' 
                  : 'bg-transparent text-ink/60 hover:bg-ink/5 border border-ink/20 hover:border-ink/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {isLoadingProducts ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-4">
                <div className="aspect-[4/5] bg-ink/5 rounded-t-full w-full"></div>
                <div className="flex justify-between">
                   <div className="h-6 bg-ink/10 w-1/2 rounded"></div>
                   <div className="h-6 bg-ink/5 w-16 rounded"></div>
                </div>
                <div className="h-4 bg-ink/5 w-3/4 rounded mt-2"></div>
              </div>
            ))
          ) : (
            filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
             ))
          )}
        </div>
        
        {!isLoadingProducts && filteredProducts.length === 0 && (
           <div className="text-center py-20">
              <p className="text-ink/50 italic text-xl">Aucun article ne correspond à votre recherche...</p>
           </div>
        )}
      </main>
    </div>
  );
}
