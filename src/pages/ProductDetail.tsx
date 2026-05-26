import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store';
import { ChevronLeft, Heart, Plus, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Product } from '../types';

export default function ProductDetail() {
  const { id } = useParams();
  const { products, addToCart, toggleFavorite, favorites, fetchProducts } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [products.length, fetchProducts]);

  useEffect(() => {
    if (id && products.length > 0) {
      setProduct(products.find(p => p.id === id) || null);
    }
  }, [id, products]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg">
        <p className="text-sm font-bold uppercase tracking-widest text-ink/40 animate-pulse">Chargement...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg">
        <h2 className="text-3xl font-serif mb-4">Produit introuvable</h2>
        <Link to="/" className="text-xs font-bold uppercase tracking-widest text-ink hover:underline">Retour à la boutique</Link>
      </div>
    );
  }

  const isFavorite = favorites.includes(product.id);

  return (
    <div className="flex-1 bg-bg px-4 sm:px-6 lg:px-8 py-12 flex flex-col">
      <div className="max-w-7xl mx-auto w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink/60 hover:text-ink mb-12 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Retour
        </Link>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative aspect-square md:aspect-[4/5] bg-soft-green rounded-t-full overflow-hidden"
          >
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <button 
              onClick={() => toggleFavorite(product.id)}
              className="absolute top-8 right-8 p-3 rounded-full glass text-ink hover:bg-white transition-colors z-20"
            >
              <Heart className={cn("w-5 h-5", isFavorite && "fill-ink")} />
            </button>
            <div className="absolute top-8 left-8 text-xs font-bold uppercase tracking-widest opacity-40 z-10">
              N°{product.id.replace('prod_', '').padStart(3, '0')}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-4">{product.category}</p>
            <h1 className="text-5xl md:text-6xl font-light font-serif leading-none mb-6 text-ink">{product.name}</h1>
            
            <p className="text-xl md:text-2xl text-ink/80 italic mb-8 border-l-2 border-ink/20 pl-6">
              {product.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-10">
              {product.effects.map(effect => (
                <span key={effect} className="px-4 py-2 rounded-full border border-ink/20 text-xs uppercase tracking-widest text-ink font-semibold">
                  {effect}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-8 mb-12">
              <span className="text-4xl font-serif">{product.price.toFixed(2)}€</span>
              <div className="text-xs uppercase tracking-widest opacity-50 font-bold">TTC</div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-ink">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-4 text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-12 text-center font-bold">{quantity}</div>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-4 text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button 
                onClick={() => addToCart(product, quantity)}
                className="flex-1 py-4 bg-ink text-white font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors"
              >
                Ajouter au panier
              </button>
            </div>
            
            {product.stock > 0 && product.stock <= 10 && (
              <p className="text-xs text-orange-600 font-bold uppercase tracking-widest mt-4">
                Plus que {product.stock} en stock
              </p>
            )}
            {product.stock === 0 && (
              <p className="text-xs text-red-600 font-bold uppercase tracking-widest mt-4">
                Rupture de stock
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
