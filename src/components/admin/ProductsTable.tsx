import React, { useState } from 'react';
import { Edit2, Trash2, Cpu, Loader2, CheckCircle, Clock } from 'lucide-react';
import { Product } from '../../types';
import VectorizationPanel from './VectorizationPanel';
import CsvImportExport from './CsvImportExport';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

// ── Badge statut vectorisation ────────────────────────────────────────────────
function VectorBadge({ date }: { date?: string | null }) {
  if (!date) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-ink/5 text-ink/30">
        <Clock className="w-3 h-3" />
        Non vectorisé
      </span>
    );
  }

  const ago = formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 cursor-default"
      title={`Vectorisé le ${new Date(date).toLocaleString('fr-FR')}`}
    >
      <CheckCircle className="w-3 h-3" />
      IA {ago}
    </span>
  );
}

export default function ProductsTable({ products, onEdit, onDelete }: ProductsTableProps) {
  const [vectorizingId, setVectorizingId] = useState<string | null>(null);
  // Suivi local des timestamps après vectorisation individuelle
  const [localEmbeddingDates, setLocalEmbeddingDates] = useState<Record<string, string>>({});

  const handleVectorizeOne = async (productId: string) => {
    if (!supabase) return;
    setVectorizingId(productId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { toast.error('Session expirée'); return; }

      const res = await fetch(`/api/products/${productId}/vectorize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);

      // Mise à jour locale immédiate du badge sans recharger toute la liste
      setLocalEmbeddingDates(prev => ({ ...prev, [productId]: new Date().toISOString() }));
      toast.success('Produit vectorisé ✓');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur vectorisation');
    } finally {
      setVectorizingId(null);
    }
  };

  const getBadgeConfig = (badge: string) => {
    const configs: Record<string, { label: string; color: string; icon: string }> = {
      featured:   { label: 'Vedette',  color: 'bg-yellow-100 text-yellow-800', icon: '⭐' },
      bestseller: { label: 'Best',     color: 'bg-purple-100 text-purple-800', icon: '🏆' },
      top_sales:  { label: 'Top',      color: 'bg-green-100 text-green-800',   icon: '📈' },
      new:        { label: 'Nouveau',  color: 'bg-blue-100 text-blue-800',     icon: '✨' },
      limited:    { label: 'Limité',   color: 'bg-red-100 text-red-800',       icon: '⏰' },
    };
    return configs[badge] || { label: badge, color: 'bg-gray-100 text-gray-800', icon: '🏷️' };
  };

  const isPromotionActive = (product: Product) => {
    if (!product.promotion) return false;
    const now = new Date();
    return now >= new Date(product.promotion.promo_start_date) && now <= new Date(product.promotion.promo_end_date);
  };

  const getMarginColor = (margin: number) => {
    if (margin > 30) return 'text-green-600 bg-green-50';
    if (margin > 15) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div>
      {/* Import / Export CSV */}
      <CsvImportExport />

      {/* Panneau de vectorisation globale */}
      <VectorizationPanel />

      <div className="bg-white border border-ink/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-soft-green/30 to-soft-green/10 text-ink/70">
              <tr>
                <th className="px-6 py-4 text-left font-bold tracking-widest uppercase text-xs">Image</th>
                <th className="px-6 py-4 text-left font-bold tracking-widest uppercase text-xs">Produit</th>
                <th className="px-6 py-4 text-left font-bold tracking-widest uppercase text-xs">Badges</th>
                <th className="px-6 py-4 text-left font-bold tracking-widest uppercase text-xs">Catégories</th>
                <th className="px-6 py-4 text-left font-bold tracking-widest uppercase text-xs">Prix</th>
                <th className="px-6 py-4 text-left font-bold tracking-widest uppercase text-xs">Prix Achat</th>
                <th className="px-6 py-4 text-left font-bold tracking-widest uppercase text-xs">Marge</th>
                <th className="px-6 py-4 text-left font-bold tracking-widest uppercase text-xs">Stock</th>
                <th className="px-6 py-4 text-left font-bold tracking-widest uppercase text-xs">IA</th>
                <th className="px-6 py-4 text-right font-bold tracking-widest uppercase text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {products.map((product) => {
                const margin = product.purchase_price
                  ? ((product.price - product.purchase_price) / product.price * 100)
                  : null;
                const promoActive = isPromotionActive(product);
                // Priorité : mise à jour locale > donnée Supabase
                const embeddingDate = localEmbeddingDates[product.id] ?? product.embedding_updated_at;
                const isVectorized = Boolean(embeddingDate);

                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-soft-green/10 transition-colors ${!isVectorized ? 'bg-amber-50/30' : ''}`}
                  >
                    {/* Image */}
                    <td className="px-6 py-4">
                      <div className="relative">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-14 h-14 object-cover rounded-lg border border-ink/10 shadow-sm"
                        />
                        {promoActive && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            %
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Produit */}
                    <td className="px-6 py-4">
                      <div className="font-serif font-bold text-base text-ink">{product.name}</div>
                      {product.is_batch_product && (
                        <div className="text-xs text-ink/60 mt-1">
                          <span className="bg-ink/10 px-2 py-0.5 rounded">
                            📦 Lot de {product.batch_size} {product.batch_unit}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Badges */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(product.badges || []).map((badge) => {
                          const config = getBadgeConfig(badge);
                          return (
                            <span key={badge} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${config.color}`}>
                              {config.icon} {config.label}
                            </span>
                          );
                        })}
                        {promoActive && product.promotion && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            🔥 {product.promotion.promo_label || 'Promo'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Catégories */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(product.categories || []).map((cat) => (
                          <span key={cat} className="text-xs px-2 py-1 bg-ink/5 rounded tracking-wide">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Prix */}
                    <td className="px-6 py-4">
                      {promoActive && product.promotion ? (
                        <div>
                          <div className="font-bold text-red-600 text-base">{product.promotion.promo_price.toFixed(2)}€</div>
                          <div className="text-xs text-ink/40 line-through">{product.price.toFixed(2)}€</div>
                        </div>
                      ) : (
                        <div className="font-semibold text-base text-ink">{product.price.toFixed(2)}€</div>
                      )}
                    </td>

                    {/* Prix achat */}
                    <td className="px-6 py-4">
                      {product.purchase_price
                        ? <span className="text-ink/60 font-mono">{product.purchase_price.toFixed(2)}€</span>
                        : <span className="text-ink/30 text-xs">Non défini</span>
                      }
                    </td>

                    {/* Marge */}
                    <td className="px-6 py-4">
                      {margin !== null
                        ? <span className={`font-bold px-2 py-1 rounded-full text-xs ${getMarginColor(margin)}`}>{margin.toFixed(1)}%</span>
                        : <span className="text-ink/30 text-xs">-</span>
                      }
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-4">
                      <span className={`font-mono font-bold ${product.stock < 10 ? 'text-red-600' : 'text-ink'}`}>
                        {product.stock} {product.is_batch_product ? 'lots' : 'pcs'}
                      </span>
                    </td>

                    {/* ── Statut vectorisation ── */}
                    <td className="px-6 py-4">
                      <VectorBadge date={embeddingDate} />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleVectorizeOne(product.id)}
                          disabled={vectorizingId === product.id}
                          className={`p-2 rounded-lg border transition-all duration-200 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed
                            ${isVectorized
                              ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                              : 'border-amber-300 text-amber-600 hover:bg-amber-500 hover:text-white hover:border-amber-500'
                            }`}
                          title={isVectorized ? 'Re-vectoriser' : 'Vectoriser ce produit'}
                        >
                          {vectorizingId === product.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Cpu className="w-4 h-4" />
                          }
                        </button>
                        <button
                          onClick={() => onEdit(product)}
                          className="p-2 rounded-lg border border-ink/10 hover:bg-ink hover:text-white transition-all duration-200 hover:shadow-md"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(product.id)}
                          className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 hover:shadow-md"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-ink/60 text-lg">Aucun produit dans le catalogue</p>
            <p className="text-ink/40 text-sm mt-2">Cliquez sur "Nouveau Produit" pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
}
