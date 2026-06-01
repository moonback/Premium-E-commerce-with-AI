import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store';
import { ChevronLeft, Heart, Plus, Minus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Product } from '../types';
import AccordionItem from '../components/AccordionItem';
import ProductReviews from '../components/ProductReviews';
import SEO from '../components/SEO';
import { buildProductJsonLd, findProductByRouteParam, getProductPath } from '../lib/seo';
import toast from 'react-hot-toast';
import { ViewingCount, LimitedStockBadge } from '../components/SocialProof';
import { SecurityBadges, SatisfactionGuarantee } from '../components/TrustBadges';
import Breadcrumbs from '../components/Breadcrumbs';
import ErrorMessage, { ErrorMessages, useErrorMessage } from '../components/ErrorMessage';

export default function ProductDetail() {
  const { id } = useParams();
  const { products, addToCart, addToWishlist, removeFromWishlist, wishlist, user, fetchProducts, setAuthModalOpen } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Sticky CTA — all hooks must be declared before any early return
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const [showStickyAdd, setShowStickyAdd] = useState(false);
  const { error, showError, clearError } = useErrorMessage();

  const handleWishlistToggle = () => {
    if (!user) {
      toast.error('Connectez-vous pour ajouter aux favoris');
      setAuthModalOpen(true);
      return;
    }
    if (isFavorite) {
      removeFromWishlist(product!.id);
    } else {
      addToWishlist(product!.id);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Vérifier le stock
    if (product.stock === 0) {
      showError(
        'Produit indisponible',
        'Ce produit est actuellement en rupture de stock. Ajoutez-le à vos favoris pour être notifié de son retour.',
        [
          { label: 'Ajouter aux favoris', onClick: handleWishlistToggle, variant: 'primary' },
          { label: 'Fermer', onClick: clearError, variant: 'secondary' },
        ]
      );
      return;
    }

    if (quantity > product.stock) {
      const stockError = ErrorMessages.insufficientStock(product.stock);
      showError(
        stockError.title,
        stockError.message,
        [
          { label: 'Ajuster', onClick: () => { setQuantity(product.stock); clearError(); }, variant: 'primary' },
          { label: 'Annuler', onClick: clearError, variant: 'secondary' },
        ]
      );
      return;
    }

    addToCart(product, quantity);
    clearError();
  };

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [products.length, fetchProducts]);

  useEffect(() => {
    if (id && products.length > 0) {
      setProduct(findProductByRouteParam(products, id));
    }
  }, [id, products]);

  useEffect(() => {
    const el = addBtnRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyAdd(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product]);

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
        <SEO title="Produit introuvable" description="Ce produit Véridian est introuvable ou n'est plus disponible." path={id ? `/product/${id}` : '/product'} />
        <h2 className="text-3xl font-serif mb-4">Produit introuvable</h2>
        <Link to="/" className="text-xs font-bold uppercase tracking-widest text-ink hover:underline">Retour à la boutique</Link>
      </div>
    );
  }

  const isFavorite = wishlist.some(w => w.product_id === product.id);

  // Mocks pour les nouvelles fonctionnalités
  const mockGallery = [
    product.image,
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=600&q=80"
  ];

  const suggestedProducts = products.filter(p => p.id !== product.id).slice(0, 3);



  return (
    <div className="flex-1 bg-bg px-4 sm:px-6 lg:px-8 py-12 flex flex-col">
      <SEO
        title={product.name}
        description={product.description}
        path={getProductPath(product)}
        image={product.image}
        type="product"
        jsonLd={buildProductJsonLd(product)}
      />
      <div className="max-w-7xl mx-auto w-full">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: (product.categories || [])[0] || 'Produits', path: '/' },
            { label: product.name, path: getProductPath(product) },
          ]}
          className="mb-8"
        />

        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink/60 hover:text-ink mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Retour
        </Link>

        {/* Error Message */}
        {error && (
          <div className="mb-8">
            <ErrorMessage
              type={error.type}
              title={error.title}
              message={error.message}
              actions={error.actions}
              onClose={clearError}
            />
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* Section Image / Galerie */}
          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative aspect-square md:aspect-[4/5] bg-soft-green rounded-t-full overflow-hidden"
            >
              <img
                src={mockGallery[activeImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-500"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleWishlistToggle}
                className={cn(
                  "absolute top-8 right-8 p-3 rounded-full transition-all z-20 shadow-lg",
                  isFavorite 
                    ? "bg-accent text-white" 
                    : "glass text-ink hover:bg-bg"
                )}
                aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart className={cn("w-5 h-5 transition-all", isFavorite && "fill-white")} />
              </motion.button>
              <div className="absolute top-8 left-8 text-xs font-bold uppercase tracking-widest opacity-40 z-10 bg-bg/50 px-3 py-1 rounded-full backdrop-blur-md">
                N°{product.id.replace('prod_', '').padStart(3, '0')}
              </div>
            </motion.div>

            {/* Miniatures */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {mockGallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={cn(
                    "relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all",
                    activeImageIndex === idx ? "border-ink" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} alt={`Vue ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            {/* Social Proof Elements */}
            <div className="mb-6 space-y-3">
              <ViewingCount productId={product.id} />
              <LimitedStockBadge stock={product.stock} threshold={10} />
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-4">{(product.categories || []).join(', ')}</p>
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
                ref={addBtnRef}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={cn(
                  "flex-1 py-4 font-bold text-xs uppercase tracking-widest transition-colors",
                  product.stock === 0
                    ? "bg-ink/20 text-ink/40 cursor-not-allowed"
                    : "bg-ink text-bg hover:bg-ink/90"
                )}
              >
                {product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
              </button>
            </div>

            {/* Dynamic Specifications Accordion */}
            {product.specs && product.specs.length > 0 && (
              <div className="mt-8 space-y-4">
                {product.specs.map((spec, idx) => (
                  <AccordionItem key={idx} spec={spec} />
                ))}
              </div>
            )}

            {product.stock > 0 && product.stock <= 10 && (
              <p className="text-xs text-orange-600 font-bold uppercase tracking-widest mt-4">
                Plus que {product.stock} en stock
              </p>
            )}
            {product.stock === 0 && (
              <p className="text-xs text-red-600 font-bold uppercase tracking-widest mt-4 mb-8">
                Rupture de stock
              </p>
            )}

            {/* Security & Guarantee */}
            <div className="mt-8 space-y-4">
              <SecurityBadges />
              <SatisfactionGuarantee />
            </div>
          </motion.div>
        </div>

        {/* Section Cross-Selling */}
        {suggestedProducts.length > 0 && (
          <div className="mt-32 border-t border-ink/10 pt-16">
            <h3 className="text-2xl font-serif text-center mb-12">S'accorde parfaitement avec...</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              {suggestedProducts.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="group block">
                  <div className="aspect-square bg-soft-green mb-4 overflow-hidden rounded-t-full relative">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <h4 className="font-serif text-xl mb-1">{p.name}</h4>
                  <p className="text-ink/50 text-sm font-semibold">{p.price.toFixed(2)}€</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Section Avis Clients */}
        <div className="mt-32 border-t border-ink/10 pt-16 pb-12">
          <ProductReviews productId={product.id} />
        </div>
      </div>

      {/* Sticky CTA — visible on mobile when main button scrolls out of view */}
      <AnimatePresence>
        {showStickyAdd && product.stock > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-0 bottom-16 z-30 border-t border-ink/10 bg-bg/95 p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden"
          >
            <div className="mx-auto flex max-w-lg items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-sm text-ink">{product.name}</p>
                <p className="text-xs font-bold text-ink/60">{product.price.toFixed(2)}€</p>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={cn(
                  "flex items-center gap-2 rounded-full px-5 py-3 text-[10px] font-bold uppercase tracking-widest shadow-lg transition-colors",
                  product.stock === 0
                    ? "bg-ink/20 text-ink/40 cursor-not-allowed"
                    : "bg-ink text-bg hover:bg-ink/90"
                )}
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                {product.stock === 0 ? 'Indisponible' : `Ajouter — ${(product.price * quantity).toFixed(2)}€`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
