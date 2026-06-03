// src/components/admin/VectorizationPanel.tsx
// Panneau de vectorisation pgvector intégré à la page Produits admin
import React, { useState, useEffect, useCallback } from 'react';
import { Cpu, CheckCircle, XCircle, Loader2, RefreshCw, Zap, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface VectorizationStats {
  total: number;
  vectorized: number;
  pending: number;
  percent: number;
}

interface VectorizationResult {
  success: number;
  failed: number;
  skipped: number;
  errors?: Array<{ productId: string; error: string }>;
}

export default function VectorizationPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState<VectorizationStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [result, setResult] = useState<VectorizationResult | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const fetchStats = useCallback(async () => {
    if (!supabase) return;
    setIsLoadingStats(true);
    try {
      // Total produits
      const { count: total } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true });

      // Produits vectorisés (embedding non null)
      const { count: vectorized } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .not('embedding', 'is', null);

      const t = total ?? 0;
      const v = vectorized ?? 0;
      setStats({
        total: t,
        vectorized: v,
        pending: t - v,
        percent: t > 0 ? Math.round((v / t) * 100) : 0,
      });
    } catch (e) {
      console.error('Failed to fetch vectorization stats', e);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (isExpanded) fetchStats();
  }, [isExpanded, fetchStats]);

  const handleVectorize = async (onlyMissing: boolean) => {
    if (!supabase) return;
    setIsVectorizing(true);
    setResult(null);
    setProgress(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Session expirée, reconnectez-vous');
        return;
      }

      const res = await fetch('/api/products/vectorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ onlyMissing }),
      });

      const json = await res.json() as VectorizationResult & { ok?: boolean; error?: string };

      if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);

      setResult(json);
      toast.success(`${json.success} produit(s) vectorisé(s)`);
      // Rafraîchir les stats après vectorisation
      await fetchStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(msg);
    } finally {
      setIsVectorizing(false);
      setProgress(null);
    }
  };

  const handleVectorizeOne = async (productId: string) => {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/products/${productId}/vectorize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error);
      toast.success('Produit vectorisé');
      await fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <div className="border border-ink/10 rounded-xl overflow-hidden bg-white mb-4">
      {/* Header — toujours visible */}
      <button
        onClick={() => setIsExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-soft-green/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ink flex items-center justify-center rounded-lg">
            <Cpu className="w-4 h-4 text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-ink">Vectorisation IA</p>
            <p className="text-xs text-ink/50">
              {stats
                ? `${stats.vectorized}/${stats.total} produits vectorisés (${stats.percent}%)`
                : 'Embeddings sémantiques pgvector'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Mini progress bar */}
          {stats && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-1.5 bg-ink/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
              <span className="text-xs font-mono text-ink/50">{stats.percent}%</span>
            </div>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4 text-ink/40" /> : <ChevronDown className="w-4 h-4 text-ink/40" />}
        </div>
      </button>

      {/* Contenu expandable */}
      {isExpanded && (
        <div className="border-t border-ink/10 p-5 space-y-5">

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total produits', value: stats?.total ?? '—', icon: Database, color: 'text-ink' },
              { label: 'Vectorisés', value: stats?.vectorized ?? '—', icon: CheckCircle, color: 'text-emerald-600' },
              { label: 'En attente', value: stats?.pending ?? '—', icon: Zap, color: stats?.pending ? 'text-amber-500' : 'text-ink/30' },
              { label: 'Couverture', value: stats ? `${stats.percent}%` : '—', icon: Cpu, color: 'text-ink' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-soft-green/20 rounded-lg p-3 flex items-center gap-3">
                <Icon className={`w-5 h-5 shrink-0 ${color}`} />
                <div>
                  <p className="text-xs text-ink/50 leading-tight">{label}</p>
                  <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Barre de progression globale */}
          {stats && (
            <div>
              <div className="flex justify-between text-xs text-ink/50 mb-1.5">
                <span>Progression globale</span>
                <span>{stats.vectorized} / {stats.total}</span>
              </div>
              <div className="w-full h-2 bg-ink/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Progression en cours */}
          {isVectorizing && progress && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-xs text-amber-700 mb-1">
                  <span>Vectorisation en cours…</span>
                  <span>{progress.done}/{progress.total}</span>
                </div>
                <div className="w-full h-1.5 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Résultat */}
          {result && (
            <div className={`flex items-start gap-3 p-4 rounded-lg border ${
              result.failed > 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              {result.failed > 0
                ? <XCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                : <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              }
              <div className="text-sm">
                <p className="font-semibold text-ink">Vectorisation terminée</p>
                <div className="flex gap-4 mt-1 text-xs">
                  <span className="text-emerald-700">✅ {result.success} succès</span>
                  {result.failed > 0 && <span className="text-red-600">❌ {result.failed} échec(s)</span>}
                  {result.skipped > 0 && <span className="text-ink/50">⏭ {result.skipped} ignoré(s)</span>}
                </div>
                {result.errors && result.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">Voir les erreurs</summary>
                    <ul className="mt-1 space-y-0.5">
                      {result.errors.slice(0, 5).map(e => (
                        <li key={e.productId} className="text-xs text-red-500 font-mono">
                          {e.productId}: {e.error}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={() => handleVectorize(true)}
              disabled={isVectorizing}
              className="flex items-center gap-2 px-4 py-2.5 bg-ink text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVectorizing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Zap className="w-4 h-4" />
              }
              Vectoriser les nouveaux
            </button>

            <button
              onClick={() => handleVectorize(false)}
              disabled={isVectorizing}
              className="flex items-center gap-2 px-4 py-2.5 border border-ink/20 text-ink text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-ink/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVectorizing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />
              }
              Re-vectoriser tout
            </button>

            <button
              onClick={fetchStats}
              disabled={isLoadingStats}
              className="flex items-center gap-2 px-3 py-2.5 border border-ink/10 text-ink/50 text-xs rounded-lg hover:bg-ink/5 transition-colors ml-auto"
              title="Rafraîchir les stats"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <p className="text-xs text-ink/30">
            "Nouveaux" traite uniquement les produits sans embedding. "Re-vectoriser tout" régénère tous les embeddings (utile après modification des descriptions).
          </p>
        </div>
      )}
    </div>
  );
}

// Export de la fonction handleVectorizeOne pour usage dans ProductsTable
export { };
