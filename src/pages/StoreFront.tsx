import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { buildStorefrontSeo } from '../lib/seo';
import { useSeo } from '../lib/useSeo';
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
  const seoMetadata = useMemo(() => buildStorefrontSeo(), []);
  useSeo(seoMetadata);

  const { products, categories: storeCategories, searchQuery, isLoadingProducts } = useStore();
  const [activeTab, setActiveTab] = useState('Tout');

  const categories = ['Tout', ...storeCategories.filter(c => c.level === 1).map(c => c.name)];
  // Map category name → full Category object for image_url access
  const categoryMap = Object.fromEntries(storeCategories.filter(c => c.level === 1).map(c => [c.name, c]));

  const filteredProducts = products.filter(p =>
    (activeTab === 'Tout' || (p.categories || []).includes(activeTab)) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.effects.some(e => e.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="bg-bg flex-1">
      <SEO
        title="Collection premium e-commerce"
        description="Explorez la collection Véridian : produits premium, recommandations IA et expérience d'achat élégante."
        path="/"
        jsonLd={buildStoreJsonLd()}
      />
      <div className="relative w-full h-[60vh] md:h-[80vh] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04')" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 to-transparent opacity-70"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center pt-20"
        >
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/70 mb-6">Maison de Qualité</span>
          <h1 className="text-6xl md:text-8xl font-light font-serif text-white mb-6 leading-none">
            La Collection <br /><span className="italic">Essentielle</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl font-light mb-6">
            Découvrez notre sélection de produits intemporels. L'alliance parfaite entre esthétique et utilité.
          </p>
          <a href="#collection" className="px-6 py-3 bg-white text-ink font-bold uppercase tracking-widest hover:bg-white/90 transition-colors">
            Explorer la collection
          </a>
        </motion.div>
      </div>

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
            filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
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
      </main>
    </div>
  );
}
