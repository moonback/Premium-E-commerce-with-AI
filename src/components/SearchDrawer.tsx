// src/components/SearchDrawer.tsx
// Full-screen search drawer — P1.6
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { getProductPath } from '../lib/seo';
import { cn } from '../lib/utils';

interface SearchDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchDrawer({ open, onClose }: SearchDrawerProps) {
  const { products, searchQuery, setSearchQuery } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const query = searchQuery.trim().toLowerCase();
  const results = query.length >= 1
    ? products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.effects.some(e => e.toLowerCase().includes(query)) ||
        (p.categories || []).some(c => c.toLowerCase().includes(query))
      ).slice(0, 8)
    : [];

  const quickSuggestions = ['Accessoires', 'Vêtements', 'Maison', 'Nouveautés'];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label="Recherche"
            className="fixed inset-x-0 top-0 z-50 bg-bg shadow-2xl"
          >
            {/* Search input row */}
            <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-4 sm:px-6">
              <Search className="h-5 w-5 shrink-0 text-ink/40" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit, une catégorie…"
                className="flex-1 bg-transparent text-base text-ink placeholder:text-ink/30 outline-none"
                aria-label="Recherche"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Effacer la recherche"
                  className="rounded-full p-1 text-ink/40 hover:text-ink transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Fermer la recherche"
                className="ml-1 rounded-full p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Results / suggestions */}
            <div className="max-h-[70dvh] overflow-y-auto px-4 py-4 sm:px-6">
              {query.length === 0 && (
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-ink/40">
                    Suggestions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickSuggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => setSearchQuery(s)}
                        className="rounded-full border border-ink/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink/70 transition-colors hover:border-ink hover:text-ink"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {query.length > 0 && results.length === 0 && (
                <p className="py-8 text-center text-sm italic text-ink/40">
                  Aucun résultat pour « {searchQuery} »
                </p>
              )}

              {results.length > 0 && (
                <ul className="space-y-1" role="listbox" aria-label="Résultats de recherche">
                  {results.map(product => (
                    <li key={product.id} role="option" aria-selected="false">
                      <Link
                        to={getProductPath(product)}
                        onClick={() => { setSearchQuery(''); onClose(); }}
                        className={cn(
                          'flex items-center gap-4 rounded-xl p-3 transition-colors',
                          'hover:bg-soft-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink'
                        )}
                      >
                        <img
                          src={product.image}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-serif text-sm text-ink">{product.name}</p>
                          <p className="text-xs text-ink/50">
                            {(product.categories || []).join(', ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-ink">
                            {product.price.toFixed(2)}€
                          </span>
                          <ArrowRight className="h-4 w-4 text-ink/30" aria-hidden="true" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
