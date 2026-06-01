import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Package, AlertTriangle, Clock } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    activeOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockCount: 0,
    pendingOrders: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = startOfDay(new Date());
      const yesterday = startOfDay(subDays(new Date(), 1));

      // Fetch today's orders
      const { data: todayOrders, error: todayError } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', today.toISOString());

      if (todayError) throw todayError;

      // Fetch yesterday's orders for comparison
      const { data: yesterdayOrders, error: yesterdayError } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      if (yesterdayError) throw yesterdayError;

      // Calculate metrics
      const todaySales = todayOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const yesterdaySales = yesterdayOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const revenueGrowth = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0;

      const activeOrders = todayOrders?.filter(o => !['Livrée', 'Terminée'].includes(o.status)).length || 0;
      const pendingOrders = todayOrders?.filter(o => o.status === 'Nouvelle').length || 0;

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('stock');

      if (productsError) throw productsError;

      const lowStockCount = products?.filter(p => p.stock < 10).length || 0;

      // Fetch customers
      const { count: customersCount, error: customersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (customersError) throw customersError;

      // Fetch recent orders
      const { data: recent, error: recentError } = await supabase
        .from('orders')
        .select('*, profiles(email)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      setStats({
        todaySales,
        activeOrders,
        totalCustomers: customersCount || 0,
        totalProducts: products?.length || 0,
        lowStockCount,
        pendingOrders,
        revenueGrowth,
        ordersGrowth: 0,
      });

      setRecentOrders(recent || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-ink/50">Chargement du tableau de bord...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-transparent p-6 border border-ink/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-ink/50 text-xs font-bold uppercase tracking-widest">Ventes du Jour</p>
            <DollarSign className="w-5 h-5 text-ink/30" />
          </div>
          <p className="text-3xl font-serif tracking-tight mb-2">{stats.todaySales.toFixed(2)}€</p>
          <div className="flex items-center gap-1 text-xs">
            {stats.revenueGrowth >= 0 ? (
              <TrendingUp className="w-3 h-3 text-green-600" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-600" />
            )}
            <span className={stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
              {stats.revenueGrowth.toFixed(1)}%
            </span>
            <span className="text-ink/50">vs hier</span>
          </div>
        </div>

        <div className="bg-transparent p-6 border border-ink/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-ink/50 text-xs font-bold uppercase tracking-widest">Commandes Actives</p>
            <ShoppingBag className="w-5 h-5 text-ink/30" />
          </div>
          <p className="text-3xl font-serif tracking-tight mb-2">{stats.activeOrders}</p>
          <p className="text-xs text-ink/50">
            {stats.pendingOrders} en attente
          </p>
        </div>

        <div className="bg-transparent p-6 border border-ink/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-ink/50 text-xs font-bold uppercase tracking-widest">Total Clients</p>
            <Users className="w-5 h-5 text-ink/30" />
          </div>
          <p className="text-3xl font-serif tracking-tight mb-2">{stats.totalCustomers}</p>
          <p className="text-xs text-ink/50">Inscrits</p>
        </div>

        <div className="bg-transparent p-6 border border-ink/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-ink/50 text-xs font-bold uppercase tracking-widest">Produits</p>
            <Package className="w-5 h-5 text-ink/30" />
          </div>
          <p className="text-3xl font-serif tracking-tight mb-2">{stats.totalProducts}</p>
          <p className="text-xs text-ink/50">
            {stats.lowStockCount} stock faible
          </p>
        </div>
      </div> */}

      {/* Alerts */}
      {(stats.lowStockCount > 0 || stats.pendingOrders > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.pendingOrders > 0 && (
            <div className="bg-orange-50 border border-orange-200 p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-bold text-orange-900 mb-1">Commandes en attente</p>
                <p className="text-sm text-orange-700">
                  {stats.pendingOrders} commande{stats.pendingOrders > 1 ? 's' : ''} nécessite{stats.pendingOrders > 1 ? 'nt' : ''} votre attention
                </p>
              </div>
            </div>
          )}

          {stats.lowStockCount > 0 && (
            <div className="bg-red-50 border border-red-200 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold text-red-900 mb-1">Stock faible</p>
                <p className="text-sm text-red-700">
                  {stats.lowStockCount} produit{stats.lowStockCount > 1 ? 's' : ''} en stock faible
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-transparent border border-ink/10">
        <div className="p-4 border-b border-ink/10 bg-soft-green/20">
          <h3 className="text-lg font-serif">Commandes Récentes</h3>
        </div>
        <div className="divide-y divide-ink/10">
          {recentOrders.map((order) => (
            <div key={order.id} className="p-4 hover:bg-ink/5 transition-colors flex items-center justify-between">
              <div>
                <p className="font-bold">#{order.order_number || order.id.slice(0, 8)}</p>
                <p className="text-xs text-ink/60">{order.profiles?.email || 'Client anonyme'}</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-lg">{order.total.toFixed(2)}€</p>
                <p className="text-xs text-ink/60">{format(new Date(order.created_at), 'HH:mm')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
