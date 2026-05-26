import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store';
import { ChevronLeft, Heart, Plus, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Product } from '../types';
import AccordionItem from '../components/AccordionItem';
import { getCurrentTenantBranding } from '../white-label/tenant';
import { formatTenantCurrency } from '../white-label/format';

export default function ProductDetail() {
  const { id } = useParams();
  const { products, addToCart, toggleFavorite, favorites, fetchProducts } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const branding = getCurrentTenantBranding();


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

  // Mocks pour les nouvelles fonctionnalités
  const mockGallery = [
    product.image,
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=600&q=80"
  ];

  const reviews = [
    { id: 1, author: "Camille L.", rating: 5, date: "Il y a 2 jours", text: "Visuellement bluffant et gustativement exceptionnel. Une vraie expérience premium." },
    { id: 2, author: "Marc D.", rating: 5, date: "Il y a 1 semaine", text: "Les textures sont incroyables, on sent la qualité des ingrédients. Je recommande vivement." },
  ];

  const suggestedProducts = products.filter(p => p.id !== product.id).slice(0, 3);



  return (
    <div className="flex-1 bg-bg px-4 sm:px-6 lg:px-8 py-12 flex flex-col">
      <div className="max-w-7xl mx-auto w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink/60 hover:text-ink mb-12 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Retour
        </Link>

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
              <button
                onClick={() => toggleFavorite(product.id)}
                className="absolute top-8 right-8 p-3 rounded-full glass text-ink hover:bg-bg transition-colors z-20"
              >
                <Heart className={cn("w-5 h-5", isFavorite && "fill-ink")} />
              </button>
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


            <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-4">{product.categories?.[0] ?? 'Sans catégorie'}</p>
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
              <span className="text-4xl font-serif">{formatTenantCurrency(product.price, branding)}</span>
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
                className="flex-1 py-4 bg-ink text-bg font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors"
              >
                Ajouter au panier
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
                  <p className="text-ink/50 text-sm font-semibold">{formatTenantCurrency(p.price, branding)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Section Avis Clients */}
        <div className="mt-32 border-t border-ink/10 pt-16 pb-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h3 className="text-3xl font-serif mb-2">Avis Vérifiés</h3>
              <div className="flex items-center gap-2">
                <div className="flex text-ink">
                  {[1, 2, 3, 4, 5].map(i => <span key={i}>★</span>)}
                </div>
                <span className="text-sm font-bold uppercase tracking-widest text-ink/50">4.9/5 (128 avis)</span>
              </div>
            </div>
            <button className="text-xs font-bold uppercase tracking-widest border-b border-ink pb-1 hover:text-ink/60 transition-colors">
              Écrire un avis
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {reviews.map(review => (
              <div key={review.id} className="p-8 border border-ink/10 bg-white/50 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex text-ink text-sm">
                    {[...Array(review.rating)].map((_, i) => <span key={i}>★</span>)}
                  </div>
                  <span className="text-xs text-ink/40 font-bold uppercase tracking-widest">{review.date}</span>
                </div>
                <p className="italic text-ink/80 mb-6 line-clamp-3">"{review.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center font-bold text-xs">{review.author.charAt(0)}</div>
                  <span className="text-sm font-bold uppercase tracking-widest">{review.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
