// src/components/MegaMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronDown, TrendingUp, Sparkles, Tag } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { layers } from '../styles/tokens/layers';
import { OptimizedImage } from './OptimizedImage';

export interface MegaMenuProps {
  className?: string;
}

export default function MegaMenu({ className }: MegaMenuProps) {
  const { categories, products } = useStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Catégories de niveau 1 uniquement
  const mainCategories = categories.filter((c) => c.level === 1);

  const handleMouseEnter = (categoryName: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveCategory(categoryName);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setActiveCategory(null);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Obtenir les sous-catégories et produits vedettes
  const getMenuContent = (categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName && c.level === 1);
    if (!category) return null;

    const subCategories = categories.filter((c) => c.parent_id === category.id);
    const categoryProducts = products
      .filter((p) => p.categories?.includes(categoryName))
      .slice(0, 3);

    return { category, subCategories, categoryProducts };
  };

  const content = activeCategory ? getMenuContent(activeCategory) : null;

  return (
    <nav className={cn('relative', className)} onMouseLeave={handleMouseLeave}>
      {/* Navigation principale */}
      <ul className="flex items-center gap-1">
        {mainCategories.map((category) => (
          <li key={category.id}>
            <button
              onMouseEnter={() => handleMouseEnter(category.name)}
              className={cn(
                'flex items-center gap-1 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors rounded-lg',
                activeCategory === category.name
                  ? 'text-ink bg-ink/5'
                  : 'text-ink/70 hover:text-ink hover:bg-ink/5'
              )}
            >
              {category.name}
              <ChevronDown
                className={cn(
                  'w-3 h-3 transition-transform',
                  activeCategory === category.name && 'rotate-180'
                )}
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Mega Menu Dropdown */}
      <AnimatePresence>
        {isOpen && content && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            className="absolute left-0 right-0 top-full mt-2 bg-bg border border-ink/10 rounded-2xl shadow-2xl overflow-hidden"
            style={{ zIndex: layers.dropdown }}
            onMouseEnter={() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
            }}
          >
            <div className="grid grid-cols-12 gap-8 p-8 max-w-7xl mx-auto">
              {/* Sous-catégories */}
              <div className="col-span-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-4">
                  Catégories
                </h3>
                <ul className="space-y-2">
                  {content.subCategories.length > 0 ? (
                    content.subCategories.map((subCat) => (
                      <li key={subCat.id}>
                        <Link
                          to={`/?category=${encodeURIComponent(subCat.name)}`}
                          className="block px-3 py-2 text-sm hover:bg-ink/5 rounded-lg transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          {subCat.name}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-ink/50 italic px-3 py-2">
                      Aucune sous-catégorie
                    </li>
                  )}
                </ul>

                {/* Lien "Voir tout" */}
                <Link
                  to={`/?category=${encodeURIComponent(activeCategory)}`}
                  className="inline-flex items-center gap-2 mt-6 px-4 py-2 text-xs font-bold uppercase tracking-widest text-accent hover:text-accent/80 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Voir tout {activeCategory}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              {/* Produits vedettes */}
              <div className="col-span-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-4">
                  Produits vedettes
                </h3>
                <div className="space-y-4">
                  {content.categoryProducts.length > 0 ? (
                    content.categoryProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="flex gap-4 p-3 hover:bg-ink/5 rounded-lg transition-colors group"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="relative w-20 h-20 flex-shrink-0 bg-soft-green rounded-lg overflow-hidden">
                          <OptimizedImage
                            src={product.image}
                            alt={product.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif text-sm mb-1 truncate group-hover:text-accent transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-xs text-ink/60 line-clamp-2 mb-1">
                            {product.description}
                          </p>
                          <p className="text-sm font-semibold">{product.price.toFixed(2)}€</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-ink/50 italic">Aucun produit disponible</p>
                  )}
                </div>
              </div>

              {/* Promotions / Highlights */}
              <div className="col-span-3 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-accent">
                    Nouveautés
                  </h3>
                </div>
                <p className="text-sm text-ink/70 mb-4">
                  Découvrez les derniers produits de la collection {activeCategory}.
                </p>
                <Link
                  to={`/?category=${encodeURIComponent(activeCategory)}&filter=new`}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink hover:text-accent transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Découvrir
                  <span aria-hidden="true">→</span>
                </Link>

                <div className="mt-6 pt-6 border-t border-ink/10">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                      Tendances
                    </h4>
                  </div>
                  <p className="text-sm text-ink/70 mb-3">
                    Les produits les plus populaires du moment.
                  </p>
                  <Link
                    to={`/?category=${encodeURIComponent(activeCategory)}&sort=popular`}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink hover:text-emerald-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Voir les tendances
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-ink/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-red-600" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-red-600">
                      Promotions
                    </h4>
                  </div>
                  <p className="text-sm text-ink/70 mb-3">
                    Profitez des offres spéciales.
                  </p>
                  <Link
                    to={`/?category=${encodeURIComponent(activeCategory)}&filter=promo`}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink hover:text-red-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Voir les promos
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
