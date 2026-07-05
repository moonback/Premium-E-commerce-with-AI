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

export default React.memo(ProductCard);

function ProductCard({ product }: { product: Product }) {
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

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Connectez-vous pour ajouter aux favoris');
      return;
    }
    if (isFavorite) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  return (
    <>
      <motion.div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="group relative flex flex-col bg-white p-4 border border-gray-200 rounded-lg overflow-hidden hover:border-[#ff9900] hover:shadow-lg transition-all duration-300"
      >
        <Link to={productPath} className="relative aspect-square overflow-hidden bg-gray-50 mb-3 block rounded">
          {/* Badges */}
          <ProductBadges
            isNew={product.isNew}
            stock={product.stock}
            isBestseller={false}
            isTrending={false}
          />

          {/* Badge produit en lot */}
          {product.is_batch_product && (
            <div className="absolute top-2 left-2 z-20 bg-[#c7511f] text-white px-2 py-1 text-[10px] font-bold uppercase rounded">
              Lot de {product.batch_size}
            </div>
          )}

          {/* Image optimisée */}
          <OptimizedImage
            src={product.image}
            alt={product.name}
            width={300}
            height={300}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Quick actions overlay */}
          <AnimatePresence>
            {isHover && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 flex items-center justify-center gap-2 z-20"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowQuickView(true);
                  }}
                  className="p-2 rounded-full bg-white shadow-lg hover:bg-[#ff9900] hover:text-white transition-colors"
                  aria-label="Aperçu rapide"
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Favoris button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleWishlistToggle}
            className={cn(
              "absolute top-2 right-2 p-2 rounded-full transition-all z-20 shadow-md",
              isFavorite 
                ? "bg-red-500 text-white" 
                : "bg-white text-ink/60 hover:bg-red-50 hover:text-red-500"
            )}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart className={cn('w-3.5 h-3.5 transition-all', isFavorite && 'fill-white')} />
          </motion.button>
        </Link>

        <div className="flex-1 flex flex-col">
          <Link to={productPath} className="mb-2">
            <h3 className="text-sm font-medium leading-tight line-clamp-2 hover:text-[#007185] transition-colors mb-1">
              {product.name}
            </h3>
          </Link>
          
          <ProductRating productId={product.id} />

          <div className="mt-auto pt-2">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-lg font-bold text-[#c7511f]">{product.price.toFixed(2)}€</span>
              {product.is_batch_product && (
                <span className="text-[10px] text-ink/50">
                  ({(product.price / product.batch_size!).toFixed(2)}€/unité)
                </span>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={added ? { scale: [1, 1.05, 1] } : {}}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={cn(
                'w-full py-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors',
                product.stock === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-[#ff9900] text-ink hover:bg-[#fa8900]'
              )}
            >
              {product.stock === 0 ? (
                'Rupture de stock'
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter au panier
                </>
              )}
            </motion.button>
          </div>
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
