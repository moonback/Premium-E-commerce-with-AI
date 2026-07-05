import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
  Clock,
  Zap,
  Tag,
  Gift,
} from 'lucide-react';
import { AnimatedCounter } from '../components/storefront';

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
  const [email, setEmail] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const PRODUCTS_PER_PAGE = 20;

  // Hero carousel images
  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
      title: 'Collection Premium',
      subtitle: 'Découvrez nos nouveautés exclusives',
      cta: 'Acheter maintenant',
      link: '#deals'
    },
    {
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80',
      title: 'Offres Spéciales',
      subtitle: 'Jusqu\'à -50% sur une sélection de produits',
      cta: 'Voir les offres',
      link: '#featured'
    },
    {
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80',
      title: 'Livraison Gratuite',
      subtitle: 'Sur toutes les commandes de plus de 100€',
      cta: 'En profiter',
      link: '#collection'
    }
  ];

  // Auto-rotate carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

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

  // Featured products (top 8 by rating or newest)
  const featuredProducts = useMemo(
    () => [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 8),
    [products]
  );

  // Deal of the day - highest discount or featured product
  const dealOfTheDay = useMemo(() => {
    return products.length > 0 ? products[Math.floor(Math.random() * Math.min(5, products.length))] : null;
  }, [products]);

  // Best sellers - top 4 products
  const bestSellers = useMemo(
    () => [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4),
    [products]
  );

  // Top categories for editorial section (4 main categories with images)
  const editorialCategories = useMemo(
    () => storeCategories.filter(c => c.level === 1).slice(0, 8),
    [storeCategories]
  );

  // Get active category SEO data
  const activeCategoryObj = activeTab !== 'Tout' ? categoryMap[activeTab] : null;
  const categoryTitle = activeTab === 'Tout' ? 'Collection premium e-commerce' : `${activeTab} - Collection Véridian`;
  const categoryDescription = activeTab === 'Tout' 
    ? 'Explorez la collection Véridian : produits premium, recommandations IA et expérience d\'achat élégante.'
    : `Découvrez notre sélection de ${activeTab.toLowerCase()} premium avec livraison rapide et service client exceptionnel.`;

  return (
    <div className="bg-[#f0f2f2] flex-1">
      <SEO
        title={categoryTitle}
        description={categoryDescription}
        path="/"
        jsonLd={buildStoreJsonLd()}
        seoData={activeCategoryObj?.seo}
        keywords={activeTab !== 'Tout' ? activeTab : 'e-commerce, boutique, premium'}
      />
      
      <RecentActivityNotification />

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO CAROUSEL — Full width rotating banners like Amazon
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-b from-[#e3e6e6] to-transparent pb-20">
        <div className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={carouselIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <div 
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url('${heroSlides[carouselIndex].image}')` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              </div>
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="max-w-xl"
                  >
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                      {heroSlides[carouselIndex].title}
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 mb-8">
                      {heroSlides[carouselIndex].subtitle}
                    </p>
                    <a
                      href={heroSlides[carouselIndex].link}
                      className="inline-block px-8 py-4 bg-[#ff9900] hover:bg-[#fa8900] text-ink font-bold rounded-lg shadow-lg transition-colors text-sm"
                    >
                      {heroSlides[carouselIndex].cta}
                    </a>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Navigation */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCarouselIndex(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === carouselIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Arrow Navigation */}
          <button
            onClick={() => setCarouselIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full transition-colors z-20"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => setCarouselIndex((prev) => (prev + 1) % heroSlides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full transition-colors z-20"
            aria-label="Suivant"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Category Cards Grid - Overlapping Hero */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {editorialCategories.slice(0, 4).map((cat, i) => (
              <motion.a
                key={cat.id}
                href={`#collection`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(cat.name);
                  document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
                }}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={cat.image_url || categoryImages[i]}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm mb-1">{cat.name}</h3>
                  <span className="text-xs text-[#007185] hover:text-[#c7511f] hover:underline font-medium">
                    Acheter maintenant
                  </span>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="bg-white border-t border-b border-gray-200 py-4">
        <TrustBadges />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DEAL OF THE DAY — Highlighted product with countdown
      ═══════════════════════════════════════════════════════════════════════ */}
      {dealOfTheDay && !isLoadingProducts && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-[#ff9900]" />
              <h2 className="text-2xl md:text-3xl font-bold text-ink">Offre du jour</h2>
            </div>
            <div className="bg-gradient-to-r from-[#ff9900]/10 to-transparent border border-[#ff9900]/20 rounded-lg p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <Link to={`/product/${dealOfTheDay.id}`}>
                    <img
                      src={dealOfTheDay.image}
                      alt={dealOfTheDay.name}
                      className="w-full h-auto rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                </div>
                <div>
                  <div className="inline-block px-3 py-1 bg-[#c7511f] text-white text-xs font-bold rounded-full mb-4">
                    OFFRE LIMITÉE
                  </div>
                  <Link to={`/product/${dealOfTheDay.id}`}>
                    <h3 className="text-2xl md:text-3xl font-bold text-ink mb-4 hover:text-[#007185]">
                      {dealOfTheDay.name}
                    </h3>
                  </Link>
                  <p className="text-ink/70 mb-6 leading-relaxed">
                    {dealOfTheDay.description}
                  </p>
                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-3xl md:text-4xl font-bold text-[#c7511f]">
                      {dealOfTheDay.price.toFixed(2)}€
                    </span>
                    <span className="text-lg text-ink/50 line-through">
                      {(dealOfTheDay.price * 1.3).toFixed(2)}€
                    </span>
                    <span className="px-2 py-1 bg-[#c7511f] text-white text-sm font-bold rounded">
                      -30%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-6 text-sm text-ink/60">
                    <Clock className="w-4 h-4" />
                    <span>Se termine dans 23h 45min</span>
                  </div>
                  <Link
                    to={`/product/${dealOfTheDay.id}`}
                    className="inline-block px-8 py-3 bg-[#ff9900] hover:bg-[#fa8900] text-ink font-bold rounded-lg shadow-md transition-colors"
                  >
                    Voir l'offre
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          CATEGORIES — Visual grid like Amazon departments
      ═══════════════════════════════════════════════════════════════════════ */}
      {editorialCategories.length > 4 && (
        <section className="py-12 bg-[#f0f2f2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-ink mb-8">Acheter par catégorie</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {editorialCategories.slice(4).map((cat, i) => (
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
                  transition={{ delay: i * 0.1 }}
                  className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={cat.image_url || categoryImages[i % categoryImages.length]}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-1">{cat.name}</h3>
                    <span className="text-xs text-[#007185] hover:text-[#c7511f] hover:underline font-medium">
                      Découvrir
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURED PRODUCTS — Product grid in Amazon style
      ═══════════════════════════════════════════════════════════════════════ */}
      {!isLoadingProducts && featuredProducts.length > 0 && (
        <section id="featured" className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-ink">Produits recommandés pour vous</h2>
              <a href="#collection" className="text-[#007185] hover:text-[#c7511f] hover:underline font-medium text-sm">
                Tout voir
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
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
          TESTIMONIALS — Customer reviews section
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-[#f7f7f7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-8">Ce que disent nos clients</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Sophie M.', rating: 5, text: 'Excellente qualité, livraison rapide. Je recommande vivement !' },
              { name: 'Thomas L.', rating: 5, text: 'Produits conformes à la description. Service client très réactif.' },
              { name: 'Camille D.', rating: 5, text: 'Ma boutique préférée ! Toujours satisfaite de mes achats.' },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-sm"
              >
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-[#ff9900] fill-[#ff9900]" />
                  ))}
                </div>
                <p className="text-ink/80 text-sm mb-4 leading-relaxed">"{testimonial.text}"</p>
                <p className="text-ink/60 text-xs font-semibold">{testimonial.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          COLLECTION — Main product catalogue with filters
      ═══════════════════════════════════════════════════════════════════════ */}
      <main id="collection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-24 bg-white">
        {/* Section header */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-4">
            {activeTab === 'Tout' ? 'Tous les produits' : activeTab}
          </h2>
          <p className="text-ink/60 text-sm">
            {filteredProducts.length} résultat{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Category filters - Amazon style horizontal pills */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-3 scrollbar-hide">
          {categories.map(cat => {
            const isActive = activeTab === cat;
            return (
              <button
                key={cat}
                onClick={() => handleTabChange(cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-ink text-white shadow-md' 
                    : 'bg-white border border-gray-300 text-ink hover:bg-gray-50'
                }`}
                aria-pressed={isActive}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {isLoadingProducts ? (
            Array.from({ length: 20 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          ) : (
            paginatedProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))
          )}
        </div>

        {!isLoadingProducts && filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-ink/20 mx-auto mb-4" />
            <p className="text-ink/50 text-lg">Aucun produit trouvé</p>
            <p className="text-ink/40 text-sm mt-2">Essayez avec d'autres filtres</p>
          </div>
        )}

        {/* Pagination - Amazon style */}
        {!isLoadingProducts && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm border border-gray-300 text-ink hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded"
            >
              Précédent
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 text-sm font-medium transition-colors rounded ${
                      currentPage === page
                        ? 'bg-[#ff9900] text-white'
                        : 'border border-gray-300 text-ink hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm border border-gray-300 text-ink hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded"
            >
              Suivant
            </button>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          NEWSLETTER — Amazon-inspired CTA section
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-gradient-to-r from-[#232f3e] to-[#1a2332]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Inscrivez-vous à notre newsletter
          </h2>
          <p className="text-white/70 mb-8 text-sm">
            Recevez nos meilleures offres et nos nouveautés en exclusivité
          </p>
          
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre adresse email"
              required
              className="flex-1 px-4 py-3 bg-white border-none text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-[#ff9900] text-sm rounded"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#ff9900] hover:bg-[#fa8900] text-ink font-bold text-sm transition-colors rounded whitespace-nowrap"
            >
              S'inscrire
            </button>
          </form>
          <p className="text-white/40 text-xs mt-4">
            En vous inscrivant, vous acceptez de recevoir nos communications marketing
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          BRAND VALUES — Trust indicators
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: Package,
                title: 'Livraison rapide',
                desc: 'Livraison gratuite dès 100€ d\'achat',
              },
              {
                icon: Award,
                title: 'Qualité garantie',
                desc: 'Produits sélectionnés avec soin',
              },
              {
                icon: Gift,
                title: 'Service client',
                desc: 'Support 7j/7 pour vous accompagner',
              },
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-[#ff9900]/10 flex items-center justify-center mb-4">
                  <value.icon className="w-8 h-8 text-[#ff9900]" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-ink">{value.title}</h3>
                <p className="text-ink/60 text-sm">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
