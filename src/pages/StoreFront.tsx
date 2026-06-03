import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import SEO from '../components/SEO';
import { buildStoreJsonLd } from '../lib/seo';
import { useReducedMotion } from '../hooks/useReducedMotion';
import TrustBadges from '../components/TrustBadges';
import { RecentActivityNotification } from '../components/SocialProof';
import {
  LayoutGrid,
  Shirt,
  ShoppingBag,
  Home,
  Gem,
  Leaf,
  Coffee,
  Watch,
  Sparkles,
  Package,
  ArrowRight,
  TrendingUp,
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  Mail,
  Award,
} from 'lucide-react';
import {
  HeroSection,
  FeaturedCategories,
  FeaturedProducts,
  SavoirFaireSection,
  TestimonialsSection,
  NewsletterSection,
  BrandValuesSection,
  AnimatedCounter,
} from '../components/storefront';

// ─── Category config ────────────────────────────────────────────────────────
// Maps a category name (case-insensitive prefix match) to an icon + accent color.
// Add more entries as your catalogue grows.
const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ElementType; accent: string; bg: string }
> = {
  tout:        { icon: LayoutGrid,  accent: 'text-ink',        bg: 'bg-ink/10'       },
  vêtements:   { icon: Shirt,       accent: 'text-blue-600',   bg: 'bg-blue-50'      },
  accessoires: { icon: ShoppingBag, accent: 'text-amber-600',  bg: 'bg-amber-50'     },
  maison:      { icon: Home,        accent: 'text-emerald-600',bg: 'bg-emerald-50'   },
  bijoux:      { icon: Gem,         accent: 'text-purple-600', bg: 'bg-purple-50'    },
  beauté:      { icon: Sparkles,    accent: 'text-pink-600',   bg: 'bg-pink-50'      },
  nature:      { icon: Leaf,        accent: 'text-green-600',  bg: 'bg-green-50'     },
  café:        { icon: Coffee,      accent: 'text-orange-700', bg: 'bg-orange-50'    },
  montres:     { icon: Watch,       accent: 'text-slate-600',  bg: 'bg-slate-100'    },
};

/** Returns the config for a given category name, falling back to a generic one. */
function getCategoryConfig(name: string) {
  const key = name.toLowerCase();
  // Exact match first, then prefix match
  if (CATEGORY_CONFIG[key]) return CATEGORY_CONFIG[key];
  const prefixKey = Object.keys(CATEGORY_CONFIG).find(k => key.startsWith(k));
  return prefixKey ? CATEGORY_CONFIG[prefixKey] : { icon: Package, accent: 'text-ink/70', bg: 'bg-ink/5' };
}

