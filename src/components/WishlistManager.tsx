// src/components/WishlistManager.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Plus, Trash2, Edit2, Check, X, Share2, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { Button } from './ui/Button';
import { OptimizedImage } from './OptimizedImage';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import toast from 'react-hot-toast';

interface Wishlist {
  id: string;
  name: string;
  description?: string;
  productIds: string[];
  createdAt: number;
  isDefault?: boolean;
}

interface WishlistManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WISHLISTS_KEY = 'veridian-wishlists';

export default function WishlistManager({ isOpen, onClose }: WishlistManagerProps) {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [selectedWishlist, setSelectedWishlist] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const products = useStore(state => state.products);
  const addToCart = useStore(state => state.addToCart);

  // Charger les wishlists depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem(WISHLISTS_KEY);
    if (saved) {
      try {
        const loaded = JSON.parse(saved);
        setWishlists(loaded);
        if (loaded.length > 0) {
          setSelectedWishlist(loaded[0].id);
        }
      } catch (e) {
        console.error('Error loading wishlists:', e);
        // Créer une wishlist par défaut
        const defaultWishlist: Wishlist = {
          id: 'default',
          name: 'Ma wishlist',
          productIds: [],
          createdAt: Date.now(),
          isDefault: true,
        };
        setWishlists([defaultWishlist]);
        setSelectedWishlist('default');
      }
    } else {
      // Créer une wishlist par défaut
      const defaultWishlist: Wishlist = {
        id: 'default',
        name: 'Ma wishlist',
        productIds: [],
        createdAt: Date.now(),
        isDefault: true,
      };
      setWishlists([defaultWishlist]);
      setSelectedWishlist('default');
    }
  }, []);

  // Sauvegarder dans localStorage
  useEffect(() => {
    if (wishlists.length > 0) {
      localStorage.setItem(WISHLISTS_KEY, JSON.stringify(wishlists));
    }
  }, [wishlists]);

  const createWishlist = () => {
    if (!newName.trim()) return;

    const newWishlist: Wishlist = {
      id: `wishlist-${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      productIds: [],
      createdAt: Date.now(),
    };

    setWishlists(prev => [...prev, newWishlist]);
    setSelectedWishlist(newWishlist.id);
    setIsCreating(false);
    setNewName('');
    setNewDescription('');
  };

  const updateWishlist = (id: string, updates: Partial<Wishlist>) => {
    setWishlists(prev =>
      prev.map(w => (w.id === id ? { ...w, ...updates } : w))
    );
    setEditingId(null);
  };

  const deleteWishlist = (id: string) => {
    const wishlist = wishlists.find(w => w.id === id);
    if (wishlist?.isDefault) {
      // Cannot delete default wishlist — ignore silently
      return;
    }
    setWishlists(prev => prev.filter(w => w.id !== id));
    if (selectedWishlist === id) {
      setSelectedWishlist(wishlists[0]?.id || null);
    }
  };

  const removeFromWishlist = (wishlistId: string, productId: string) => {
    setWishlists(prev =>
      prev.map(w =>
        w.id === wishlistId
          ? { ...w, productIds: w.productIds.filter(id => id !== productId) }
          : w
      )
    );
  };

  const addAllToCart = (wishlistId: string) => {
    const wishlist = wishlists.find(w => w.id === wishlistId);
    if (!wishlist) return;

    const wishlistProducts = products.filter(p => wishlist.productIds.includes(p.id));
    wishlistProducts.forEach(product => addToCart(product));
  };

  const shareWishlist = async (wishlistId: string) => {
    const wishlist = wishlists.find(w => w.id === wishlistId);
    if (!wishlist) return;

    const url = `${window.location.origin}/?wishlist=${wishlist.productIds.join(',')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${wishlist.name} - Véridian`,
          text: `Découvrez ma sélection de ${wishlist.productIds.length} produits`,
          url,
        });
      } catch (e) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Lien copié dans le presse-papier !');
    }
  };

  const currentWishlist = wishlists.find(w => w.id === selectedWishlist);
  const wishlistProducts = currentWishlist
    ? products.filter(p => currentWishlist.productIds.includes(p.id))
    : [];

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
          className="bg-bg rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sidebar - Wishlists */}
          <div className="w-64 border-r border-ink/10 flex flex-col">
            <div className="p-4 border-b border-ink/10">
              <h3 className="font-serif text-lg mb-3">Mes wishlists</h3>
              <Button
                size="sm"
                fullWidth
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreating(true)}
              >
                Nouvelle liste
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {wishlists.map((wishlist) => (
                <button
                  key={wishlist.id}
                  onClick={() => setSelectedWishlist(wishlist.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg mb-1 transition-colors',
                    selectedWishlist === wishlist.id
                      ? 'bg-accent/10 text-accent'
                      : 'hover:bg-ink/5'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Heart
                          className={cn(
                            'w-4 h-4 flex-shrink-0',
                            selectedWishlist === wishlist.id && 'fill-current'
                          )}
                        />
                        <span className="font-medium truncate">{wishlist.name}</span>
                      </div>
                      <p className="text-xs text-ink/60">
                        {wishlist.productIds.length} produit{wishlist.productIds.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-ink/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {editingId === currentWishlist?.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Nom de la wishlist"
                        className="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Description (optionnel)"
                        className="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            updateWishlist(currentWishlist.id, {
                              name: newName || currentWishlist.name,
                              description: newDescription || undefined,
                            });
                            setNewName('');
                            setNewDescription('');
                          }}
                          leftIcon={<Check className="w-4 h-4" />}
                        >
                          Enregistrer
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setNewName('');
                            setNewDescription('');
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="font-serif text-2xl mb-1">{currentWishlist?.name}</h2>
                      {currentWishlist?.description && (
                        <p className="text-sm text-ink/60">{currentWishlist.description}</p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {currentWishlist && !currentWishlist.isDefault && editingId !== currentWishlist.id && (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(currentWishlist.id);
                          setNewName(currentWishlist.name);
                          setNewDescription(currentWishlist.description || '');
                        }}
                        className="p-2 hover:bg-ink/5 rounded-lg transition-colors"
                        aria-label="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteWishlist(currentWishlist.id)}
                        className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {currentWishlist && wishlistProducts.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => shareWishlist(currentWishlist.id)}
                        leftIcon={<Share2 className="w-4 h-4" />}
                      >
                        Partager
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => addAllToCart(currentWishlist.id)}
                        leftIcon={<ShoppingCart className="w-4 h-4" />}
                      >
                        Tout ajouter
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
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {wishlistProducts.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-ink/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-ink/30" />
                    </div>
                    <h3 className="font-serif text-xl mb-2">Wishlist vide</h3>
                    <p className="text-ink/60 mb-6">
                      Ajoutez des produits à cette wishlist depuis les fiches produits
                    </p>
                    <Button onClick={onClose}>
                      Parcourir les produits
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white border border-ink/10 rounded-xl overflow-hidden group"
                    >
                      <div className="relative">
                        <OptimizedImage
                          src={product.image}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                        <button
                          onClick={() => removeFromWishlist(currentWishlist!.id, product.id)}
                          className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Retirer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-serif text-lg mb-1 truncate">{product.name}</h3>
                        <p className="text-xl font-bold mb-3">{product.price.toFixed(2)} €</p>
                        <Button
                          size="sm"
                          fullWidth
                          onClick={() => addToCart(product)}
                          disabled={product.stock === 0}
                        >
                          {product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Create Wishlist Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setIsCreating(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-serif text-xl mb-4">Nouvelle wishlist</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Cadeaux d'anniversaire"
                    className="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Ex: Idées pour l'anniversaire de Marie"
                    rows={3}
                    className="w-full px-3 py-2 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    fullWidth
                    onClick={createWishlist}
                    disabled={!newName.trim()}
                  >
                    Créer
                  </Button>
                  <Button
                    fullWidth
                    variant="ghost"
                    onClick={() => {
                      setIsCreating(false);
                      setNewName('');
                      setNewDescription('');
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

// Hook pour gérer les wishlists
export function useWishlist() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(WISHLISTS_KEY);
    if (saved) {
      try {
        setWishlists(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading wishlists:', e);
      }
    }
  }, []);

  const addToWishlist = (productId: string, wishlistId?: string) => {
    setWishlists(prev => {
      const targetId = wishlistId || prev.find(w => w.isDefault)?.id || prev[0]?.id;
      if (!targetId) return prev;

      const updated = prev.map(w =>
        w.id === targetId && !w.productIds.includes(productId)
          ? { ...w, productIds: [...w.productIds, productId] }
          : w
      );

      localStorage.setItem(WISHLISTS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromWishlist = (productId: string, wishlistId?: string) => {
    setWishlists(prev => {
      const updated = prev.map(w =>
        !wishlistId || w.id === wishlistId
          ? { ...w, productIds: w.productIds.filter(id => id !== productId) }
          : w
      );

      localStorage.setItem(WISHLISTS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isInWishlist = (productId: string, wishlistId?: string) => {
    if (wishlistId) {
      return wishlists.find(w => w.id === wishlistId)?.productIds.includes(productId) || false;
    }
    return wishlists.some(w => w.productIds.includes(productId));
  };

  return {
    wishlists,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  };
}
