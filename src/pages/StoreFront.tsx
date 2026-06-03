import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import SEO from '../components/SEO';
import { buildStoreJsonLd } from '../lib/seo';
import { useReducedMotion } from '../hooks/useReducedMotion';
import TrustBadges from '../components/TrustBadges';
import { RecentActivityNotification } from '../components/SocialProof';
import toast from 'react-hot-toast';
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
  Truck,
  Shield,
  Headphones,
  Award,
  Star,
  TrendingUp,
  Mail,
  ArrowRight,
  Quote,
} from 'lucide-react';

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
  const prefersReducedMotion = useReducedMotion();
  const PRODUCTS_PER_PAGE = 12;

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
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Featured products (top 4 by rating or newest)
  // Note: use [...products] to avoid mutating the original array
  const featuredProducts = useMemo(
    () => [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4),
    [products]
  );

  // Newsletter handler
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement newsletter subscription (connect to Supabase subscribers table or Brevo/Mailchimp)
    setEmail('');
    toast.success('Merci pour votre inscription à la newsletter !');
  };

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
      
      {/* Notification de preuve sociale */}
      <RecentActivityNotification />
      
      <div className="relative w-full h-[60vh] md:h-[80vh] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04')" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 to-transparent opacity-70"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center pt-20"
        >
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/70 mb-6"
          >
            Maison de Qualité
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-6xl md:text-8xl font-light font-serif text-white mb-6 leading-none"
          >
            La Collection <br /><span className="italic">Essentielle</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-lg md:text-xl text-white/80 max-w-2xl font-light mb-6"
          >
            Découvrez notre sélection de produits intemporels. L'alliance parfaite entre esthétique et utilité.
          </motion.p>
          <motion.a 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            href="#collection" 
            className="group px-8 py-4 bg-white text-ink font-bold uppercase tracking-widest hover:bg-white/90 transition-all flex items-center gap-2"
          >
            Explorer la collection
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.a>
        </motion.div>
      </div>

      {/* ── Trust Badges Section ── */}
      <TrustBadges />

      

      {/* ── Featured Products Section ── */}
      {!isLoadingProducts && featuredProducts.length > 0 && (
        <section className="bg-bg py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink/70">Sélection</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-light font-serif text-ink mb-4">
                Produits <span className="italic">Vedettes</span>
              </h2>
              <p className="text-ink/60 max-w-2xl mx-auto">
                Découvrez nos articles les plus appréciés, sélectionnés pour leur qualité exceptionnelle
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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

      {/* ── Testimonials Section ── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="w-5 h-5 text-accent fill-accent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink/70">Témoignages</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-light font-serif text-ink mb-4">
              Ce que disent <span className="italic">nos clients</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sophie Martin',
                role: 'Cliente fidèle',
                text: 'Une expérience d\'achat exceptionnelle. La qualité des produits est irréprochable et le service client est remarquable.',
                rating: 5,
              },
              {
                name: 'Thomas Dubois',
                role: 'Acheteur régulier',
                text: 'Je recommande vivement Véridian. Les produits sont élégants, durables et le rapport qualité-prix est excellent.',
                rating: 5,
              },
              {
                name: 'Marie Laurent',
                role: 'Nouvelle cliente',
                text: 'Impressionnée par la rapidité de livraison et l\'attention portée aux détails. Je reviendrai sans hésiter.',
                rating: 5,
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-bg p-8 relative group hover:shadow-lg transition-shadow"
              >
                <Quote className="absolute top-6 right-6 w-8 h-8 text-ink/5 group-hover:text-ink/10 transition-colors" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-ink/70 mb-6 italic leading-relaxed">{testimonial.text}</p>
                <div>
                  <p className="font-bold text-sm uppercase tracking-widest">{testimonial.name}</p>
                  <p className="text-xs text-ink/50 uppercase tracking-wider">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <main id="collection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-24">
        {/* ── Visual category pills ── */}
        <div className="flex gap-3 mb-12 overflow-x-auto pb-3 scrollbar-hide md:justify-center">
          {categories.map(cat => {
            const { icon: Icon, accent, bg } = getCategoryConfig(cat);
            const isActive = activeTab === cat;
            const catObj = cat !== 'Tout' ? categoryMap[cat] : null;
            const hasImage = !!catObj?.image_url;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
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
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-ink/20 text-ink hover:bg-ink/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 text-xs font-bold uppercase tracking-widest transition-colors ${
                    currentPage === page
                      ? 'bg-ink text-bg'
                      : 'border border-ink/20 text-ink hover:bg-ink/5'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-ink/20 text-ink hover:bg-ink/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        )}
      </main>

      {/* ── Newsletter Section ── */}
      <section className="bg-ink text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-accent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">Newsletter</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-light font-serif mb-4">
              Restez <span className="italic">informé</span>
            </h2>
            <p className="text-white/70 mb-8 max-w-2xl mx-auto">
              Inscrivez-vous à notre newsletter pour recevoir nos dernières nouveautés, offres exclusives et conseils style.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email"
                required
                className="flex-1 px-6 py-4 bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-accent text-white font-bold uppercase tracking-widest hover:bg-accent/90 transition-colors whitespace-nowrap"
              >
                S'inscrire
              </button>
            </form>
            <p className="text-xs text-white/50 mt-4">
              En vous inscrivant, vous acceptez de recevoir nos communications marketing.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Brand Values Section ── */}
      <section className="bg-bg py-20 border-t border-ink/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-light font-serif text-ink mb-4">
              Nos <span className="italic">Engagements</span>
            </h2>
            <p className="text-ink/60 max-w-2xl mx-auto">
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
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-ink/5 mb-6 group-hover:bg-ink/10 transition-colors">
                  <value.icon className="w-10 h-10 text-ink" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-widest mb-4">{value.title}</h3>
                <p className="text-ink/60 leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
