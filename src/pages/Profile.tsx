import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import {
  User as UserIcon, Package, Star, LogOut, CheckCircle, Clock,
  Heart, MapPin, Settings, Award, CreditCard, Bell, Shield,
  ChevronRight, Mail, Phone, Calendar, TrendingUp, Gift,
  Download, ShoppingBag, X, Menu
} from 'lucide-react';
import ProfileInfo from '../components/ProfileInfo';
import AddressBook from '../components/AddressBook';
import { supabase } from '../lib/supabase';
import { ORDER_COLUMNS } from '../lib/columns';
import { getErrorMessage } from '../lib/errors';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

type ProfileOrder = {
  id: string;
  status: string;
  order_number?: string | null;
  created_at: string;
  total: number;
};

type TabType = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'loyalty' | 'settings';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  'Nouvelle':       { label: 'Commandé',     color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',   icon: Clock },
  'En préparation': { label: 'En préparation', color: 'text-[#ff9900]',  bg: 'bg-[#ff9900]/10 border-[#ff9900]/30', icon: Package },
  'Prête':          { label: 'Prête',         color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: CheckCircle },
  'Livrée':         { label: 'Livré',         color: 'text-green-700',  bg: 'bg-green-50 border-green-200', icon: CheckCircle },
  'Terminée':       { label: 'Terminé',       color: 'text-green-700',  bg: 'bg-green-50 border-green-200', icon: CheckCircle },
};

