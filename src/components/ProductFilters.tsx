import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '../types';

export interface FilterOptions {
  priceRange: [number, number];
  categories: string[];
  inStockOnly: boolean;
  newOnly: boolean;
  onSaleOnly: boolean;
  minRating: number;
  effects: string[];
}

export type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'popular' | 'rating';

interface ProductFiltersProps {
  products: Product[];
  filters: FilterOptions;
  sortBy: SortOption;
  onFiltersChange: (filters: FilterOptions) => void;
  onSortChange: (sort: SortOption) => void;
  onReset: () => void;
  className?: string;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'newest', label: 'Nouveautés' },
  { value: 'popular', label: 'Meilleures ventes' },
  { value: 'rating', label: 'Meilleures notes' },
];

export default function ProductFilters({
  products,
  filters,
  sortBy,
  onFiltersChange,
  onSortChange,
  onReset,
  className = '',
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['price', 'categories', 'availability'])
  );

  // Calculer les valeurs min/max des prix
  const minPrice = Math.min(...products.map(p => p.price));
  const maxPrice = Math.max(...products.map(p => p.price));

  // Extraire toutes les catégories uniques
  const allCategories = Array.from(
    new Set(products.flatMap(p => p.categories || []))
  ).sort();

  // Extraire tous les effets uniques
  const allEffects = Array.from(
    new Set(products.flatMap(p => p.effects || []))
  ).sort();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    updateFilter('categories', newCategories);
  };

  const toggleEffect = (effect: string) => {
    const newEffects = filters.effects.includes(effect)
      ? filters.effects.filter(e => e !== effect)
      : [...filters.effects, effect];
    updateFilter('effects', newEffects);
  };

  const activeFiltersCount = 
    (filters.categories.length > 0 ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.newOnly ? 1 : 0) +
    (filters.onSaleOnly ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.effects.length > 0 ? 1 : 0) +
    (filters.priceRange[0] !== minPrice || filters.priceRange[1] !== maxPrice ? 1 : 0);

  return (
    <div className={className}>
      {/* Mobile: Button to open filters */}
      <div className="lg:hidden mb-4 flex gap-3">
        <button
          onClick={() => setIsOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-ink/20 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-ink/5 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-accent text-white rounded-full text-xs">
              {activeFiltersCount}
            </span>
          )}
        </button>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="px-4 py-3 bg-white border-2 border-ink/20 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-ink/5 transition-colors"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: Sort dropdown */}
      <div className="hidden lg:flex items-center justify-between mb-6">
        <p className="text-sm text-ink/60">
          {products.length} produit{products.length > 1 ? 's' : ''}
        </p>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="px-4 py-2 bg-white border border-ink/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-ink/5 transition-colors"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile: Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 lg:hidden overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-ink/10 p-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold uppercase tracking-widest">Filtres</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-ink/5 rounded-lg transition-colors"
                  aria-label="Fermer les filtres"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <FiltersContent
                  filters={filters}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  allCategories={allCategories}
                  allEffects={allEffects}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  updateFilter={updateFilter}
                  toggleCategory={toggleCategory}
                  toggleEffect={toggleEffect}
                />
              </div>

              <div className="sticky bottom-0 bg-white border-t border-ink/10 p-4 flex gap-3">
                <button
                  onClick={() => {
                    onReset();
                    setIsOpen(false);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-ink/20 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-ink/5 transition-colors"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 bg-ink text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-ink/90 transition-colors"
                >
                  Appliquer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop: Sidebar */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold uppercase tracking-widest">Filtres</h2>
          {activeFiltersCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs font-bold uppercase tracking-widest text-accent hover:underline"
            >
              Réinitialiser ({activeFiltersCount})
            </button>
          )}
        </div>

        <FiltersContent
          filters={filters}
          minPrice={minPrice}
          maxPrice={maxPrice}
          allCategories={allCategories}
          allEffects={allEffects}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          updateFilter={updateFilter}
          toggleCategory={toggleCategory}
          toggleEffect={toggleEffect}
        />
      </div>
    </div>
  );
}

