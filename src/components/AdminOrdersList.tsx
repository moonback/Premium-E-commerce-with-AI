import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Clock, Truck, Package, CheckCircle, RefreshCw, Search, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ORDER_COLUMNS } from '../lib/columns';

type Order = {
  id: string;
  user_id: string;
  total: number;
  status: string;
  order_number?: string | null;
  created_at: string;
  profiles?: { email?: string; phone?: string } | null;
};

const STATUSES = ['Nouvelle', 'En préparation', 'Prête', 'Livrée', 'Terminée', 'Annulée'];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  'Nouvelle':        { color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',    icon: Clock       },
  'En préparation':  { color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',  icon: Package     },
  'Prête':           { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  'Livrée':          { color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200', icon: Truck       },
  'Terminée':        { color: 'text-ink/50',      bg: 'bg-ink/5 border-ink/10',        icon: CheckCircle },
  'Annulée':         { color: 'text-red-600',     bg: 'bg-red-50 border-red-200',      icon: Clock       },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Nouvelle'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] font-bold px-2 py-1 border ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

export default function AdminOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`${ORDER_COLUMNS}, profiles(email, phone)`)
        .order('created_at', { ascending: false }) as any;
      if (error) throw error;
      setOrders((data as Order[]) ?? []);
    } catch {
      toast.error('Erreur chargement commandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const sub = supabase
      .channel('orders-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Statut mis à jour');
    } catch {
      toast.error('Erreur mise à jour');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteOrder = async (id: string) => {
    if (!window.confirm('Supprimer cette commande ?')) return;
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== id));
      toast.success('Commande supprimée');
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const term = search.toLowerCase();
    const matchSearch = !term ||
      (o.order_number ?? '').toLowerCase().includes(term) ||
      (o.profiles?.email ?? '').toLowerCase().includes(term) ||
      o.id.toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  // Summary counts
  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* ── Status summary pills ── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold border transition-colors ${
            statusFilter === 'all' ? 'bg-ink text-bg border-ink' : 'border-ink/15 text-ink/50 hover:border-ink/30'
          }`}
        >
          Toutes ({orders.length})
        </button>
        {STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold border transition-colors ${
                statusFilter === s ? `${cfg.bg} ${cfg.color} border-current` : 'border-ink/15 text-ink/50 hover:border-ink/30'
              }`}
            >
              {s} {counts[s] > 0 && `(${counts[s]})`}
            </button>
          );
        })}
      </div>

      {/* ── Search + refresh ── */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
          <input
            type="text"
            placeholder="Rechercher par n° commande, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-ink/15 text-sm focus:outline-none focus:border-ink/40 bg-white"
          />
        </div>
        <button
          onClick={fetchOrders}
          className="px-4 py-2.5 border border-ink/15 text-ink/50 hover:text-ink hover:border-ink/30 transition-colors"
          title="Rafraîchir"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-ink/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.02]">
              {['Commande', 'Client', 'Total', 'Statut', 'Date', ''].map(h => (
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
              <tr><td colSpan={6} className="px-5 py-10 text-center text-ink/30 text-sm">Aucune commande trouvée</td></tr>
            ) : (
              filtered.map(order => (
                <tr key={order.id} className="hover:bg-ink/[0.02] transition-colors">
                  {/* Order # */}
                  <td className="px-5 py-3.5">
                    <p className="font-mono text-xs font-bold text-ink">
                      #{order.order_number || order.id.slice(0, 8)}
                    </p>
                  </td>

                  {/* Client */}
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-ink truncate max-w-[180px]">
                      {order.profiles?.email || 'Anonyme'}
                    </p>
                    {order.profiles?.phone && (
                      <p className="text-xs text-ink/40">{order.profiles.phone}</p>
                    )}
                  </td>

                  {/* Total */}
                  <td className="px-5 py-3.5">
                    <span className="font-serif text-base text-ink">{order.total.toFixed(2)} €</span>
                  </td>

                  {/* Status select */}
                  <td className="px-5 py-3.5">
                    <div className="relative inline-flex items-center">
                      <StatusBadge status={order.status} />
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                        aria-label="Changer le statut"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="w-3 h-3 text-ink/30 ml-1 shrink-0" />
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5">
                    <p className="text-xs text-ink/50">
                      {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
                    </p>
                    <p className="text-[10px] text-ink/30">
                      {format(new Date(order.created_at), 'HH:mm')}
                    </p>
                  </td>

                  {/* Delete */}
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="p-1.5 text-ink/20 hover:text-red-500 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-ink/5 bg-ink/[0.01]">
            <p className="text-[10px] uppercase tracking-widest text-ink/30">
              {filtered.length} commande{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
