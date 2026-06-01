// src/components/AdvancedSearchModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Clock, TrendingUp, Tag, ArrowRight } from 'lucide-react';
import { useStore } from '../store';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { layers } from '../styles/tokens/layers';
import { OptimizedImage } from './OptimizedImage';
import { getProductPath } from '../lib/seo';

export interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdvancedSearchModal({ isOpen, onClose }: AdvancedSearchModalProps) {
  const { products, categories } = useStore();
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Charger l'historique depuis localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Focus input quand modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Sauvegarder recherche dans l'historique
  const saveToHistory = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const newHistory = [
      trimmed,
      ...searchHistory.filter((h) => h !== trimmed),
    ].slice(0, 5);

    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // Recherche fuzzy simple
  const searchResults = query.trim()
    ? products
        .filter((p) => {
          const searchLower = query.toLowerCase();
          return (
            p.name.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.effects.some((e) => e.toLowerCase().includes(searchLower)) ||
            p.categories?.some((c) => c.toLowerCase().includes(searchLower))
          );
        })
        .slice(0, 6)
    : [];

  // Catégories correspondantes
  const matchingCategories = query.trim()
    ? categories
        .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
    : [];

  // Suggestions populaires
  const popularSearches = ['Nouveau', 'Promo', 'Bestseller', 'Tendance'];

  // Navigation clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalResults = searchResults.length + matchingCategories.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalResults - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      if (selectedIndex < searchResults.length) {
        const product = searchResults[selectedIndex];
        handleProductClick(product.id);
      } else {
        const category = matchingCategories[selectedIndex - searchResults.length];
        handleCategoryClick(category.name);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleProductClick = (productId: string) => {
    saveToHistory(query);
    onClose();
    const product = products.find((p) => p.id === productId);
    if (product) {
      navigate(getProductPath(product));
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    saveToHistory(query);
    onClose();
    navigate(`/?category=${encodeURIComponent(categoryName)}`);
  };

  const handleSearch = () => {
    if (query.trim()) {
      saveToHistory(query);
      onClose();
      navigate(`/?search=${encodeURIComponent(query)}`);
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm"
            style={{ zIndex: layers.modal }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-3xl bg-bg rounded-2xl shadow-2xl overflow-hidden"
            style={{ zIndex: layers.modal + 1 }}
          >
            {/* Search Input */}
            <div className="relative border-b border-ink/10">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher des produits, catégories..."
                className="w-full pl-14 pr-14 py-5 text-lg bg-transparent border-none focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-1 hover:bg-ink/5 rounded-full transition-colors"
                  aria-label="Effacer"
                >
                  <X className="w-5 h-5 text-ink/40" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {query.trim() ? (
                <div className="p-4">
                  {/* Catégories */}
                  {matchingCategories.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-3 px-2">
                        Catégories
                      </h3>
                      <div className="space-y-1">
                        {matchingCategories.map((category, index) => (
                          <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category.name)}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left',
                              selectedIndex === searchResults.length + index
                                ? 'bg-accent/10'
                                : 'hover:bg-ink/5'
                            )}
                          >
                            <Tag className="w-4 h-4 text-accent flex-shrink-0" />
                            <span className="text-sm font-medium">{category.name}</span>
                            <ArrowRight className="w-4 h-4 ml-auto text-ink/40" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Produits */}
                  {searchResults.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-3 px-2">
                        Produits
                      </h3>
                      <div className="space-y-1">
                        {searchResults.map((product, index) => (
                          <button
                            key={product.id}
                            onClick={() => handleProductClick(product.id)}
                            className={cn(
                              'w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-left',
                              selectedIndex === index ? 'bg-accent/10' : 'hover:bg-ink/5'
                            )}
                          >
                            <div className="relative w-12 h-12 flex-shrink-0 bg-soft-green rounded-lg overflow-hidden">
                              <OptimizedImage
                                src={product.image}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate">{product.name}</h4>
                              <p className="text-xs text-ink/60 truncate">{product.description}</p>
                            </div>
                            <span className="text-sm font-semibold flex-shrink-0">
                              {product.price.toFixed(2)}€
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Aucun résultat */}
                  {searchResults.length === 0 && matchingCategories.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-ink/50 mb-4">Aucun résultat pour "{query}"</p>
                      <button
                        onClick={handleSearch}
                        className="text-sm text-accent hover:text-accent/80 font-medium"
                      >
                        Rechercher quand même →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  {/* Historique */}
                  {searchHistory.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3 px-2">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50">
                          Recherches récentes
                        </h3>
                        <button
                          onClick={clearHistory}
                          className="text-xs text-ink/50 hover:text-ink transition-colors"
                        >
                          Effacer
                        </button>
                      </div>
                      <div className="space-y-1">
                        {searchHistory.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => setQuery(search)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-ink/5 transition-colors text-left"
                          >
                            <Clock className="w-4 h-4 text-ink/40 flex-shrink-0" />
                            <span className="text-sm">{search}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recherches populaires */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-3 px-2">
                      Recherches populaires
                    </h3>
                    <div className="flex flex-wrap gap-2 px-2">
                      {popularSearches.map((search) => (
                        <button
                          key={search}
                          onClick={() => setQuery(search)}
                          className="px-4 py-2 text-sm border border-ink/20 rounded-full hover:bg-ink/5 transition-colors flex items-center gap-2"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="border-t border-ink/10 px-6 py-3 bg-ink/5">
              <p className="text-xs text-ink/50 text-center">
                <kbd className="px-2 py-1 bg-bg rounded text-[10px] font-mono">↑</kbd>
                <kbd className="px-2 py-1 bg-bg rounded text-[10px] font-mono ml-1">↓</kbd>
                {' '}pour naviguer •{' '}
                <kbd className="px-2 py-1 bg-bg rounded text-[10px] font-mono">Enter</kbd>
                {' '}pour sélectionner •{' '}
                <kbd className="px-2 py-1 bg-bg rounded text-[10px] font-mono">Esc</kbd>
                {' '}pour fermer
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