export default function StoreFront() {
  const { products, categories: storeCategories, searchQuery, isLoadingProducts } = useStore();
  const [activeTab, setActiveTab] = useState('Tout');
  const [currentPage, setCurrentPage] = useState(1);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [email, setEmail] = useState('');
  const prefersReducedMotion = useReducedMotion();
  const PRODUCTS_PER_PAGE = 12;

  const testimonials = [
    { name: 'Sophie M.', role: 'Cliente fidèle', initials: 'SM', rating: 5, text: 'Une expérience d\'achat exceptionnelle. Les produits sont d\'une qualité remarquable et la livraison est toujours rapide.' },
    { name: 'Thomas L.', role: 'Acheteur régulier', initials: 'TL', rating: 5, text: 'Je suis impressionné par la qualité des produits et le service client irréprochable. Je recommande vivement.' },
    { name: 'Camille D.', role: 'Nouvelle cliente', initials: 'CD', rating: 5, text: 'Première commande et déjà conquise ! Emballage soigné, produits conformes à la description. Je reviendrai.' },
  ];

  const categoryImages = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail('');
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  useEffect(() => {
    if (categoryParam && storeCategories.length > 0) {
      const match = storeCategories.find(
        c => c.name.toLowerCase() === categoryParam.toLowerCase()
      );
      if (match) {
        setActiveTab(match.name);
      }
    } else if (!categoryParam) {
      setActiveTab('Tout');
    }
  }, [categoryParam, storeCategories]);

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    if (tabName === 'Tout') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', tabName.toLowerCase());
    }
    setSearchParams(searchParams);
  };

  const categories = ['Tout', ...storeCategories.filter(c => c.level === 1).map(c => c.name)];
  // Map category name → full Category object for image_url access
  const categoryMap = Object.fromEntries(storeCategories.filter(c => c.level === 1).map(c => [c.name, c]));

  const filteredProducts = products.filter(p =>
    (activeTab === 'Tout' || (p.categories || []).includes(activeTab)) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.effects.some(e => e.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Featured products (top 4 by rating or newest)
  const featuredProducts = useMemo(
    () => [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4),
    [products]
  );

  // Top categories for editorial section
  const editorialCategories = useMemo(
    () => storeCategories.filter(c => c.level === 1).slice(0, 4),
    [storeCategories]
  );

  // Get active category SEO data
  const activeCategoryObj = activeTab !== 'Tout' ? categoryMap[activeTab] : null;
  const categoryTitle = activeTab === 'Tout' ? 'Collection premium e-commerce' : `${activeTab} - Collection Véridian`;
  const categoryDescription = activeTab === 'Tout' 
    ? 'Explorez la collection Véridian : produits premium, recommandations IA et expérience d\'achat élégante.'
    : `Découvrez notre sélection de ${activeTab.toLowerCase()} premium avec livraison rapide et service client exceptionnel.`;

  return (
    <div className="bg-bg flex-1">
      <SEO
        title={categoryTitle}
        description={categoryDescription}
        path="/"
        jsonLd={buildStoreJsonLd()}
        seoData={activeCategoryObj?.seo}
        keywords={activeTab !== 'Tout' ? activeTab : 'e-commerce, boutique, premium'}
      />
      
      <RecentActivityNotification />
      
      <HeroSection 
        productsCount={products.length} 
        categoriesCount={storeCategories.filter(c => c.level === 1).length} 
      />

      <TrustBadges />

      {/* ═══════════════════════════════════════════════════════════════════════
          CATEGORIES EN VEDETTE — Magazine editorial grid
      ═══════════════════════════════════════════════════════════════════════ */}
      {editorialCategories.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-end justify-between mb-12"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-3 block">Explorer</span>
                <h2 className="text-3xl md:text-5xl font-light font-serif text-ink">
                  Nos <span className="italic">Univers</span>
                </h2>
              </div>
              <a
                href="#collection"
                className="hidden md:flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink/50 hover:text-ink transition-colors group"
              >
                Tout voir
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {editorialCategories.map((cat, i) => (
                <motion.a
                  key={cat.id}
                  href={`#collection`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(cat.name);
                    document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`group relative overflow-hidden cursor-pointer ${
                    i === 0 ? 'row-span-2 min-h-[300px] md:min-h-[500px]' : 'min-h-[200px] md:min-h-[240px]'
                  }`}
                >
                  {/* Image */}
                  <div className="absolute inset-0">
                    <img
                      src={cat.image_url || categoryImages[i] || categoryImages[0]}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent group-hover:from-ink/90 transition-all duration-500" />
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                    <h3 className="text-white font-serif text-lg md:text-xl mb-1">{cat.name}</h3>
                    <div className="flex items-center gap-2 text-white/60 text-[11px] font-medium uppercase tracking-[0.1em] group-hover:text-white/80 transition-colors">
                      <span>Découvrir</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURED PRODUCTS — Top rated
      ═══════════════════════════════════════════════════════════════════════ */}
      {!isLoadingProducts && featuredProducts.length > 0 && (
        <section id="featured" className="bg-white py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="h-px w-8 bg-accent/30" />
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Sélection</span>
                <span className="h-px w-8 bg-accent/30" />
              </div>
              <h2 className="text-3xl md:text-5xl font-light font-serif text-ink mb-4">
                Produits <span className="italic">Vedettes</span>
              </h2>
              <p className="text-ink/50 max-w-lg mx-auto text-sm leading-relaxed">
                Nos articles les plus appréciés, sélectionnés pour leur qualité exceptionnelle et leur design intemporel
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {featuredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          NOTRE SAVOIR-FAIRE — Split layout with animated stats
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Image */}
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, x: -30 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"
                  alt="Notre savoir-faire"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating accent card */}
              <div className="absolute -bottom-6 -right-6 md:bottom-8 md:-right-8 bg-white p-6 shadow-2xl max-w-[200px]">
                <p className="text-3xl font-serif italic text-accent mb-1">
                  <AnimatedCounter target={98} suffix="%" />
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50">Clients satisfaits</p>
              </div>
            </motion.div>

            {/* Right — Content */}
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, x: 30 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-4 block">Notre histoire</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light font-serif text-ink mb-6 leading-tight">
                Le goût de <br className="hidden md:block" />
                l'<span className="italic">excellence</span>
              </h2>
              <p className="text-ink/60 mb-8 leading-relaxed">
                Depuis notre création, nous avons à cœur de sélectionner les meilleurs produits
                pour nos clients. Chaque article est choisi avec soin pour garantir une qualité
                exceptionnelle et un design intemporel qui traverse les tendances.
              </p>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-6 mb-8 pt-8 border-t border-ink/10">
                <div>
                  <p className="text-2xl md:text-3xl font-serif italic text-ink">
                    <AnimatedCounter target={5000} suffix="+" />
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink/40 mt-1">Clients</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-serif italic text-ink">
                    <AnimatedCounter target={150} suffix="+" />
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink/40 mt-1">Produits</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-serif italic text-ink">
                    <AnimatedCounter target={12} />
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink/40 mt-1">Pays</p>
                </div>
              </div>

              <a
                href="#collection"
                className="group inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink border-b-2 border-ink pb-1 hover:text-accent hover:border-accent transition-colors"
              >
                Découvrir notre collection
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TESTIMONIALS — Immersive carousel
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-ink py-20 md:py-28 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="h-px w-8 bg-accent/30" />
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Témoignages</span>
              <span className="h-px w-8 bg-accent/30" />
            </div>
            <h2 className="text-3xl md:text-5xl font-light font-serif text-white">
              Ce que disent <span className="italic text-accent/80">nos clients</span>
            </h2>
          </motion.div>

          {/* Testimonial card */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
                className="max-w-3xl mx-auto text-center"
              >
                {/* Stars */}
                <div className="flex justify-center gap-1 mb-8">
                  {Array.from({ length: testimonials[testimonialIndex].rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-accent fill-accent" />
                  ))}
                </div>

                {/* Quote */}
                <Quote className="w-10 h-10 text-accent/20 mx-auto mb-6" />
                <p className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed font-light italic">
                  "{testimonials[testimonialIndex].text}"
                </p>

                {/* Author */}
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-white font-bold text-sm">
                    {testimonials[testimonialIndex].initials}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold text-sm">{testimonials[testimonialIndex].name}</p>
                    <p className="text-white/40 text-xs uppercase tracking-wider">{testimonials[testimonialIndex].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Nav buttons */}
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={() => setTestimonialIndex(i => i === 0 ? testimonials.length - 1 : i - 1)}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-colors"
                aria-label="Témoignage précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === testimonialIndex ? 'bg-accent w-6' : 'bg-white/20 hover:bg-white/40'
                    }`}
                    aria-label={`Témoignage ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setTestimonialIndex(i => i === testimonials.length - 1 ? 0 : i + 1)}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-colors"
                aria-label="Témoignage suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          COLLECTION — Product catalogue with category pills
      ═══════════════════════════════════════════════════════════════════════ */}
      <main id="collection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 scroll-mt-24">
        {/* Section header */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-3 block">Catalogue</span>
          <h2 className="text-3xl md:text-5xl font-light font-serif text-ink mb-4">
            Notre <span className="italic">Collection</span>
          </h2>
          <p className="text-ink/50 max-w-lg mx-auto text-sm">
            Parcourez l'ensemble de nos produits premium, filtrés par catégorie
          </p>
        </motion.div>

        {/* Visual category pills */}
        <div className="flex gap-3 mb-12 overflow-x-auto pb-3 scrollbar-hide md:justify-center">
          {categories.map(cat => {
            const { icon: Icon, accent, bg } = getCategoryConfig(cat);
            const isActive = activeTab === cat;
            const catObj = cat !== 'Tout' ? categoryMap[cat] : null;
            const hasImage = !!catObj?.image_url;
            return (
              <button
                key={cat}
                onClick={() => handleTabChange(cat)}
                className="relative flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent min-w-[72px]"
                aria-pressed={isActive}
              >
                {/* Animated background pill */}
                {isActive && (
                  <motion.span
                    layoutId="category-active-bg"
                    className={`absolute inset-0 rounded-2xl ${hasImage ? 'bg-ink/10' : bg} border border-current/20`}
                    style={{ originX: 0.5, originY: 0.5 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Icon or uploaded image */}
                <span className={`relative z-10 transition-all duration-200 ${isActive ? accent : 'text-ink/40'}`}>
                  {hasImage ? (
                    <img
                      src={catObj!.image_url!}
                      alt={cat}
                      className={`w-6 h-6 rounded-lg object-cover transition-all duration-200 ${isActive ? 'ring-2 ring-current' : 'opacity-50 grayscale'}`}
                    />
                  ) : (
                    <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  )}
                </span>

                {/* Label */}
                <span
                  className={`relative z-10 text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 ${
                    isActive ? accent : 'text-ink/50'
                  }`}
                >
                  {cat}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {isLoadingProducts ? (
            Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          ) : (
            paginatedProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : i * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))
          )}
        </div>

        {!isLoadingProducts && filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-ink/50 italic text-xl">Aucun article ne correspond à votre recherche...</p>
          </div>
        )}

        {/* Pagination */}
        {!isLoadingProducts && totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] border border-ink/15 text-ink hover:bg-ink/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            
            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 text-[11px] font-semibold transition-colors ${
                    currentPage === page
                      ? 'bg-ink text-bg'
                      : 'border border-ink/15 text-ink hover:bg-ink/5'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] border border-ink/15 text-ink hover:bg-ink/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          NEWSLETTER — Glassmorphism design
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1920&q=80')" }}
        />
        <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />
        
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="h-px w-8 bg-accent/30" />
              <Mail className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Newsletter</span>
              <span className="h-px w-8 bg-accent/30" />
            </div>
            <h2 className="text-3xl md:text-5xl font-light font-serif text-white mb-4">
              Restez <span className="italic text-accent/80">informé</span>
            </h2>
            <p className="text-white/50 mb-10 max-w-xl mx-auto text-sm leading-relaxed">
              Inscrivez-vous à notre newsletter pour recevoir nos dernières nouveautés, offres exclusives et conseils style.
            </p>

            {/* Glassmorphism form card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-2xl max-w-md mx-auto">
              <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  required
                  className="w-full px-5 py-3.5 bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-accent/50 transition-colors text-sm rounded-lg"
                />
                <button
                  type="submit"
                  className="w-full px-6 py-3.5 bg-accent text-white font-semibold text-sm uppercase tracking-[0.15em] hover:bg-accent/90 transition-colors rounded-lg"
                >
                  S'inscrire
                </button>
              </form>
              <p className="text-[10px] text-white/30 mt-4">
                En vous inscrivant, vous acceptez de recevoir nos communications marketing.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          BRAND VALUES — Engagements
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-bg py-20 md:py-28 border-t border-ink/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-3 block">Nos valeurs</span>
            <h2 className="text-3xl md:text-5xl font-light font-serif text-ink mb-4">
              Nos <span className="italic">Engagements</span>
            </h2>
            <p className="text-ink/50 max-w-lg mx-auto text-sm">
              Des valeurs qui guident chacune de nos actions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: Leaf,
                title: 'Durabilité',
                desc: 'Nous nous engageons pour un commerce responsable et des produits durables qui respectent l\'environnement.',
              },
              {
                icon: Award,
                title: 'Excellence',
                desc: 'Chaque produit est sélectionné avec soin pour garantir une qualité exceptionnelle et une satisfaction totale.',
              },
              {
                icon: Sparkles,
                title: 'Innovation',
                desc: 'Nous utilisons les dernières technologies pour vous offrir une expérience d\'achat unique et personnalisée.',
              },
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/8 mb-6 group-hover:bg-accent/15 transition-colors duration-300">
                  <value.icon className="w-7 h-7 text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-3 text-ink">{value.title}</h3>
                <p className="text-ink/50 text-sm leading-relaxed max-w-xs mx-auto">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
