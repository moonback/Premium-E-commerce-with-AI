import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Package } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

type SalesData = {
  date: string;
  sales: number;
  orders: number;
};

type TopProduct = {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
};

export default function AdminAnalytics() {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = startOfDay(subDays(new Date(), days));

      // Fetch orders for the period
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(quantity, price_at_time, products(name))')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      // Fetch previous period for comparison
      const prevStartDate = startOfDay(subDays(startDate, days));
      const { data: prevOrders, error: prevError } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      if (prevError) throw prevError;

      // Calculate metrics
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const prevRevenue = prevOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const prevOrdersCount = prevOrders?.length || 0;

      const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      const ordersGrowth = prevOrdersCount > 0 ? ((totalOrders - prevOrdersCount) / prevOrdersCount) * 100 : 0;

      setMetrics({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        conversionRate: 0, // Would need visitor tracking
        revenueGrowth,
        ordersGrowth,
      });

      // Group sales by day
      const salesByDay: { [key: string]: { sales: number; orders: number } } = {};
      orders?.forEach(order => {
        const date = format(new Date(order.created_at), 'yyyy-MM-dd');
        if (!salesByDay[date]) {
          salesByDay[date] = { sales: 0, orders: 0 };
        }
        salesByDay[date].sales += order.total || 0;
        salesByDay[date].orders += 1;
      });

      const salesDataArray = Object.entries(salesByDay).map(([date, data]) => ({
        date,
        sales: data.sales,
        orders: data.orders,
      }));

      setSalesData(salesDataArray);

      // Calculate top products
      const productStats: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const productId = item.product_id;
          const productName = item.products?.name || 'Produit inconnu';
          if (!productStats[productId]) {
            productStats[productId] = { name: productName, quantity: 0, revenue: 0 };
          }
          productStats[productId].quantity += item.quantity;
          productStats[productId].revenue += item.quantity * item.price_at_time;
        });
      });

      const topProductsArray = Object.entries(productStats)
        .map(([id, data]) => ({
          product_id: id,
          product_name: data.name,
          total_quantity: data.quantity,
          total_revenue: data.revenue,
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);

      setTopProducts(topProductsArray);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const maxSales = Math.max(...salesData.map(d => d.sales), 1);

  if (loading) {
    return <div className="p-8 text-center text-ink/50">Chargement des analyses...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {(['7d', '30d', '90d'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              period === p
                ? 'bg-ink text-white'
                : 'bg-transparent border border-ink/10 text-ink/60 hover:bg-soft-green'
            }`}
          >
            {p === '7d' ? '7 Jours' : p === '30d' ? '30 Jours' : '90 Jours'}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-transparent p-6 border border-ink/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-ink/50 text-xs font-bold uppercase tracking-widest">Revenu Total</p>
            <DollarSign className="w-5 h-5 text-ink/30" />
          </div>
          <p className="text-3xl font-serif tracking-tight mb-2">{metrics.totalRevenue.toFixed(2)}€</p>
          <div className="flex items-center gap-1 text-xs">
            {metrics.revenueGrowth >= 0 ? (
              <TrendingUp className="w-3 h-3 text-green-600" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-600" />
            )}
            <span className={metrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
              {metrics.revenueGrowth.toFixed(1)}%
            </span>
            <span className="text-ink/50">vs période précédente</span>
          </div>
        </div>

        <div className="bg-transparent p-6 border border-ink/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-ink/50 text-xs font-bold uppercase tracking-widest">Commandes</p>
            <ShoppingBag className="w-5 h-5 text-ink/30" />
          </div>
          <p className="text-3xl font-serif tracking-tight mb-2">{metrics.totalOrders}</p>
          <div className="flex items-center gap-1 text-xs">
            {metrics.ordersGrowth >= 0 ? (
              <TrendingUp className="w-3 h-3 text-green-600" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-600" />
            )}
            <span className={metrics.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
              {metrics.ordersGrowth.toFixed(1)}%
            </span>
            <span className="text-ink/50">vs période précédente</span>
          </div>
        </div>

        <div className="bg-transparent p-6 border border-ink/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-ink/50 text-xs font-bold uppercase tracking-widest">Panier Moyen</p>
            <Package className="w-5 h-5 text-ink/30" />
          </div>
          <p className="text-3xl font-serif tracking-tight mb-2">{metrics.avgOrderValue.toFixed(2)}€</p>
          <p className="text-xs text-ink/50">Par commande</p>
        </div>

        <div className="bg-transparent p-6 border border-ink/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-ink/50 text-xs font-bold uppercase tracking-widest">Taux Conversion</p>
            <Users className="w-5 h-5 text-ink/30" />
          </div>
          <p className="text-3xl font-serif tracking-tight mb-2">-</p>
          <p className="text-xs text-ink/50">Tracking requis</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-transparent border border-ink/10 p-6">
        <h3 className="text-lg font-serif mb-6">Ventes par Jour</h3>
        <div className="space-y-3">
          {salesData.map((day, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-24 text-xs text-ink/60 font-mono">
                {format(new Date(day.date), 'dd/MM')}
              </div>
              <div className="flex-1 bg-soft-green/20 h-8 relative">
                <div
                  className="bg-ink h-full transition-all duration-300"
                  style={{ width: `${(day.sales / maxSales) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3 text-xs font-bold text-ink">
                  {day.sales.toFixed(2)}€ ({day.orders} cmd)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-transparent border border-ink/10 p-6">
        <h3 className="text-lg font-serif mb-6">Top 10 Produits</h3>
        <div className="space-y-2">
          {topProducts.map((product, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-soft-green/10 hover:bg-soft-green/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-ink text-white flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-bold text-sm">{product.product_name}</p>
                  <p className="text-xs text-ink/60">{product.total_quantity} unités vendues</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-serif text-lg">{product.total_revenue.toFixed(2)}€</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
