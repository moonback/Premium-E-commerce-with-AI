import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  AlertTriangle, Clock, RefreshCw,
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

// ── Types ──────────────────────────────────────────────────────────────────
type Order = {
  id: string;
  order_number?: string | null;
  total: number;
  status: string;
  created_at: string;
  profiles?: { email?: string } | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  'Nouvelle':        { label: 'Nouvelle',        color: 'text-blue-600 bg-blue-50',    dot: 'bg-blue-500'   },
  'En préparation':  { label: 'En préparation',  color: 'text-amber-600 bg-amber-50',  dot: 'bg-amber-500'  },
  'Prête':           { label: 'Prête',           color: 'text-emerald-600 bg-emerald-50', dot: 'bg-emerald-500' },
  'Livrée':          { label: 'Livrée',          color: 'text-purple-600 bg-purple-50', dot: 'bg-purple-500' },
  'Terminée':        { label: 'Terminée',        color: 'text-ink/50 bg-ink/5',        dot: 'bg-ink/30'     },
};

// ── Main ───────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todaySales: 0, activeOrders: 0, totalCustomers: 0, totalProducts: 0,
    lowStockCount: 0, pendingOrders: 0, revenueGrowth: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30_000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = startOfDay(new Date());
      const yesterday = startOfDay(subDays(new Date(), 1));

      const [
        { data: todayOrders },
        { data: yesterdayOrders },
        { data: products },
        { count: customersCount },
        { data: recent },
      ] = await Promise.all([
        supabase.from('orders').select('total, status').gte('created_at', today.toISOString()),
        supabase.from('orders').select('total').gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString()),
        supabase.from('products').select('stock'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*, profiles(email)').order('created_at', { ascending: false }).limit(6),
      ]);

      const todaySales = todayOrders?.reduce((s, o) => s + (o.total || 0), 0) ?? 0;
      const yesterdaySales = yesterdayOrders?.reduce((s, o) => s + (o.total || 0), 0) ?? 0;
      const revenueGrowth = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0;

      setStats({
        todaySales,
        activeOrders: todayOrders?.filter(o => !['Livrée', 'Terminée'].includes(o.status)).length ?? 0,
        totalCustomers: customersCount ?? 0,
        totalProducts: products?.length ?? 0,
        lowStockCount: products?.filter(p => p.stock < 10).length ?? 0,
        pendingOrders: todayOrders?.filter(o => o.status === 'Nouvelle').length ?? 0,
        revenueGrowth,
      });
      setRecentOrders((recent as Order[]) ?? []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && recentOrders.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-ink/40">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm uppercase tracking-widest">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Alerts ── */}
      {(stats.lowStockCount > 0 || stats.pendingOrders > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stats.pendingOrders > 0 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-800 mb-0.5">
                  Commandes en attente
                </p>
                <p className="text-sm text-amber-700">
                  {stats.pendingOrders} commande{stats.pendingOrders > 1 ? 's' : ''} nécessite{stats.pendingOrders > 1 ? 'nt' : ''} votre attention
                </p>
              </div>
            </div>
          )}
          {stats.lowStockCount > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-red-800 mb-0.5">
                  Stock faible
                </p>
                <p className="text-sm text-red-700">
                  {stats.lowStockCount} produit{stats.lowStockCount > 1 ? 's' : ''} sous le seuil d'alerte
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Recent orders ── */}
      <div className="bg-white border border-ink/10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10">
          <h3 className="font-serif text-lg text-ink">Commandes récentes</h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-ink/30">
              Mis à jour {format(lastRefresh, 'HH:mm', { locale: fr })}
            </span>
            <button
              onClick={fetchDashboardData}
              className="p-1.5 text-ink/30 hover:text-ink transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="divide-y divide-ink/5">
          {recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink/40">Aucune commande récente</p>
          ) : (
            recentOrders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['Nouvelle'];
              return (
                <div key={order.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-ink/[0.02] transition-colors">
                  {/* Status dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />

                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      #{order.order_number || order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-ink/40 truncate">
                      {order.profiles?.email || 'Client anonyme'}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 font-medium shrink-0 ${cfg.color}`}>
                    {cfg.label}
                  </span>

                  {/* Amount + time */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-serif text-ink">{order.total.toFixed(2)} €</p>
                    <p className="text-[10px] text-ink/30">
                      {format(new Date(order.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
