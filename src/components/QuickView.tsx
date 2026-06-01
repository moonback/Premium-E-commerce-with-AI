// src/components/QuickView.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { layers } from '../styles/tokens/layers';
import { Button } from './ui/Button';
import ProductRating from './ProductRating';
import { Link } from 'react-router-dom';
import { getProductPath } from '../lib/seo';

export interface QuickViewProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickView({ product, isOpen, onClose }: QuickViewProps) {
  const { addToCart, addToWishlist, removeFromWishlist, wishlist, user } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const isFavorite = wishlist.some((w) => w.product_id === product.id);

  const handleAddToCart = async () => {
    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
    addToCart(product, quantity);
    setIsAdding(false);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1500);
  };

  const handleWishlist = () => {
    if (!user) return;
    if (isFavorite) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm"
            style={{ zIndex: layers.modal }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl bg-bg rounded-2xl shadow-2xl overflow-hidden"
            style={{ zIndex: layers.modal + 1 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-bg/80 backdrop-blur-sm hover:bg-ink/10 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
              {/* Image */}
              <div className="relative aspect-square bg-soft-green rounded-2xl overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.isNew && (
                  <span className="absolute top-4 left-4 bg-accent text-bg px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg">
                    Nouveau
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col">
                <div className="flex-1">
                  <h2 className="text-3xl font-serif mb-2">{product.name}</h2>
                  <ProductRating productId={product.id} />
                  
                  <p className="text-2xl font-bold my-4">{product.price.toFixed(2)}€</p>

                  <p className="text-ink/70 mb-6">{product.description}</p>

                  {/* Effects/Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {product.effects.map((effect) => (
                      <span
                        key={effect}
                        className="px-3 py-1 rounded-full border border-ink/20 text-xs uppercase tracking-wider"
                      >
                        {effect}
                      </span>
                    ))}
                  </div>

                  {/* Stock */}
                  <div className="mb-6">
                    {product.stock === 0 ? (
                      <p className="text-red-600 font-semibold">Rupture de stock</p>
                    ) : product.stock < 5 ? (
                      <p className="text-amber-600 font-semibold">
                        Plus que {product.stock} en stock !
                      </p>
                    ) : (
                      <p className="text-emerald-600 font-semibold">En stock</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-sm font-bold uppercase tracking-wider">
                      Quantité
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="p-2 border border-ink/20 rounded-lg hover:bg-ink/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-semibold">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        disabled={quantity >= product.stock}
                        className="p-2 border border-ink/20 rounded-lg hover:bg-ink/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    loading={isAdding}
                    success={isAdded}
                    disabled={product.stock === 0}
                    fullWidth
                    leftIcon={<ShoppingBag className="w-4 h-4" />}
                  >
                    {isAdded ? 'Ajouté !' : 'Ajouter au panier'}
                  </Button>

                  <button
                    onClick={handleWishlist}
                    disabled={!user}
                    className={cn(
                      'p-4 border border-ink/20 rounded-lg hover:bg-ink/5 transition-colors',
                      'disabled:opacity-40 disabled:cursor-not-allowed',
                      isFavorite && 'bg-ink/5'
                    )}
                    aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart className={cn('w-5 h-5', isFavorite && 'fill-ink')} />
                  </button>
                </div>

                {/* View full details */}
                <Link
                  to={getProductPath(product)}
                  onClick={onClose}
                  className="mt-4 text-center text-sm text-ink/60 hover:text-ink underline underline-offset-4 transition-colors"
                >
                  Voir tous les détails →
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
