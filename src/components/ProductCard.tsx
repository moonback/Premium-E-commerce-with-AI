import React from 'react';
import { Product } from '../types';
import { useStore } from '../store';
import { Heart, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { getCurrentTenantBranding } from '../white-label/tenant';
import { formatTenantCurrency } from '../white-label/format';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleFavorite, favorites } = useStore();
  const isFavorite = favorites.includes(product.id);
  const branding = getCurrentTenantBranding();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group flex flex-col justify-between bg-transparent p-6 border border-ink/5 relative hover:border-ink/20 hover:shadow-2xl transition-all duration-300"
    >
      <div className="absolute top-4 left-4 text-[10px] font-bold uppercase opacity-30 z-10 transition-opacity group-hover:opacity-100">N°{product.id.replace('prod_', '').padStart(3, '0')}</div>
      <Link to={`/product/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-soft-green rounded-t-full mb-6 block">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button 
          onClick={(e) => { e.preventDefault(); toggleFavorite(product.id); }}
          className="absolute top-4 right-4 p-2 rounded-full glass text-ink hover:bg-bg transition-colors z-20"
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-ink")} />
        </button>
      </Link>

      <div>
        <div className="flex justify-between items-start mb-1">
          <Link to={`/product/${product.id}`}>
            <h3 className="font-serif text-xl leading-tight hover:text-ink/70 transition-colors">{product.name}</h3>
          </Link>
          <span className="font-semibold">{formatTenantCurrency(product.price, branding)}</span>
        </div>
        <p className="text-ink/60 text-xs opacity-50 italic uppercase mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {product.effects.map(effect => (
            <span key={effect} className="px-3 py-1 rounded-full border border-ink/20 text-[10px] uppercase tracking-wider text-ink">
              {effect}
            </span>
          ))}
        </div>

        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => addToCart(product)}
          className="w-full py-4 border border-ink text-ink font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ink hover:text-bg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter au panier
        </motion.button>
      </div>
    </motion.div>
  );
}
