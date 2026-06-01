import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../store';
import { Heart, Plus, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { getProductPath } from '../lib/seo';
import ProductRating from './ProductRating';
import { ProductBadges } from './ProductBadge';
import QuickView from './QuickView';
import { OptimizedImage } from './OptimizedImage';
import toast from 'react-hot-toast';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, addToWishlist, removeFromWishlist, wishlist, user } = useStore();
  const productPath = getProductPath(product);
  const isFavorite = wishlist.some(w => w.product_id === product.id);

  // hover state for AnimatePresence overlay
  const [isHover, setIsHover] = useState(false);
  // add‑to‑cart animation trigger
  const [added, setAdded] = useState(false);
  // Quick view modal
  const [showQuickView, setShowQuickView] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 300);
  };

  return (
    <>
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
          {/* Badges dynamiques */}
          <ProductBadges
            isNew={product.isNew}
            stock={product.stock}
            isBestseller={false} // À implémenter avec analytics
            isTrending={false}   // À implémenter avec analytics
          />

          {/* Image optimisée */}
          <OptimizedImage
            src={product.image}
            alt={product.name}
            width={400}
            height={500}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Quick actions on hover */}
          <AnimatePresence>
            {isHover && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowQuickView(true);
                  }}
                  className="p-3 rounded-full bg-bg shadow-lg hover:bg-accent hover:text-bg transition-colors"
                  aria-label="Aperçu rapide"
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Favoris button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!user) {
                toast.error('Connectez-vous pour sauvegarder vos favoris');
                return;
              }
              if (isFavorite) {
                removeFromWishlist(product.id);
              } else {
                addToWishlist(product.id);
              }
            }}
            className="absolute top-4 right-4 p-2 rounded-full glass text-ink hover:bg-bg transition-colors z-20"
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
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
          <ProductRating productId={product.id} />
          <p className="text-ink/60 text-xs opacity-50 italic uppercase mb-3 line-clamp-2">
            {product.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {product.effects.slice(0, 3).map((effect) => (
              <span
                key={effect}
                className="px-3 py-1 rounded-full border border-ink/20 text-[10px] uppercase tracking-wider text-ink"
              >
                {effect}
              </span>
            ))}
            {product.effects.length > 3 && (
              <span className="px-3 py-1 rounded-full border border-ink/20 text-[10px] uppercase tracking-wider text-ink/50">
                +{product.effects.length - 3}
              </span>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={added ? { scale: [1, 1.1, 1] } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={cn(
              'w-full py-4 border border-ink text-ink font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors',
              product.stock === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-ink hover:text-bg'
            )}
          >
            <Plus className="w-4 h-4" />
            {product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
          </motion.button>
        </div>
      </motion.div>

      {/* Quick View Modal */}
      <QuickView
        product={product}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
      />
    </>
  );
}
