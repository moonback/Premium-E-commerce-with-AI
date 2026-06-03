import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Package, TrendingDown, RefreshCw, Plus, Minus, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Product } from '../types';
import { PRODUCT_COLUMNS_INVENTORY } from '../lib/columns';

type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
type InventoryProduct = Product & { stock_status: StockStatus };

const STATUS_CONFIG: Record<StockStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  in_stock:     { label: 'En stock',  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Package      },
  low_stock:    { label: 'Faible',    color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: TrendingDown },
  out_of_stock: { label: 'Rupture',   color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     icon: AlertTriangle },
};

function StockBadge({ status }: { status: StockStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] font-bold px-2 py-1 border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function AdminInventory() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | StockStatus>('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS_INVENTORY)
        .order('stock', { ascending: true }) as any;
      if (error) throw error;
      setProducts(
        (data ?? []).map(p => ({
          ...p,
          stock_status: p.stock === 0 ? 'out_of_stock' : p.stock < 10 ? 'low_stock' : 'in_stock',
        })) as InventoryProduct[]
      );
    } catch {
      toast.error('Erreur chargement stock');
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (id: string, newStock: number) => {
    if (newStock < 0) return;
    setUpdatingId(id);
    try {
      const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === id
        ? { ...p, stock: newStock, stock_status: newStock === 0 ? 'out_of_stock' : newStock < 10 ? 'low_stock' : 'in_stock' }
        : p
      ));
      toast.success('Stock mis à jour');
    } catch {
      toast.error('Erreur mise à jour');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = products.filter(p => {
    const matchFilter = filter === 'all' || p.stock_status === filter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total: products.length,
    lowStock: products.filter(p => p.stock_status === 'low_stock').length,
    outOfStock: products.filter(p => p.stock_status === 'out_of_stock').length,
    totalValue: products.reduce((s, p) => s + p.price * p.stock, 0),
  };

  return (
    <div className="space-y-6">
      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total produits', value: stats.total, color: 'text-ink', bg: 'bg-white border-ink/10' },
          { label: 'Stock faible',   value: stats.lowStock,   color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Rupture',        value: stats.outOfStock, color: 'text-red-700',   bg: 'bg-red-50 border-red-200'     },
          { label: 'Valeur stock',   value: `${stats.totalValue.toFixed(0)} €`, color: 'text-ink', bg: 'bg-white border-ink/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`p-4 border ${bg}`}>
            <p className="text-[10px] uppercase tracking-[0.25em] text-ink/40 mb-1">{label}</p>
            <p className={`text-2xl font-serif font-light ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters + search ── */}
      <div className="flex flex-wrap gap-3 items-center">
        {(['all', 'low_stock', 'out_of_stock'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold border transition-colors ${
              filter === f
                ? f === 'all' ? 'bg-ink text-bg border-ink'
                  : f === 'low_stock' ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-red-500 text-white border-red-500'
                : 'border-ink/15 text-ink/50 hover:border-ink/30'
            }`}
          >
            {f === 'all' ? 'Tous' : f === 'low_stock' ? 'Stock faible' : 'Rupture'}
          </button>
        ))}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/30" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-ink/15 text-sm focus:outline-none focus:border-ink/40 bg-white"
          />
        </div>
        <button
          onClick={fetchInventory}
          className="p-2 border border-ink/15 text-ink/40 hover:text-ink hover:border-ink/30 transition-colors"
          title="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-ink/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.02]">
              {['Produit', 'Prix', 'Stock', 'Statut', 'Valeur', 'Ajuster'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-ink/40 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {loading && filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-ink/30 text-sm">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-ink/30 text-sm">Aucun produit trouvé</td></tr>
            ) : (
              filtered.map(product => (
                <tr
                  key={product.id}
                  className={`hover:bg-ink/[0.02] transition-colors ${
                    product.stock_status === 'out_of_stock' ? 'bg-red-50/30' :
                    product.stock_status === 'low_stock' ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Product */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <img src={product.image} alt="" className="w-10 h-10 object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-soft-green flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-ink/30" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-ink truncate max-w-[200px]">{product.name}</p>
                        <p className="text-[10px] text-ink/30 font-mono">{product.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-5 py-3.5">
                    <span className="font-serif text-ink">{product.price.toFixed(2)} €</span>
                  </td>

                  {/* Stock number */}
                  <td className="px-5 py-3.5">
                    <span className={`text-lg font-serif font-light ${
                      product.stock_status === 'out_of_stock' ? 'text-red-600' :
                      product.stock_status === 'low_stock' ? 'text-amber-600' : 'text-ink'
                    }`}>
                      {product.stock}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <StockBadge status={product.stock_status} />
                  </td>

                  {/* Value */}
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-ink/60">{(product.price * product.stock).toFixed(2)} €</span>
                  </td>

                  {/* Adjust */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateStock(product.id, product.stock - 1)}
                        disabled={updatingId === product.id || product.stock === 0}
                        className="w-7 h-7 flex items-center justify-center border border-ink/15 text-ink/50 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-30"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={product.stock}
                        onChange={e => updateStock(product.id, parseInt(e.target.value) || 0)}
                        className="w-14 text-center border border-ink/15 py-1 text-sm focus:outline-none focus:border-ink/40"
                        min={0}
                      />
                      <button
                        onClick={() => updateStock(product.id, product.stock + 1)}
                        disabled={updatingId === product.id}
                        className="w-7 h-7 flex items-center justify-center border border-ink/15 text-ink/50 hover:border-emerald-300 hover:text-emerald-600 transition-colors disabled:opacity-30"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-ink/5 bg-ink/[0.01]">
            <p className="text-[10px] uppercase tracking-widest text-ink/30">
              {filtered.length} produit{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
