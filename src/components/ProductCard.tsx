import React from 'react';
import { Product } from '../types';
import { useStore } from '../store';
import { Heart, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleFavorite, favorites } = useStore();
  const isFavorite = favorites.includes(product.id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col justify-between bg-white p-6 border border-ink/5 relative"
    >
      <div className="absolute top-4 left-4 text-[10px] font-bold uppercase opacity-30 z-10">N°{product.id.replace('prod_', '').padStart(3, '0')}</div>
      <div className="relative aspect-[4/5] overflow-hidden bg-soft-green rounded-t-full mb-6">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button 
          onClick={() => toggleFavorite(product.id)}
          className="absolute top-4 right-4 p-2 rounded-full glass text-ink hover:bg-white transition-colors"
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-ink")} />
        </button>
      </div>

      <div>
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-serif text-xl leading-tight">{product.name}</h3>
          <span className="font-semibold">{product.price.toFixed(2)}€</span>
        </div>
        <p className="text-ink/60 text-xs opacity-50 italic uppercase mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {product.effects.map(effect => (
            <span key={effect} className="px-3 py-1 rounded-full border border-ink/20 text-[10px] uppercase tracking-wider text-ink">
              {effect}
            </span>
          ))}
        </div>

        <button 
          onClick={() => addToCart(product)}
          className="w-full py-4 border border-ink text-ink font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ink hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
}
