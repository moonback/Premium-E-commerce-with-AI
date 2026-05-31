import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../store';
import { Heart, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { getProductPath } from '../lib/seo';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleFavorite, favorites } = useStore();
  const productPath = getProductPath(product);
  const isFavorite = favorites.includes(product.id);

  // hover state for AnimatePresence overlay
  const [isHover, setIsHover] = useState(false);
  // add‑to‑cart animation trigger
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 300);
  };

  return (
    <motion.div
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group relative flex flex-col justify-between bg-transparent p-6 border border-ink/5 rounded-lg overflow-hidden hover:border-ink/20 hover:shadow-2xl transition-all duration-300"
    >
      {/* Gradient overlay on hover using AnimatePresence */}
      <AnimatePresence>
        {isHover && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/30 to-transparent pointer-events-none"
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      <div className="absolute top-4 left-4 text-[10px] font-bold uppercase opacity-30 z-10 transition-opacity group-hover:opacity-100">
        N°{product.id.replace('prod_', '').padStart(3, '0')}
      </div>

      <Link to={productPath} className="relative aspect-[4/5] overflow-hidden bg-soft-green rounded-t-full mb-6 block">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(product.id);
          }}
          className="absolute top-4 right-4 p-2 rounded-full glass text-ink hover:bg-bg transition-colors z-20"
        >
          <Heart className={cn('w-4 h-4', isFavorite && 'fill-ink')} />
        </button>
      </Link>

      <div>
        <div className="flex justify-between items-start mb-1">
          <Link to={productPath}>
            <h3 className="font-serif text-xl leading-tight hover:text-ink/70 transition-colors">
              {product.name}
            </h3>
          </Link>
          <span className="font-semibold">{product.price.toFixed(2)}€</span>
        </div>
        <p className="text-ink/60 text-xs opacity-50 italic uppercase mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-6 relative">
          {product.effects.map((effect) => (
            <span
              key={effect}
              className="px-3 py-1 rounded-full border border-ink/20 text-[10px] uppercase tracking-wider text-ink"
            >
              {effect}
            </span>
          ))}
          {/* Nouveau badge */}
          {product.isNew && (
            <span className="absolute top-2 left-2 bg-ink text-bg px-2 py-0.5 text-xs font-bold rounded">Nouveau</span>
          )}
          {/* Rupture de stock */}
          {product.stock === 0 && (
            <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded">Rupture</span>
          )}
          {/* Stock restant (moins de 5) */}
          {product.stock > 0 && product.stock < 5 && (
            <span className="absolute top-2 right-2 bg-amber-500 text-bg px-2 py-0.5 text-xs font-bold rounded">
              Stock: {product.stock}
            </span>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={added ? { scale: [1, 1.1, 1] } : {}}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          onClick={handleAddToCart}
          className="w-full py-4 border border-ink text-ink font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ink hover:text-bg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter au panier
        </motion.button>
      </div>
    </motion.div>
  );
}
