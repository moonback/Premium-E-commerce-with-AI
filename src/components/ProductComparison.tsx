// src/components/ProductComparison.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Share2, Check, Minus } from 'lucide-react';
import { Product } from '../types';
import { Button } from './ui/Button';
import OptimizedImage from './OptimizedImage';
import { cn } from '../lib/utils';
import { useStore } from '../store';

interface ProductComparisonProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMPARISON_KEY = 'veridian-comparison';
const MAX_PRODUCTS = 4;

export default function ProductComparison({ isOpen, onClose }: ProductComparisonProps) {
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const products = useStore(state => state.products);
  const addToCart = useStore(state => state.addToCart);

  // Charger les produits en comparaison depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem(COMPARISON_KEY);
    if (saved) {
      try {
        setComparisonIds(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading comparison:', e);
      }
    }
  }, []);

  // Sauvegarder dans localStorage
  useEffect(() => {
    localStorage.setItem(COMPARISON_KEY, JSON.stringify(comparisonIds));
  }, [comparisonIds]);

  const comparisonProducts = products.filter(p => comparisonIds.includes(p.id));

  const removeProduct = (id: string) => {
    setComparisonIds(prev => prev.filter(pid => pid !== id));
  };

  const clearAll = () => {
    setComparisonIds([]);
  };

  const shareComparison = async () => {
    const url = `${window.location.origin}/?compare=${comparisonIds.join(',')}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Comparaison de produits - Véridian',
          text: `Comparez ${comparisonProducts.length} produits`,
          url,
        });
      } catch (e) {
        // User cancelled or error
      }
    } else {
      // Fallback: copier dans le presse-papier
      await navigator.clipboard.writeText(url);
      alert('Lien copié dans le presse-papier !');
    }
  };

  // Extraire tous les attributs uniques
  const allAttributes = new Set<string>();
  comparisonProducts.forEach(product => {
    if (product.effects) {
      product.effects.forEach(effect => allAttributes.add(effect));
    }
  });

  const attributes = Array.from(allAttributes);

  // Trouver les différences
  const getDifference = (attribute: string) => {
    const values = comparisonProducts.map(p => 
      p.effects?.includes(attribute) ? 'Oui' : 'Non'
    );
    return new Set(values).size > 1; // true si différent
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-bg rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-bg border-b border-ink/10 p-6 flex items-center justify-between z-10">
            <div>
              <h2 className="font-serif text-2xl mb-1">Comparaison de produits</h2>
              <p className="text-sm text-ink/60">
                {comparisonProducts.length} produit{comparisonProducts.length > 1 ? 's' : ''} sélectionné{comparisonProducts.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {comparisonProducts.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={shareComparison}
                    leftIcon={<Share2 className="w-4 h-4" />}
                  >
                    Partager
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                  >
                    Tout effacer
                  </Button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-ink/5 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-auto max-h-[calc(90vh-100px)]">
            {comparisonProducts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-ink/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-ink/30" />
                </div>
                <h3 className="font-serif text-xl mb-2">Aucun produit à comparer</h3>
                <p className="text-ink/60 mb-6">
                  Ajoutez des produits à la comparaison depuis les fiches produits
                </p>
                <Button onClick={onClose}>
                  Parcourir les produits
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ink/10">
                      <th className="sticky left-0 bg-bg p-4 text-left font-medium text-sm uppercase tracking-wider text-ink/60">
                        Attribut
                      </th>
                      {comparisonProducts.map((product) => (
                        <th key={product.id} className="p-4 min-w-[250px]">
                          <div className="relative">
                            <button
                              onClick={() => removeProduct(product.id)}
                              className="absolute -top-2 -right-2 p-1 bg-bg border border-ink/10 rounded-full hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors z-10"
                              aria-label="Retirer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <OptimizedImage
                              src={product.image}
                              alt={product.name}
                              className="w-full h-48 object-cover rounded-lg mb-3"
                            />
                            <h3 className="font-serif text-lg mb-1">{product.name}</h3>
                            <p className="text-2xl font-bold mb-3">{product.price.toFixed(2)} €</p>
                            <Button
                              size="sm"
                              fullWidth
                              onClick={() => {
                                addToCart(product);
                                // Toast notification handled by store
                              }}
                            >
                              Ajouter au panier
                            </Button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Prix */}
                    <tr className="border-b border-ink/10 hover:bg-ink/[0.02]">
                      <td className="sticky left-0 bg-bg p-4 font-medium">Prix</td>
                      {comparisonProducts.map((product) => (
                        <td key={product.id} className="p-4 text-center">
                          <span className="text-2xl font-bold">{product.price.toFixed(2)} €</span>
                        </td>
                      ))}
                    </tr>

                    {/* Catégorie */}
                    <tr className="border-b border-ink/10 hover:bg-ink/[0.02]">
                      <td className="sticky left-0 bg-bg p-4 font-medium">Catégorie</td>
                      {comparisonProducts.map((product) => (
                        <td key={product.id} className="p-4 text-center">
                          {product.category}
                        </td>
                      ))}
                    </tr>

                    {/* Stock */}
                    <tr className="border-b border-ink/10 hover:bg-ink/[0.02]">
                      <td className="sticky left-0 bg-bg p-4 font-medium">Disponibilité</td>
                      {comparisonProducts.map((product) => (
                        <td key={product.id} className="p-4 text-center">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
                            product.stock > 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          )}>
                            {product.stock > 0 ? (
                              <>
                                <Check className="w-3 h-3" />
                                En stock ({product.stock})
                              </>
                            ) : (
                              <>
                                <Minus className="w-3 h-3" />
                                Rupture
                              </>
                            )}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Description */}
                    <tr className="border-b border-ink/10 hover:bg-ink/[0.02]">
                      <td className="sticky left-0 bg-bg p-4 font-medium">Description</td>
                      {comparisonProducts.map((product) => (
                        <td key={product.id} className="p-4 text-sm text-ink/70">
                          {product.description}
                        </td>
                      ))}
                    </tr>

                    {/* Attributs/Effets */}
                    {attributes.map((attribute) => {
                      const isDifferent = getDifference(attribute);
                      return (
                        <tr
                          key={attribute}
                          className={cn(
                            'border-b border-ink/10 hover:bg-ink/[0.02]',
                            isDifferent && 'bg-amber-50/30'
                          )}
                        >
                          <td className="sticky left-0 bg-bg p-4 font-medium">
                            {attribute}
                            {isDifferent && (
                              <span className="ml-2 text-xs text-amber-600">
                                ⚠ Différent
                              </span>
                            )}
                          </td>
                          {comparisonProducts.map((product) => (
                            <td key={product.id} className="p-4 text-center">
                              {product.effects?.includes(attribute) ? (
                                <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                              ) : (
                                <Minus className="w-5 h-5 text-ink/20 mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook pour gérer la comparaison
export function useProductComparison() {
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(COMPARISON_KEY);
    if (saved) {
      try {
        setComparisonIds(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading comparison:', e);
      }
    }
  }, []);

  const addToComparison = (productId: string) => {
    setComparisonIds(prev => {
      if (prev.includes(productId)) return prev;
      if (prev.length >= MAX_PRODUCTS) {
        alert(`Vous pouvez comparer jusqu'à ${MAX_PRODUCTS} produits`);
        return prev;
      }
      const updated = [...prev, productId];
      localStorage.setItem(COMPARISON_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromComparison = (productId: string) => {
    setComparisonIds(prev => {
      const updated = prev.filter(id => id !== productId);
      localStorage.setItem(COMPARISON_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isInComparison = (productId: string) => {
    return comparisonIds.includes(productId);
  };

  const clearComparison = () => {
    setComparisonIds([]);
    localStorage.removeItem(COMPARISON_KEY);
  };

  return {
    comparisonIds,
    comparisonCount: comparisonIds.length,
    addToComparison,
    removeFromComparison,
    isInComparison,
    clearComparison,
  };
}
