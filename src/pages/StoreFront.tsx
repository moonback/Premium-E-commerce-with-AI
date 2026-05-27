import React, { useState } from 'react';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import ProductCardSkeleton from '../components/ProductCardSkeleton';

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
      <div className="relative w-full h-[60vh] md:h-[80vh] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04')" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 to-transparent opacity-70"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center pt-20"
        >
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/70 mb-6">Maison de Qualité</span>
          <h1 className="text-6xl md:text-8xl font-light font-serif text-white mb-6 leading-none">
            La Collection <br /><span className="italic">Essentielle</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl font-light mb-6">
            Découvrez notre sélection de produits intemporels. L'alliance parfaite entre esthétique et utilité.
          </p>
          <Link to="/storefront" className="px-6 py-3 bg-white text-ink font-bold uppercase tracking-widest hover:bg-white/90 transition-colors">
            Explorer la collection
          </Link>
        </motion.div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex gap-4 mb-12 overflow-x-auto pb-2 scrollbar-hide justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${activeTab === cat
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
            Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
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
