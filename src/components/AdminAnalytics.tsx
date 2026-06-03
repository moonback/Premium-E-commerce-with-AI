import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package, BarChart2, RefreshCw } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ORDER_COLUMNS } from '../lib/columns';

type SalesData = { date: string; sales: number; orders: number };
type TopProduct = { product_id: string; product_name: string; total_quantity: number; total_revenue: number };

type Metrics = {
  totalRevenue: number; totalOrders: number; avgOrderValue: number;
  revenueGrowth: number; ordersGrowth: number;
};

// ── Metric card ────────────────────────────────────────────────────────────
function MetricCard({
  icon: Icon, label, value, growth, sub, iconColor,
}: {
  icon: React.ElementType; label: string; value: string;
  growth?: number; sub?: string; iconColor: string;
}) {
  return (
    <div className="bg-white border border-ink/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        {growth !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold ${growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(growth).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-[10px] uppercase tracking-[0.25em] text-ink/40 mb-0.5">{label}</p>
      <p className="text-2xl font-serif font-light text-ink">{value}</p>
      {sub && <p className="text-xs text-ink/40 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Bar chart row ──────────────────────────────────────────────────────────
function BarRow({ label, value, max, orders }: { label: string; value: number; max: number; orders: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 group">
      <span className="w-12 text-[10px] font-mono text-ink/40 shrink-0">{label}</span>
      <div className="flex-1 h-7 bg-soft-green/20 relative overflow-hidden">
        <div
          className="h-full bg-ink/80 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 flex items-center px-2.5 gap-2">
          <span className="text-xs font-medium text-bg mix-blend-difference">
            {value.toFixed(2)} €
          </span>
          <span className="text-[10px] text-ink/40 ml-auto">{orders} cmd</span>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function AdminAnalytics() {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [metrics, setMetrics] = useState<Metrics>({
    totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, revenueGrowth: 0, ordersGrowth: 0,
  });

  useEffect(() => { fetchAnalytics(); }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = startOfDay(subDays(new Date(), days));
      const prevStartDate = startOfDay(subDays(startDate, days));

      const [{ data: orders }, { data: prevOrders }] = await Promise.all([
        supabase
          .from('orders')
          .select(`${ORDER_COLUMNS}, order_items(quantity, price_at_time, product_id, products(name))`)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true }) as any,
        supabase
          .from('orders')
          .select('total')
          .gte('created_at', prevStartDate.toISOString())
          .lt('created_at', startDate.toISOString()) as any,
      ]);

      const totalRevenue = orders?.reduce((s, o) => s + (o.total || 0), 0) ?? 0;
      const totalOrders = orders?.length ?? 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const prevRevenue = prevOrders?.reduce((s, o) => s + (o.total || 0), 0) ?? 0;
      const prevCount = prevOrders?.length ?? 0;

      setMetrics({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        revenueGrowth: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
        ordersGrowth: prevCount > 0 ? ((totalOrders - prevCount) / prevCount) * 100 : 0,
      });

      // Group by day
      const byDay: Record<string, { sales: number; orders: number }> = {};
      orders?.forEach(o => {
        const d = format(new Date(o.created_at), 'yyyy-MM-dd');
        if (!byDay[d]) byDay[d] = { sales: 0, orders: 0 };
        byDay[d].sales += o.total || 0;
        byDay[d].orders += 1;
      });
      setSalesData(Object.entries(byDay).map(([date, v]) => ({ date, ...v })));

      // Top products
      const prodStats: Record<string, { name: string; qty: number; rev: number }> = {};
      orders?.forEach(o => {
        (o.order_items ?? []).forEach((item: any) => {
          const id = item.product_id;
          const name = item.products?.name ?? 'Inconnu';
          if (!prodStats[id]) prodStats[id] = { name, qty: 0, rev: 0 };
          prodStats[id].qty += item.quantity;
          prodStats[id].rev += item.quantity * item.price_at_time;
        });
      });
      setTopProducts(
        Object.entries(prodStats)
          .map(([id, v]) => ({ product_id: id, product_name: v.name, total_quantity: v.qty, total_revenue: v.rev }))
          .sort((a, b) => b.total_revenue - a.total_revenue)
          .slice(0, 10)
      );
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const maxSales = Math.max(...salesData.map(d => d.sales), 1);
  const maxRevenue = Math.max(...topProducts.map(p => p.total_revenue), 1);

  return (
    <div className="space-y-6">
      {/* ── Period selector ── */}
      <div className="flex items-center gap-2">
        {(['7d', '30d', '90d'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
              period === p ? 'bg-ink text-bg border-ink' : 'border-ink/15 text-ink/50 hover:border-ink/30'
            }`}
          >
            {p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : '90 jours'}
          </button>
        ))}
        <button
          onClick={fetchAnalytics}
          className="ml-auto p-2 border border-ink/15 text-ink/40 hover:text-ink hover:border-ink/30 transition-colors"
          title="Rafraîchir"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} label="Revenu total"   value={`${metrics.totalRevenue.toFixed(2)} €`}  growth={metrics.revenueGrowth} sub="vs période préc." iconColor="bg-amber-50 text-amber-600" />
        <MetricCard icon={ShoppingBag} label="Commandes"     value={String(metrics.totalOrders)}              growth={metrics.ordersGrowth}  sub="vs période préc." iconColor="bg-blue-50 text-blue-600" />
        <MetricCard icon={Package}     label="Panier moyen"  value={`${metrics.avgOrderValue.toFixed(2)} €`}  sub="par commande"             iconColor="bg-emerald-50 text-emerald-600" />
        <MetricCard icon={BarChart2}   label="Taux conversion" value="—"                                      sub="Tracking requis"          iconColor="bg-purple-50 text-purple-600" />
      </div>

      {/* ── Sales chart ── */}
      <div className="bg-white border border-ink/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-lg text-ink">Ventes par jour</h3>
          <span className="text-[10px] uppercase tracking-widest text-ink/30">{salesData.length} jours</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-ink/30 gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : salesData.length === 0 ? (
          <p className="text-center text-sm text-ink/30 py-10">Aucune donnée pour cette période</p>
        ) : (
          <div className="space-y-2">
            {salesData.map((day, i) => (
              <BarRow
                key={i}
                label={format(new Date(day.date), 'dd/MM', { locale: fr })}
                value={day.sales}
                max={maxSales}
                orders={day.orders}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Top products ── */}
      <div className="bg-white border border-ink/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-lg text-ink">Top 10 produits</h3>
          <span className="text-[10px] uppercase tracking-widest text-ink/30">par revenu</span>
        </div>
        {topProducts.length === 0 ? (
          <p className="text-center text-sm text-ink/30 py-6">Aucune donnée</p>
        ) : (
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={p.product_id} className="flex items-center gap-4 py-2.5 border-b border-ink/5 last:border-0">
                <span className="w-6 text-[10px] font-mono text-ink/30 shrink-0 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{p.product_name}</p>
                  <div className="mt-1 h-1.5 bg-soft-green/30 w-full">
                    <div
                      className="h-full bg-accent/60 transition-all duration-500"
                      style={{ width: `${(p.total_revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-serif text-sm text-ink">{p.total_revenue.toFixed(2)} €</p>
                  <p className="text-[10px] text-ink/40">{p.total_quantity} unités</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
