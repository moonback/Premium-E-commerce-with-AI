import React, { useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../store';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { getProductPath } from '../lib/seo';

interface AdvancedSearchProps {
  onClose?: () => void;
}

export default function AdvancedSearch({ onClose }: AdvancedSearchProps) {
  const { products, categories } = useStore();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'name'>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const filteredProducts = useMemo(() => {
    let results = products.filter(p => {
      // Text search
      const matchesQuery = query === '' || 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        p.effects.some(e => e.toLowerCase().includes(query.toLowerCase()));

      // Category filter
      const matchesCategory = selectedCategory === '' || 
        p.categories?.includes(selectedCategory);

      // Price filter
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];

      return matchesQuery && matchesCategory && matchesPrice;
    });

    // Sort results
    switch (sortBy) {
      case 'price-asc':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'relevance':
      default:
        // Keep original order or implement relevance scoring
        break;
    }

    return results;
  }, [products, query, selectedCategory, priceRange, sortBy]);

  const handleReset = () => {
    setQuery('');
    setSelectedCategory('');
    setPriceRange([0, 200]);
    setSortBy('relevance');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-6 border-b border-ink/10">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher des produits..."
              autoFocus
              className="w-full pl-12 pr-4 py-4 border border-ink/20 bg-transparent text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink rounded-2xl"
            />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-3 hover:bg-ink/5 rounded-full transition-colors"
              aria-label="Fermer la recherche"
            >
              <X className="w-5 h-5 text-ink" />
            </button>
          )}
        </div>

        {/* Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink/60 hover:text-ink transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-6 border-b border-ink/10 bg-soft-green/20 space-y-6">
          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink/60 mb-3">
              Catégorie
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-colors ${
                  selectedCategory === ''
                    ? 'bg-ink text-bg'
                    : 'border border-ink/20 text-ink hover:bg-ink/5'
                }`}
              >
                Toutes
              </button>
              {categories.filter(c => c.level === 1).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-ink text-bg'
                      : 'border border-ink/20 text-ink hover:bg-ink/5'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink/60 mb-3">
              Prix: {priceRange[0]}€ - {priceRange[1]}€
            </label>
            <div className="flex gap-4">
              <input
                type="range"
                min="0"
                max="200"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="200"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="flex-1"
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink/60 mb-3">
              Trier par
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-3 border border-ink/20 bg-transparent text-ink text-sm focus:outline-none focus:border-ink rounded-lg"
            >
              <option value="relevance">Pertinence</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="name">Nom A-Z</option>
            </select>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3 text-xs font-bold uppercase tracking-widest border border-ink/20 text-ink hover:bg-ink/5 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-ink/60">
            {filteredProducts.length} résultat{filteredProducts.length > 1 ? 's' : ''}
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-ink/20 mx-auto mb-4" />
            <p className="text-sm uppercase tracking-widest font-bold text-ink/40 mb-2">
              Aucun résultat
            </p>
            <p className="text-xs text-ink/60">
              Essayez d'ajuster vos filtres ou votre recherche
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <Link
                key={product.id}
                to={getProductPath(product)}
                onClick={onClose}
                className="group border border-ink/10 p-4 hover:border-ink/20 hover:shadow-lg transition-all"
              >
                <div className="aspect-square bg-soft-green mb-3 overflow-hidden rounded-lg relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    width="200"
                    height="200"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.stock === 0 && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded">
                      Rupture
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-base mb-1 text-ink group-hover:text-ink/70 transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-ink/60 mb-2 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{product.price.toFixed(2)}€</p>
                  {product.categories && product.categories.length > 0 && (
                    <span className="text-xs text-ink/40 uppercase tracking-wider">
                      {product.categories[0]}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
