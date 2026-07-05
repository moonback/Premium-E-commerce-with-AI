import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store';
import {
  ChevronLeft, Heart, Plus, Minus, ShoppingBag, Star,
  Truck, RotateCcw, Shield, Check, ChevronRight,
  Share2, Package, Zap, Info, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Product } from '../types';
import ProductReviews from '../components/ProductReviews';
import SEO from '../components/SEO';
import { buildProductJsonLd, findProductByRouteParam, getProductPath } from '../lib/seo';
import toast from 'react-hot-toast';
import { ViewingCount, LimitedStockBadge } from '../components/SocialProof';
import Breadcrumbs from '../components/Breadcrumbs';
import { slugify } from '../lib/slugify';
import ErrorMessage, { ErrorMessages, useErrorMessage } from '../components/ErrorMessage';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const { products, addToCart, addToWishlist, removeFromWishlist, wishlist, user, fetchProducts, setAuthModalOpen } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const [showStickyAdd, setShowStickyAdd] = useState(false);
  const { error, showError, clearError } = useErrorMessage();

  // Multiple "images" — use same image repeated as gallery placeholder
  const galleryImages = product ? [product.image, product.image, product.image] : [];

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
    if (product.stock === 0) {
      showError('Produit indisponible', 'Ce produit est actuellement en rupture de stock.', [
        { label: 'Ajouter aux favoris', onClick: handleWishlistToggle, variant: 'primary' },
        { label: 'Fermer', onClick: clearError, variant: 'secondary' },
      ]);
      return;
    }
    if (quantity > product.stock) {
      const stockError = ErrorMessages.insufficientStock(product.stock);
      showError(stockError.title, stockError.message, [
        { label: 'Ajuster', onClick: () => { setQuantity(product.stock); clearError(); }, variant: 'primary' },
        { label: 'Annuler', onClick: clearError, variant: 'secondary' },
      ]);
      return;
    }
    addToCart(product, quantity);
    toast.success('Ajouté au panier !');
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
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f0f2f2]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#ff9900] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink/50">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#f0f2f2]">
        <SEO title="Produit introuvable" description="Ce produit n'est pas disponible." path={id ? `/product/${id}` : '/product'} />
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-ink">Produit introuvable</h2>
        <p className="text-ink/60 mb-6">Ce produit n'existe pas ou n'est plus disponible.</p>
        <Link to="/" className="px-6 py-3 bg-[#ff9900] hover:bg-[#fa8900] text-ink font-bold rounded-lg transition-colors">
          Retour à la boutique
        </Link>
      </div>
    );
  }

  const isFavorite = wishlist.some(w => w.product_id === product.id);
  const suggestedProducts = products.filter(p => p.id !== product.id).slice(0, 4);
  const discountPercent = product.promotion ? Math.round(
    ((product.price - product.promotion.promo_price) / product.price) * 100
  ) : null;
  const displayPrice = product.promotion ? product.promotion.promo_price : product.price;

  return (
    <div className="bg-[#f0f2f2] min-h-screen pb-24 md:pb-0">
      <SEO
        title={product.name}
        description={product.description}
        path={getProductPath(product)}
        image={product.image}
        type="product"
        jsonLd={buildProductJsonLd(product)}
        seoData={product.seo}
        keywords={product.effects?.join(', ')}
      />

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-2 px-4">
        <div className="max-w-7xl mx-auto">
          {(() => {
            const firstCat = (product.categories || [])[0];
            const catSlug = firstCat ? slugify(firstCat) : null;
            return (
              <Breadcrumbs
                items={[
                  ...(firstCat && catSlug ? [{ label: firstCat, path: `/category/${catSlug}` }] : []),
                  { label: product.name, path: getProductPath(product) },
                ]}
              />
            );
          })()}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Error */}
        {error && (
          <div className="mb-6">
            <ErrorMessage type={error.type} title={error.title} message={error.message} actions={error.actions} onClose={clearError} />
          </div>
        )}

        {/* Main product grid — Amazon 3-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1.2fr_340px] gap-6">

          {/* ── Column 1: Images ── */}
          <div className="md:sticky md:top-4 md:self-start">
            {/* Main image */}
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200 aspect-square relative group">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                src={galleryImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain p-6"
              />
              {/* Promotion badge */}
              {discountPercent && (
                <div className="absolute top-3 left-3 bg-[#c7511f] text-white text-xs font-bold px-2 py-1 rounded">
                  -{discountPercent}%
                </div>
              )}
              {/* Wishlist */}
              <button
                onClick={handleWishlistToggle}
                className={cn(
                  'absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all',
                  isFavorite ? 'bg-red-50 text-red-500' : 'bg-white text-gray-400 hover:text-red-400'
                )}
              >
                <Heart className={cn('w-5 h-5', isFavorite && 'fill-red-500')} />
              </button>
              {/* Share */}
              <button
                onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
                className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white shadow text-gray-400 hover:text-ink flex items-center justify-center transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail gallery */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 mt-3">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      'w-16 h-16 rounded border-2 overflow-hidden flex-shrink-0 transition-all',
                      selectedImage === i ? 'border-[#ff9900]' : 'border-gray-200 hover:border-gray-400'
                    )}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Column 2: Info ── */}
          <div className="space-y-4">
            {/* Category */}
            <div className="flex flex-wrap gap-1">
              {(product.categories || []).map(cat => (
                <Link
                  key={cat}
                  to={`/?category=${encodeURIComponent(cat)}`}
                  className="text-xs text-[#007185] hover:text-[#c7511f] hover:underline"
                >
                  {cat}
                </Link>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-xl md:text-2xl font-bold text-ink leading-snug">
              {product.name}
            </h1>

            {/* Rating row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star
                    key={s}
                    className={cn('w-4 h-4', s <= Math.round(product.rating ?? 0) ? 'fill-[#ff9900] text-[#ff9900]' : 'text-gray-300')}
                  />
                ))}
              </div>
              <a href="#reviews" className="text-sm text-[#007185] hover:text-[#c7511f] hover:underline">
                {product.rating ? `${product.rating.toFixed(1)} (${product.total_sales ?? 0} avis)` : 'Soyez le premier à noter'}
              </a>
              <span className="text-gray-300">|</span>
              <ViewingCount productId={product.id} />
            </div>

            <div className="border-t border-gray-200" />

            {/* Price section */}
            <div className="space-y-1">
              {product.promotion ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#c7511f]">
                      {product.promotion.promo_price.toFixed(2)}€
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      {product.price.toFixed(2)}€
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#c7511f] text-white text-xs font-bold rounded">
                      -{discountPercent}%
                    </span>
                  </div>
                  {product.promotion.promo_label && (
                    <p className="text-sm font-bold text-[#c7511f]">
                      {product.promotion.promo_label}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-ink">
                    {product.price.toFixed(2)}€
                  </span>
                  <span className="text-xs text-gray-500">TVA incluse</span>
                </div>
              )}
              <p className="text-xs text-gray-500">
                Livraison gratuite dès 100€ •{' '}
                <a href="#livraison" className="text-[#007185] hover:underline">Voir les détails</a>
              </p>
            </div>

            {/* Stock indicator */}
            <LimitedStockBadge stock={product.stock} threshold={10} />
            {product.stock > 10 && (
              <p className="text-sm text-green-600 font-medium">✓ En stock</p>
            )}
            {product.stock === 0 && (
              <p className="text-sm font-bold text-red-600">Rupture de stock</p>
            )}

            <div className="border-t border-gray-200" />

            {/* Description */}
            <div>
              <p className={cn(
                'text-sm text-ink/80 leading-relaxed',
                !showFullDesc && 'line-clamp-4'
              )}>
                {product.description}
              </p>
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="mt-1 text-xs text-[#007185] hover:underline flex items-center gap-1"
              >
                {showFullDesc ? 'Voir moins' : 'Voir plus'}
                <ChevronDown className={cn('w-3 h-3 transition-transform', showFullDesc && 'rotate-180')} />
              </button>
            </div>

            {/* Effects / Tags */}
            {product.effects.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink/60 uppercase tracking-wide mb-2">Caractéristiques</p>
                <div className="flex flex-wrap gap-2">
                  {product.effects.map(effect => (
                    <span key={effect} className="px-3 py-1 bg-[#f7f7f7] border border-gray-200 rounded-full text-xs text-ink font-medium hover:border-[#ff9900] cursor-default transition-colors">
                      {effect}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Specs accordion */}
            {product.specs && product.specs.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200">
                <div className="px-4 py-2 bg-gray-50">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink/60">Fiche technique</p>
                </div>
                {product.specs.map((spec, i) => (
                  <div key={i} className="flex px-4 py-3 odd:bg-white even:bg-gray-50">
                    <span className="text-xs font-semibold text-ink w-36 flex-shrink-0">{spec.title}</span>
                    <span className="text-xs text-ink/70">{spec.content}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Lot info */}
            {product.is_batch_product && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  <strong>Lot de {product.batch_size}</strong> {product.batch_unit && `(${product.batch_unit})`} —{' '}
                  soit {(displayPrice / (product.batch_size ?? 1)).toFixed(2)}€/unité
                </p>
              </div>
            )}
          </div>

          {/* ── Column 3: Buy box (Amazon-style sticky panel) ── */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm">
              {/* Price */}
              <div>
                <p className="text-2xl font-bold text-ink">
                  {displayPrice.toFixed(2)}€
                </p>
                {product.promotion && (
                  <p className="text-sm text-gray-500 line-through">{product.price.toFixed(2)}€</p>
                )}
              </div>

              {/* Free shipping */}
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-100 rounded-lg">
                <Truck className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-700">Livraison gratuite</p>
                  <p className="text-xs text-green-600">Sur les commandes de plus de 100€</p>
                </div>
              </div>

              {/* Stock status */}
              {product.stock > 0 ? (
                <p className="text-sm font-bold text-green-600">✓ En stock</p>
              ) : (
                <p className="text-sm font-bold text-red-600">Rupture de stock</p>
              )}

              {/* Quantity selector */}
              {product.stock > 0 && (
                <div>
                  <label className="text-xs font-semibold text-ink/60 uppercase tracking-wide block mb-2">
                    Quantité
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg w-fit overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 hover:bg-gray-100 transition-colors text-ink border-r border-gray-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-5 py-2 text-sm font-bold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-4 py-2 hover:bg-gray-100 transition-colors text-ink border-l border-gray-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  {product.stock <= 10 && (
                    <p className="text-xs text-[#c7511f] mt-1 font-medium">
                      Plus que {product.stock} en stock
                    </p>
                  )}
                </div>
              )}

              {/* CTA Buttons */}
              <div className="space-y-2">
                <button
                  ref={addBtnRef}
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={cn(
                    'w-full py-3 rounded-full font-bold text-sm transition-all shadow-sm',
                    product.stock === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#ff9900] hover:bg-[#fa8900] text-ink active:scale-95'
                  )}
                >
                  {product.stock === 0 ? 'Indisponible' : 'Ajouter au panier'}
                </button>

                <button
                  onClick={() => {
                    handleAddToCart();
                    if (product.stock > 0) window.location.href = '/checkout';
                  }}
                  disabled={product.stock === 0}
                  className={cn(
                    'w-full py-3 rounded-full font-bold text-sm transition-all shadow-sm',
                    product.stock === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#ffd814] hover:bg-[#f7ca00] text-ink active:scale-95'
                  )}
                >
                  Acheter maintenant
                </button>
              </div>

              {/* Wishlist link */}
              <button
                onClick={handleWishlistToggle}
                className="w-full text-sm text-[#007185] hover:text-[#c7511f] hover:underline flex items-center justify-center gap-1"
              >
                <Heart className={cn('w-4 h-4', isFavorite && 'fill-red-500 text-red-500')} />
                {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </button>

              <div className="border-t border-gray-200" />

              {/* Guarantees */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-ink/70">
                  <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Paiement 100% sécurisé</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-ink/70">
                  <RotateCcw className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Retours gratuits sous 30 jours</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-ink/70">
                  <Zap className="w-4 h-4 text-[#ff9900] flex-shrink-0" />
                  <span>Expédition sous 24h</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-ink/70">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Satisfait ou remboursé</span>
                </div>
              </div>
            </div>

            {/* Sold by card */}
            <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-ink/60 mb-1">Vendu et expédié par</p>
              <p className="text-sm font-bold text-[#007185]">Véridian</p>
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className="w-3 h-3 fill-[#ff9900] text-[#ff9900]" />
                ))}
                <span className="text-xs text-ink/60 ml-1">Vendeur certifié</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Suggested products ── */}
        {suggestedProducts.length > 0 && (
          <section className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-ink mb-6 flex items-center gap-2">
              <span>Vous aimerez aussi</span>
              <span className="text-xs font-normal text-ink/50">Basé sur vos préférences</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {suggestedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Reviews ── */}
        <section id="reviews" className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <ProductReviews productId={product.id} />
        </section>

      </div>

      {/* Sticky mobile CTA */}
      <AnimatePresence>
        {showStickyAdd && product.stock > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-16 inset-x-0 z-30 md:hidden bg-white border-t border-gray-200 px-4 py-3 shadow-xl"
          >
            <div className="flex items-center gap-3 max-w-lg mx-auto">
              <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{product.name}</p>
                <p className="text-sm font-bold text-[#c7511f]">{displayPrice.toFixed(2)}€</p>
              </div>
              <button
                onClick={handleAddToCart}
                className="px-5 py-2.5 bg-[#ff9900] hover:bg-[#fa8900] text-ink font-bold text-sm rounded-full transition-colors flex items-center gap-2 shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />
                Ajouter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
