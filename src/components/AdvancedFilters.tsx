// src/components/AdvancedFilters.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, X, ChevronDown, Check } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  inStock: boolean;
  isNew: boolean;
  sortBy: 'name' | 'price-asc' | 'price-desc' | 'newest';
}

export interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  className?: string;
}

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  onReset,
  className,
}: AdvancedFiltersProps) {
  const { categories, products } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['categories', 'price']);

  const mainCategories = categories.filter((c) => c.level === 1);

  // Calculer le range de prix
  const prices = products.map((p) => p.price);
  const minPrice = Math.floor(Math.min(...prices));
  const maxPrice = Math.ceil(Math.max(...prices));

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const toggleCategory = (categoryName: string) => {
    const newCategories = filters.categories.includes(categoryName)
      ? filters.categories.filter((c) => c !== categoryName)
      : [...filters.categories, categoryName];

    onFiltersChange({ ...filters, categories: newCategories });
  };

  const updatePriceRange = (index: 0 | 1, value: number) => {
    const newRange: [number, number] = [...filters.priceRange];
    newRange[index] = value;
    onFiltersChange({ ...filters, priceRange: newRange });
  };

  const activeFiltersCount =
    filters.categories.length +
    (filters.inStock ? 1 : 0) +
    (filters.isNew ? 1 : 0) +
    (filters.priceRange[0] !== minPrice || filters.priceRange[1] !== maxPrice ? 1 : 0);

  return (
    <div className={cn('relative', className)}>
      {/* Filter Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        leftIcon={<Filter className="w-4 h-4" />}
        className="relative"
      >
        Filtres
        {activeFiltersCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-bg rounded-full text-[10px] flex items-center justify-center font-bold">
            {activeFiltersCount}
          </span>
        )}
      </Button>

      {/* Filters Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop (mobile) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-ink/50 backdrop-blur-sm lg:hidden z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed lg:absolute top-0 lg:top-full left-0 lg:left-auto lg:right-0 lg:mt-2 w-80 h-full lg:h-auto bg-bg border border-ink/10 rounded-none lg:rounded-2xl shadow-2xl overflow-hidden z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-ink/10">
                <h3 className="text-sm font-bold uppercase tracking-widest">Filtres</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-ink/5 rounded-lg transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filters Content */}
              <div className="overflow-y-auto max-h-[calc(100vh-140px)] lg:max-h-96">
                {/* Categories */}
                <div className="border-b border-ink/10">
                  <button
                    onClick={() => toggleSection('categories')}
                    className="w-full flex items-center justify-between p-4 hover:bg-ink/5 transition-colors"
                  >
                    <span className="text-sm font-bold uppercase tracking-wider">Catégories</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform',
                        expandedSections.includes('categories') && 'rotate-180'
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedSections.includes('categories') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-2">
                          {mainCategories.map((category) => (
                            <label
                              key={category.id}
                              className="flex items-center gap-3 p-2 hover:bg-ink/5 rounded-lg cursor-pointer transition-colors"
                            >
                              <div
                                className={cn(
                                  'w-5 h-5 border-2 rounded flex items-center justify-center transition-colors',
                                  filters.categories.includes(category.name)
                                    ? 'bg-ink border-ink'
                                    : 'border-ink/30'
                                )}
                              >
                                {filters.categories.includes(category.name) && (
                                  <Check className="w-3 h-3 text-bg" />
                                )}
                              </div>
                              <input
                                type="checkbox"
                                checked={filters.categories.includes(category.name)}
                                onChange={() => toggleCategory(category.name)}
                                className="sr-only"
                              />
                              <span className="text-sm">{category.name}</span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Price Range */}
                <div className="border-b border-ink/10">
                  <button
                    onClick={() => toggleSection('price')}
                    className="w-full flex items-center justify-between p-4 hover:bg-ink/5 transition-colors"
                  >
                    <span className="text-sm font-bold uppercase tracking-wider">Prix</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform',
                        expandedSections.includes('price') && 'rotate-180'
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedSections.includes('price') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label className="text-xs text-ink/60 mb-1 block">Min</label>
                              <input
                                type="number"
                                value={filters.priceRange[0]}
                                onChange={(e) => updatePriceRange(0, Number(e.target.value))}
                                min={minPrice}
                                max={filters.priceRange[1]}
                                className="w-full px-3 py-2 border border-ink/20 rounded-lg text-sm"
                              />
                            </div>
                            <span className="text-ink/40 mt-5">—</span>
                            <div className="flex-1">
                              <label className="text-xs text-ink/60 mb-1 block">Max</label>
                              <input
                                type="number"
                                value={filters.priceRange[1]}
                                onChange={(e) => updatePriceRange(1, Number(e.target.value))}
                                min={filters.priceRange[0]}
                                max={maxPrice}
                                className="w-full px-3 py-2 border border-ink/20 rounded-lg text-sm"
                              />
                            </div>
                          </div>

                          {/* Range Slider */}
                          <div className="relative pt-2">
                            <input
                              type="range"
                              min={minPrice}
                              max={maxPrice}
                              value={filters.priceRange[0]}
                              onChange={(e) => updatePriceRange(0, Number(e.target.value))}
                              className="absolute w-full h-2 bg-ink/10 rounded-lg appearance-none cursor-pointer"
                              style={{ zIndex: filters.priceRange[0] > maxPrice - 100 ? 5 : 3 }}
                            />
                            <input
                              type="range"
                              min={minPrice}
                              max={maxPrice}
                              value={filters.priceRange[1]}
                              onChange={(e) => updatePriceRange(1, Number(e.target.value))}
                              className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer"
                              style={{ zIndex: 4 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Options */}
                <div className="p-4 space-y-3">
                  <label className="flex items-center gap-3 p-2 hover:bg-ink/5 rounded-lg cursor-pointer transition-colors">
                    <div
                      className={cn(
                        'w-5 h-5 border-2 rounded flex items-center justify-center transition-colors',
                        filters.inStock ? 'bg-ink border-ink' : 'border-ink/30'
                      )}
                    >
                      {filters.inStock && <Check className="w-3 h-3 text-bg" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(e) =>
                        onFiltersChange({ ...filters, inStock: e.target.checked })
                      }
                      className="sr-only"
                    />
                    <span className="text-sm">En stock uniquement</span>
                  </label>

                  <label className="flex items-center gap-3 p-2 hover:bg-ink/5 rounded-lg cursor-pointer transition-colors">
                    <div
                      className={cn(
                        'w-5 h-5 border-2 rounded flex items-center justify-center transition-colors',
                        filters.isNew ? 'bg-ink border-ink' : 'border-ink/30'
                      )}
                    >
                      {filters.isNew && <Check className="w-3 h-3 text-bg" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={filters.isNew}
                      onChange={(e) =>
                        onFiltersChange({ ...filters, isNew: e.target.checked })
                      }
                      className="sr-only"
                    />
                    <span className="text-sm">Nouveautés uniquement</span>
                  </label>
                </div>

                {/* Sort */}
                <div className="border-t border-ink/10 p-4">
                  <label className="text-sm font-bold uppercase tracking-wider mb-3 block">
                    Trier par
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        sortBy: e.target.value as FilterState['sortBy'],
                      })
                    }
                    className="w-full px-3 py-2 border border-ink/20 rounded-lg text-sm bg-bg"
                  >
                    <option value="name">Nom (A-Z)</option>
                    <option value="price-asc">Prix croissant</option>
                    <option value="price-desc">Prix décroissant</option>
                    <option value="newest">Plus récents</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-ink/10 p-4 flex gap-3">
                <Button variant="ghost" onClick={onReset} fullWidth>
                  Réinitialiser
                </Button>
                <Button onClick={() => setIsOpen(false)} fullWidth>
                  Appliquer
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