export default function Profile() {
  const { user, setUser, loyaltyPoints, wishlist, fetchWishlist, removeFromWishlist, addToCart, products } = useStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ProfileOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const getTierInfo = (points: number) => {
    if (points < 1000) return { current: 'Bronze', next: 'Silver', nextPoints: 1000, progress: (points / 1000) * 100, color: 'from-amber-600 to-amber-800', textColor: 'text-amber-700', bg: 'bg-amber-50', benefits: ['5% de réduction', 'Livraison standard gratuite'] };
    if (points < 2500) return { current: 'Silver', next: 'Gold', nextPoints: 2500, progress: ((points - 1000) / 1500) * 100, color: 'from-gray-400 to-gray-600', textColor: 'text-gray-600', bg: 'bg-gray-50', benefits: ['10% de réduction', 'Livraison express gratuite', 'Ventes privées'] };
    if (points < 5000) return { current: 'Gold', next: 'Platinum', nextPoints: 5000, progress: ((points - 2500) / 2500) * 100, color: 'from-yellow-400 to-yellow-600', textColor: 'text-yellow-700', bg: 'bg-yellow-50', benefits: ['15% de réduction', 'Service prioritaire', 'Cadeaux exclusifs'] };
    return { current: 'Platinum', next: 'Elite', nextPoints: 10000, progress: Math.min(((points - 5000) / 5000) * 100, 100), color: 'from-purple-400 to-purple-600', textColor: 'text-purple-700', bg: 'bg-purple-50', benefits: ['20% de réduction', 'Concierge personnel', 'Événements VIP'] };
  };
  const tier = getTierInfo(loyaltyPoints);

  useEffect(() => {
    if (user && supabase) {
      const fetchOrders = async () => {
        try {
          const { data, error } = await supabase.from('orders').select(ORDER_COLUMNS).eq('user_id', user.id).order('created_at', { ascending: false }) as any;
          if (!error && data) setOrders(data as ProfileOrder[]);
        } catch (err) { console.error('Failed to load orders', getErrorMessage(err)); }
        finally { setLoading(false); }
      };
      fetchOrders();
      fetchWishlist();
    } else { setLoading(false); }
  }, [user, fetchWishlist]);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  if (!user) return null;

  const sidebarItems = [
    { id: 'overview' as TabType,   label: 'Vue d\'ensemble', icon: UserIcon },
    { id: 'orders' as TabType,     label: 'Mes commandes',   icon: Package,  badge: orders.length },
    { id: 'wishlist' as TabType,   label: 'Mes favoris',     icon: Heart,    badge: wishlist.length },
    { id: 'addresses' as TabType,  label: 'Adresses',        icon: MapPin },
    { id: 'loyalty' as TabType,    label: 'Fidélité',        icon: Award },
    { id: 'settings' as TabType,   label: 'Paramètres',      icon: Settings },
  ];

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* User card */}
      <div className="bg-[#232f3e] p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff9900] to-[#fa8900] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold truncate">{user.email.split('@')[0]}</p>
            <p className="text-white/60 text-xs truncate">{user.email}</p>
            <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gradient-to-r ${tier.color} text-white`}>
              {tier.current}
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="ml-auto p-1 text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {/* Points mini */}
        <div className="mt-4 p-3 bg-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/70 text-xs">Points fidélité</span>
            <span className="text-[#ff9900] font-bold text-sm">{loyaltyPoints}</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full">
            <div className="h-full bg-[#ff9900] rounded-full" style={{ width: `${tier.progress}%` }} />
          </div>
          <p className="text-white/50 text-[10px] mt-1">{tier.nextPoints - loyaltyPoints} pts vers {tier.next}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 bg-white overflow-y-auto">
        {sidebarItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); onClose?.(); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === item.id
                ? 'bg-[#ff9900]/10 text-[#ff9900] border border-[#ff9900]/20'
                : 'text-ink/70 hover:bg-gray-100 hover:text-ink'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 bg-[#ff9900] text-white rounded-full text-[10px] font-bold">
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-3 h-3 text-ink/30" />
            </div>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-[#f0f2f2] min-h-screen pb-20 md:pb-0">
      {/* Amazon-style header bar */}
      <div className="bg-[#232f3e] py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="lg:hidden text-white p-1">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-white font-bold text-lg">Mon Compte</h1>
          <span className="text-white/50 text-sm hidden sm:block">/ {sidebarItems.find(i => i.id === activeTab)?.label}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm sticky top-4">
              <SidebarContent />
            </div>
          </aside>

          {/* Mobile Sidebar */}
          <AnimatePresence>
            {isMobileSidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                />
                <motion.div
                  initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed left-0 top-0 bottom-0 w-80 max-w-[90vw] shadow-2xl z-50 lg:hidden overflow-hidden"
                >
                  <SidebarContent onClose={() => setIsMobileSidebarOpen(false)} />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Main content */}
          <main>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >

                {/* ── OVERVIEW ── */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Commandes', value: orders.length, icon: Package, color: 'text-[#ff9900]', bg: 'bg-[#ff9900]/10' },
                        { label: 'Favoris', value: wishlist.length, icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
                        { label: 'Points', value: loyaltyPoints, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Palier', value: tier.current, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50', isText: true },
                      ].map(stat => (
                        <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center mb-3`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                          </div>
                          <p className="text-2xl font-bold text-ink">{stat.value}</p>
                          <p className="text-xs text-ink/60 font-medium">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Recent orders */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="font-bold text-ink">Commandes récentes</h2>
                        <button onClick={() => setActiveTab('orders')} className="text-sm text-[#007185] hover:underline flex items-center gap-1">
                          Voir tout <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      {orders.length === 0 ? (
                        <div className="text-center py-12 px-6">
                          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-ink/60 text-sm mb-4">Aucune commande pour le moment</p>
                          <Link to="/" className="px-4 py-2 bg-[#ff9900] hover:bg-[#fa8900] text-ink font-bold text-sm rounded-lg transition-colors">
                            Découvrir la boutique
                          </Link>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {orders.slice(0, 3).map(order => {
                            const s = STATUS_CONFIG[order.status] || STATUS_CONFIG['Nouvelle'];
                            const StatusIcon = s.icon;
                            return (
                              <div key={order.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <Package className="w-5 h-5 text-gray-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-ink">#{order.order_number || order.id.slice(0,8)}</p>
                                  <p className="text-xs text-ink/50">{new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-bold text-ink">{order.total.toFixed(2)}€</p>
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>{s.label}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Quick nav cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {sidebarItems.filter(i => i.id !== 'overview').map(item => (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#ff9900] hover:shadow-sm transition-all text-left group"
                        >
                          <item.icon className="w-6 h-6 text-[#ff9900] mb-2" />
                          <p className="text-sm font-semibold text-ink group-hover:text-[#ff9900] transition-colors">{item.label}</p>
                          {item.badge !== undefined && item.badge > 0 && (
                            <p className="text-xs text-ink/50 mt-0.5">{item.badge} article{item.badge > 1 ? 's' : ''}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── ORDERS ── */}
                {activeTab === 'orders' && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                      <h2 className="font-bold text-ink">Mes Commandes</h2>
                      <span className="px-2 py-0.5 bg-[#ff9900] text-white text-xs font-bold rounded-full">{orders.length}</span>
                    </div>
                    {loading ? (
                      <div className="p-6 space-y-4">
                        {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-16 px-6">
                        <ShoppingBag className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                        <p className="font-bold text-ink mb-1">Aucune commande</p>
                        <p className="text-sm text-ink/60 mb-4">Vous n'avez pas encore passé de commande</p>
                        <Link to="/" className="px-6 py-2 bg-[#ff9900] hover:bg-[#fa8900] text-ink font-bold text-sm rounded-lg transition-colors">
                          Commencer mes achats
                        </Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {orders.map(order => {
                          const s = STATUS_CONFIG[order.status] || STATUS_CONFIG['Nouvelle'];
                          const StatusIcon = s.icon;
                          return (
                            <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                  <p className="font-bold text-ink">Commande #{order.order_number || order.id.slice(0,8)}</p>
                                  <p className="text-xs text-ink/50 mt-0.5 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(order.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-ink">{order.total.toFixed(2)}€</p>
                                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {s.label}
                                  </span>
                                </div>
                              </div>
                              {/* Progress steps */}
                              <div className="flex items-center gap-1 mt-3">
                                {['Nouvelle','En préparation','Prête','Livrée'].map((step, i) => {
                                  const steps = ['Nouvelle','En préparation','Prête','Livrée'];
                                  const currentIdx = steps.indexOf(order.status);
                                  const done = i <= currentIdx;
                                  return (
                                    <React.Fragment key={step}>
                                      <div className={`flex items-center gap-1 text-[10px] font-medium ${done ? 'text-[#ff9900]' : 'text-gray-400'}`}>
                                        <div className={`w-2 h-2 rounded-full ${done ? 'bg-[#ff9900]' : 'bg-gray-300'}`} />
                                        <span className="hidden sm:block">{step}</span>
                                      </div>
                                      {i < 3 && <div className={`flex-1 h-0.5 mx-1 ${i < currentIdx ? 'bg-[#ff9900]' : 'bg-gray-200'}`} />}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── WISHLIST ── */}
                {activeTab === 'wishlist' && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                      <h2 className="font-bold text-ink flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        Mes Favoris
                      </h2>
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">{wishlist.length}</span>
                    </div>
                    {wishlist.length === 0 ? (
                      <div className="text-center py-16 px-6">
                        <Heart className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                        <p className="font-bold text-ink mb-1">Aucun favori</p>
                        <p className="text-sm text-ink/60 mb-4">Ajoutez des produits pour les retrouver ici</p>
                        <Link to="/" className="px-6 py-2 bg-[#ff9900] hover:bg-[#fa8900] text-ink font-bold text-sm rounded-lg transition-colors">
                          Découvrir nos produits
                        </Link>
                      </div>
                    ) : (
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {wishlist.map(item => {
                          const product = products.find(p => p.id === item.product_id);
                          if (!product) return null;
                          return (
                            <div key={item.id} className="flex gap-3 p-3 border border-gray-200 rounded-lg hover:border-[#ff9900] transition-colors">
                              <Link to={`/product/${product.id}`} className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              </Link>
                              <div className="flex-1 min-w-0">
                                <Link to={`/product/${product.id}`}>
                                  <p className="font-medium text-sm text-ink hover:text-[#007185] transition-colors line-clamp-2">{product.name}</p>
                                </Link>
                                <p className="text-base font-bold text-[#c7511f] mt-1">{product.price.toFixed(2)}€</p>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => addToCart(product)}
                                    className="px-3 py-1.5 bg-[#ff9900] hover:bg-[#fa8900] text-ink font-bold text-xs rounded-lg transition-colors"
                                  >
                                    Ajouter au panier
                                  </button>
                                  <button
                                    onClick={() => removeFromWishlist(product.id)}
                                    className="px-3 py-1.5 border border-gray-300 text-ink/60 hover:bg-gray-100 text-xs rounded-lg transition-colors"
                                  >
                                    Retirer
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── ADDRESSES ── */}
                {activeTab === 'addresses' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                      <h2 className="font-bold text-ink mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#ff9900]" /> Mes Adresses
                      </h2>
                      <AddressBook />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                      <h3 className="font-bold text-ink mb-4">Informations personnelles</h3>
                      <ProfileInfo />
                    </div>
                  </div>
                )}

                {/* ── LOYALTY ── */}
                {activeTab === 'loyalty' && (
                  <div className="space-y-4">
                    {/* Hero card */}
                    <div className={`bg-gradient-to-br ${tier.color} rounded-lg p-6 text-white shadow-lg`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-white/80 text-sm font-medium">Votre palier</p>
                          <p className="text-3xl font-bold">{tier.current}</p>
                        </div>
                        <Award className="w-16 h-16 text-white/30" />
                      </div>
                      <div className="text-4xl font-bold mb-1">{loyaltyPoints.toLocaleString()}</div>
                      <p className="text-white/80 text-sm mb-4">points disponibles ≈ {(loyaltyPoints/100).toFixed(2)}€</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-white/80">
                          <span>Vers {tier.next}</span>
                          <span>{loyaltyPoints} / {tier.nextPoints} pts</span>
                        </div>
                        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${tier.progress}%` }}
                            transition={{ duration: 1 }}
                            className="h-full bg-white rounded-full"
                          />
                        </div>
                        <p className="text-white/70 text-xs">Encore {tier.nextPoints - loyaltyPoints} pts pour le palier {tier.next}</p>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                      <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-[#ff9900]" /> Vos avantages {tier.current}
                      </h3>
                      <div className="space-y-2">
                        {tier.benefits.map((b, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-ink">{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* How it works */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                      <h3 className="font-bold text-ink mb-4">Comment ça marche ?</h3>
                      <div className="space-y-3">
                        {[
                          { icon: TrendingUp, text: '10 points gagnés pour chaque euro dépensé' },
                          { icon: Gift, text: '100 points = 1€ de réduction' },
                          { icon: Award, text: 'Paliers : Bronze → Silver → Gold → Platinum' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-3 text-sm text-ink/70">
                            <div className="w-8 h-8 rounded-full bg-[#ff9900]/10 flex items-center justify-center flex-shrink-0">
                              <item.icon className="w-4 h-4 text-[#ff9900]" />
                            </div>
                            <p className="pt-1">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SETTINGS ── */}
                {activeTab === 'settings' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                      <h2 className="font-bold text-ink mb-6 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-[#ff9900]" /> Paramètres
                      </h2>
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-xs font-semibold text-ink/60 uppercase tracking-wide mb-1">Email</label>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <Mail className="w-4 h-4 text-ink/40" />
                            <span className="text-sm text-ink">{user.email}</span>
                          </div>
                        </div>
                        {(user as any).phone && (
                          <div>
                            <label className="block text-xs font-semibold text-ink/60 uppercase tracking-wide mb-1">Téléphone</label>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <Phone className="w-4 h-4 text-ink/40" />
                              <span className="text-sm text-ink">{(user as any).phone}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-200 pt-6 space-y-3">
                        <h3 className="font-semibold text-ink mb-3">Notifications</h3>
                        {[
                          { icon: Bell, label: 'Emails promotionnels', desc: 'Offres et nouveautés' },
                          { icon: Package, label: 'Suivi de commandes', desc: 'Mises à jour livraison' },
                          { icon: Shield, label: 'Alertes de sécurité', desc: 'Connexions suspectes' },
                        ].map((pref, i) => (
                          <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                            <div className="flex items-center gap-3">
                              <pref.icon className="w-4 h-4 text-[#ff9900]" />
                              <div>
                                <p className="text-sm font-medium text-ink">{pref.label}</p>
                                <p className="text-xs text-ink/50">{pref.desc}</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked={i === 0} />
                              <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-[#ff9900] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-gray-200 pt-6 mt-6">
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-ink text-sm font-medium rounded-lg transition-colors">
                          <Download className="w-4 h-4" />
                          Télécharger mes données
                        </button>
                      </div>

                      <div className="border-t border-red-200 pt-6 mt-6">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">Zone de danger</p>
                        <button className="px-4 py-2 border-2 border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors">
                          Supprimer mon compte
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