// Composant interne pour le contenu des filtres (réutilisé mobile + desktop)
function FiltersContent({
  filters,
  minPrice,
  maxPrice,
  allCategories,
  allEffects,
  expandedSections,
  toggleSection,
  updateFilter,
  toggleCategory,
  toggleEffect,
}: {
  filters: FilterOptions;
  minPrice: number;
  maxPrice: number;
  allCategories: string[];
  allEffects: string[];
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
  updateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  toggleCategory: (category: string) => void;
  toggleEffect: (effect: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Prix */}
      <FilterSection
        title="Prix"
        isExpanded={expandedSections.has('price')}
        onToggle={() => toggleSection('price')}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>{filters.priceRange[0].toFixed(0)}€</span>
            <span>{filters.priceRange[1].toFixed(0)}€</span>
          </div>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            value={filters.priceRange[1]}
            onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], Number(e.target.value)])}
            className="w-full accent-accent"
          />
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '< 50€', max: 50 },
              { label: '50-100€', max: 100 },
              { label: '> 100€', max: maxPrice },
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => updateFilter('priceRange', [minPrice, preset.max])}
                className="px-3 py-2 text-xs font-bold uppercase tracking-wider border border-ink/20 rounded-lg hover:bg-ink/5 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Catégories */}
      <FilterSection
        title="Catégories"
        isExpanded={expandedSections.has('categories')}
        onToggle={() => toggleSection('categories')}
        count={filters.categories.length}
      >
        <div className="space-y-2">
          {allCategories.map(category => (
            <label key={category} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.categories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="w-4 h-4 accent-accent rounded"
              />
              <span className="text-sm text-ink/70 group-hover:text-ink transition-colors">
                {category}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Disponibilité */}
      <FilterSection
        title="Disponibilité"
        isExpanded={expandedSections.has('availability')}
        onToggle={() => toggleSection('availability')}
      >
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(e) => updateFilter('inStockOnly', e.target.checked)}
              className="w-4 h-4 accent-accent rounded"
            />
            <span className="text-sm text-ink/70 group-hover:text-ink transition-colors">
              En stock uniquement
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.newOnly}
              onChange={(e) => updateFilter('newOnly', e.target.checked)}
              className="w-4 h-4 accent-accent rounded"
            />
            <span className="text-sm text-ink/70 group-hover:text-ink transition-colors">
              Nouveautés
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.onSaleOnly}
              onChange={(e) => updateFilter('onSaleOnly', e.target.checked)}
              className="w-4 h-4 accent-accent rounded"
            />
            <span className="text-sm text-ink/70 group-hover:text-ink transition-colors">
              En promotion
            </span>
          </label>
        </div>
      </FilterSection>

      {/* Note minimum */}
      <FilterSection
        title="Note minimum"
        isExpanded={expandedSections.has('rating')}
        onToggle={() => toggleSection('rating')}
      >
        <div className="space-y-2">
          {[4, 3, 2, 1].map(rating => (
            <label key={rating} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === rating}
                onChange={() => updateFilter('minRating', rating)}
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm text-ink/70 group-hover:text-ink transition-colors">
                {rating}★ et plus
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Effets/Tags */}
      {allEffects.length > 0 && (
        <FilterSection
          title="Caractéristiques"
          isExpanded={expandedSections.has('effects')}
          onToggle={() => toggleSection('effects')}
          count={filters.effects.length}
        >
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allEffects.map(effect => (
              <label key={effect} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.effects.includes(effect)}
                  onChange={() => toggleEffect(effect)}
                  className="w-4 h-4 accent-accent rounded"
                />
                <span className="text-sm text-ink/70 group-hover:text-ink transition-colors">
                  {effect}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}
    </div>
  );
}

// Composant section de filtre avec accordéon
function FilterSection({
  title,
  isExpanded,
  onToggle,
  count,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-ink/10 pb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 text-sm font-bold uppercase tracking-widest hover:text-accent transition-colors"
      >
        <span className="flex items-center gap-2">
          {title}
          {count !== undefined && count > 0 && (
            <span className="px-2 py-0.5 bg-accent text-white rounded-full text-xs">
              {count}
            </span>
          )}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
