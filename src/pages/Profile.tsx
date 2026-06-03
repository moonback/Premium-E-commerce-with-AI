import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { 
  User as UserIcon, 
  Package, 
  Star, 
  LogOut, 
  CheckCircle, 
  Clock, 
  Heart,
  MapPin,
  Settings,
  Award,
  CreditCard,
  Bell,
  Shield,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Gift,
  Download
} from 'lucide-react';
import ProfileInfo from '../components/ProfileInfo';
import AddressBook from '../components/AddressBook';
import { supabase } from '../lib/supabase';
import { ORDER_COLUMNS } from '../lib/columns';
import { getErrorMessage } from '../lib/errors';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

type ProfileOrder = {
  id: string;
  status: string;
  order_number?: string | null;
  created_at: string;
  total: number;
};

type TabType = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'loyalty' | 'settings';

export default function Profile() {
  const { 
    user, 
    setUser, 
    loyaltyPoints, 
    wishlist, 
    fetchWishlist, 
    removeFromWishlist, 
    addToCart, 
    products 
  } = useStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ProfileOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const getTierInfo = (points: number) => {
    if (points < 1000) {
      return { 
        current: 'Bronze', 
        next: 'Silver', 
        nextPoints: 1000, 
        progress: (points / 1000) * 100,
        color: 'from-amber-700 to-amber-900',
        benefits: ['5% de réduction', 'Livraison standard gratuite']
      };
    } else if (points < 2500) {
      return { 
        current: 'Silver', 
        next: 'Gold', 
        nextPoints: 2500, 
        progress: ((points - 1000) / 1500) * 100,
        color: 'from-gray-400 to-gray-600',
        benefits: ['10% de réduction', 'Livraison express gratuite', 'Accès ventes privées']
      };
    } else if (points < 5000) {
      return { 
        current: 'Gold', 
        next: 'Platinum', 
        nextPoints: 5000, 
        progress: ((points - 2500) / 2500) * 100,
        color: 'from-yellow-400 to-yellow-600',
        benefits: ['15% de réduction', 'Service client prioritaire', 'Cadeaux exclusifs']
      };
    } else {
      return { 
        current: 'Platinum', 
        next: 'Elite', 
        nextPoints: 10000, 
        progress: Math.min(((points - 5000) / 5000) * 100, 100),
        color: 'from-purple-400 to-purple-600',
        benefits: ['20% de réduction', 'Concierge personnel', 'Événements VIP']
      };
    }
  };
  const tier = getTierInfo(loyaltyPoints);

  const getOrderNextStep = (status: string) => {
    switch (status) {
      case 'Nouvelle':
        return 'Commande reçue, préparation à venir.';
      case 'En préparation':
        return 'Notre équipe prépare votre commande.';
      case 'Prête':
        return 'Commande prête pour retrait ou expédition.';
      case 'Livrée':
      case 'Terminée':
        return 'Commande finalisée. Merci pour votre confiance.';
      default:
        return 'Suivi en cours de mise à jour.';
    }
  };

  useEffect(() => {
    if (user && supabase) {
      const fetchOrders = async () => {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select(ORDER_COLUMNS)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }) as any;
          if (!error && data) {
            setOrders((data ?? []) as ProfileOrder[]);
          }
        } catch (err) {
          console.error('Failed to load orders', getErrorMessage(err));
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [user, fetchWishlist]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    navigate('/');
  };

  if (!user) return null;

  const sidebarItems = [
    { id: 'overview' as TabType, label: 'Vue d\'ensemble', icon: UserIcon },
    { id: 'orders' as TabType, label: 'Mes Commandes', icon: Package, badge: orders.length },
    { id: 'wishlist' as TabType, label: 'Mes Favoris', icon: Heart, badge: wishlist.length },
    { id: 'addresses' as TabType, label: 'Adresses', icon: MapPin },
    { id: 'loyalty' as TabType, label: 'Fidélité', icon: Award },
    { id: 'settings' as TabType, label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="flex-1 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Mobile Menu Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-light font-serif text-ink mb-2">Mon Compte</h1>
            <p className="text-ink/60">Gérez vos informations et vos préférences</p>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-3 rounded-xl bg-white border border-ink/10 hover:border-ink/20 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <svg className="w-6 h-6 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white border border-ink/10 rounded-2xl p-6 sticky top-24">
              {/* User Info */}
              <div className="text-center mb-6 pb-6 border-b border-ink/10">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-white text-2xl font-bold">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-serif text-lg text-ink mb-1">{user.email.split('@')[0]}</h3>
                <p className="text-xs text-ink/50 truncate">{user.email}</p>
                <div className={`inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${tier.color} text-white`}>
                  {tier.current}
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                      activeTab === item.id
                        ? 'bg-ink text-white'
                        : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span className="text-xs">{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activeTab === item.id ? 'bg-white/20' : 'bg-accent text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full mt-6 pt-6 border-t border-ink/10 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </aside>

          {/* Mobile Sidebar */}
          <AnimatePresence>
            {isMobileSidebarOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-40 lg:hidden"
                />
                
                {/* Sidebar */}
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 lg:hidden overflow-y-auto"
                >
                  <div className="p-6">
                    {/* Close Button */}
                    <button
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="absolute top-4 right-4 p-2 text-ink/60 hover:text-ink transition-colors"
                      aria-label="Fermer le menu"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* User Info */}
                    <div className="text-center mb-6 pb-6 border-b border-ink/10 mt-8">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-white text-2xl font-bold">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="font-serif text-lg text-ink mb-1">{user.email.split('@')[0]}</h3>
                      <p className="text-xs text-ink/50 truncate px-4">{user.email}</p>
                      <div className={`inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${tier.color} text-white`}>
                        {tier.current}
                      </div>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2">
                      {sidebarItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                            activeTab === item.id
                              ? 'bg-ink text-white'
                              : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" />
                            <span className="text-xs">{item.label}</span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              activeTab === item.id ? 'bg-white/20' : 'bg-accent text-white'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </nav>

                    {/* Logout */}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileSidebarOpen(false);
                      }}
                      className="w-full mt-6 pt-6 border-t border-ink/10 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-red-600 hover:text-red-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-ink/10 rounded-2xl p-8">
                      <h2 className="text-2xl font-serif text-ink mb-6">Tableau de bord</h2>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20">
                          <Package className="w-8 h-8 text-accent mb-3" />
                          <p className="text-3xl font-bold text-ink mb-1">{orders.length}</p>
                          <p className="text-xs uppercase tracking-wider text-ink/60 font-bold">Commandes</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-pink-500/10 to-pink-500/5 rounded-xl border border-pink-500/20">
                          <Heart className="w-8 h-8 text-pink-500 mb-3" />
                          <p className="text-3xl font-bold text-ink mb-1">{wishlist.length}</p>
                          <p className="text-xs uppercase tracking-wider text-ink/60 font-bold">Favoris</p>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
                          <Award className="w-8 h-8 text-purple-500 mb-3" />
                          <p className="text-3xl font-bold text-ink mb-1">{loyaltyPoints}</p>
                          <p className="text-xs uppercase tracking-wider text-ink/60 font-bold">Points</p>
                        </div>
                      </div>

                      {/* Recent Orders */}
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold uppercase tracking-wider text-ink">Commandes récentes</h3>
                          <button 
                            onClick={() => setActiveTab('orders')}
                            className="text-xs font-bold uppercase tracking-wider text-accent hover:text-accent/80 flex items-center gap-1"
                          >
                            Voir tout
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        {orders.length === 0 ? (
                          <div className="text-center py-12 border-2 border-dashed border-ink/10 rounded-xl">
                            <Package className="w-12 h-12 text-ink/20 mx-auto mb-3" />
                            <p className="text-sm text-ink/60">Aucune commande pour le moment</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {orders.slice(0, 3).map(order => (
                              <div key={order.id} className="flex items-center justify-between p-4 border border-ink/10 rounded-xl hover:border-ink/20 transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-full bg-soft-green flex items-center justify-center">
                                    <Package className="w-5 h-5 text-ink" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-ink">#{order.order_number || order.id.slice(0, 8)}</p>
                                    <p className="text-xs text-ink/60">{new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-ink">{order.total.toFixed(2)}€</p>
                                  <span className="text-[10px] uppercase font-bold text-accent">{order.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div>
                        <h3 className="text-lg font-bold uppercase tracking-wider text-ink mb-4">Actions rapides</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => setActiveTab('wishlist')}
                            className="p-4 border border-ink/10 rounded-xl hover:border-ink/20 hover:bg-ink/5 transition-all text-left group"
                          >
                            <Heart className="w-5 h-5 text-ink/60 group-hover:text-accent mb-2 transition-colors" />
                            <p className="text-xs font-bold uppercase tracking-wider text-ink">Mes Favoris</p>
                          </button>
                          <button 
                            onClick={() => setActiveTab('loyalty')}
                            className="p-4 border border-ink/10 rounded-xl hover:border-ink/20 hover:bg-ink/5 transition-all text-left group"
                          >
                            <Award className="w-5 h-5 text-ink/60 group-hover:text-purple-500 mb-2 transition-colors" />
                            <p className="text-xs font-bold uppercase tracking-wider text-ink">Programme Fidélité</p>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div className="bg-white border border-ink/10 rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-serif text-ink">Mes Commandes</h2>
                      <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider rounded-full">
                        {orders.length} commande{orders.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-32 bg-ink/5 rounded-xl animate-pulse"></div>
                        ))}
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-20 border-2 border-dashed border-ink/10 rounded-xl">
                        <Package className="w-16 h-16 text-ink/20 mx-auto mb-4" />
                        <p className="text-lg font-bold uppercase tracking-wider text-ink/40 mb-2">Aucune commande</p>
                        <p className="text-sm text-ink/60 mb-6">Vous n'avez pas encore passé de commande</p>
                        <button 
                          onClick={() => navigate('/')}
                          className="px-6 py-3 bg-ink text-white text-xs font-bold uppercase tracking-wider hover:bg-ink/90 transition-colors"
                        >
                          Découvrir la boutique
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map(order => (
                          <div key={order.id} className="border border-ink/10 rounded-xl p-6 hover:border-ink/20 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-soft-green flex items-center justify-center">
                                  <Package className="w-7 h-7 text-ink" />
                                </div>
                                <div>
                                  <p className="text-lg font-bold text-ink mb-1">
                                    Commande #{order.order_number || order.id.slice(0, 8)}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-ink/60">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(order.created_at).toLocaleDateString('fr-FR', { 
                                        day: 'numeric', 
                                        month: 'long', 
                                        year: 'numeric' 
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-ink">{order.total.toFixed(2)}€</p>
                                  <p className="text-xs text-ink/60">TTC</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-ink/10">
                              <div className="flex items-center gap-2">
                                {order.status === 'Livrée' || order.status === 'Terminée' ? (
                                  <span className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full">
                                    <CheckCircle className="w-4 h-4" />
                                    {order.status}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider rounded-full">
                                    <Clock className="w-4 h-4" />
                                    {order.status}
                                  </span>
                                )}
                              </div>
                              <button className="text-xs font-bold uppercase tracking-wider text-ink/60 hover:text-ink flex items-center gap-1">
                                Détails
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <p className="text-xs text-ink/50 italic mt-3">{getOrderNextStep(order.status)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Wishlist Tab */}
                {activeTab === 'wishlist' && (
                  <div className="bg-white border border-ink/10 rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-serif text-ink flex items-center gap-3">
                        <Heart className="w-7 h-7 text-pink-500" />
                        Mes Favoris
                      </h2>
                      <span className="px-3 py-1 bg-pink-500/10 text-pink-500 text-xs font-bold uppercase tracking-wider rounded-full">
                        {wishlist.length} article{wishlist.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {wishlist.length === 0 ? (
                      <div className="text-center py-20 border-2 border-dashed border-ink/10 rounded-xl">
                        <Heart className="w-16 h-16 text-ink/20 mx-auto mb-4" />
                        <p className="text-lg font-bold uppercase tracking-wider text-ink/40 mb-2">Aucun favori</p>
                        <p className="text-sm text-ink/60 mb-6">Ajoutez des produits à vos favoris pour les retrouver facilement</p>
                        <button 
                          onClick={() => navigate('/')}
                          className="px-6 py-3 bg-ink text-white text-xs font-bold uppercase tracking-wider hover:bg-ink/90 transition-colors"
                        >
                          Découvrir nos produits
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {wishlist.map(item => {
                          const product = products.find(p => p.id === item.product_id);
                          if (!product) return null;
                          
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="group border border-ink/10 rounded-xl overflow-hidden hover:border-ink/20 hover:shadow-lg transition-all"
                            >
                              <div className="relative aspect-square bg-soft-green overflow-hidden">
                                <img 
                                  src={product.image} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <button
                                  onClick={() => removeFromWishlist(product.id)}
                                  className="absolute top-4 right-4 p-2 rounded-full bg-white/90 backdrop-blur-sm text-pink-500 hover:bg-pink-500 hover:text-white transition-colors shadow-lg"
                                >
                                  <Heart className="w-4 h-4 fill-current" />
                                </button>
                              </div>
                              <div className="p-6">
                                <h3 className="font-serif text-xl text-ink mb-2 group-hover:text-accent transition-colors">
                                  {product.name}
                                </h3>
                                <p className="text-sm text-ink/60 mb-4 line-clamp-2">{product.description}</p>
                                <div className="flex items-center justify-between">
                                  <p className="text-2xl font-bold text-ink">{product.price.toFixed(2)}€</p>
                                  <button
                                    onClick={() => addToCart(product)}
                                    className="px-4 py-2 bg-ink text-white text-xs font-bold uppercase tracking-wider hover:bg-ink/90 transition-colors rounded-lg"
                                  >
                                    Ajouter au panier
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Addresses Tab */}
                {activeTab === 'addresses' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-ink/10 rounded-2xl p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-serif text-ink flex items-center gap-3">
                          <MapPin className="w-7 h-7 text-accent" />
                          Mes Adresses
                        </h2>
                      </div>
                      <AddressBook />
                    </div>
                    
                    <div className="bg-white border border-ink/10 rounded-2xl p-8">
                      <h3 className="text-lg font-bold uppercase tracking-wider text-ink mb-4">Informations personnelles</h3>
                      <ProfileInfo />
                    </div>
                  </div>
                )}

                {/* Loyalty Tab */}
                {activeTab === 'loyalty' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-ink/10 rounded-2xl p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-accent/5 to-transparent rounded-full -mr-32 -mt-32"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                          <h2 className="text-2xl font-serif text-ink flex items-center gap-3">
                            <Award className="w-7 h-7 text-purple-500" />
                            Programme de Fidélité
                          </h2>
                          <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${tier.color} text-white text-sm font-bold uppercase tracking-wider shadow-lg`}>
                            Palier {tier.current}
                          </div>
                        </div>

                        {/* Points Display */}
                        <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-8 mb-8 border border-accent/20">
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <p className="text-sm uppercase tracking-wider text-ink/60 font-bold mb-2">Vos points</p>
                              <p className="text-5xl font-bold text-ink">{loyaltyPoints.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm uppercase tracking-wider text-ink/60 font-bold mb-2">Valeur</p>
                              <p className="text-3xl font-bold text-accent">{(loyaltyPoints / 100).toFixed(2)}€</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-ink/60">
                              <span>Progression vers {tier.next}</span>
                              <span>{loyaltyPoints} / {tier.nextPoints} pts</span>
                            </div>
                            <div className="h-3 w-full bg-white rounded-full overflow-hidden shadow-inner">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${tier.progress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full"
                              />
                            </div>
                            <p className="text-xs text-ink/50 italic">
                              Plus que {tier.nextPoints - loyaltyPoints} points pour atteindre le palier {tier.next}
                            </p>
                          </div>
                        </div>

                        {/* Benefits */}
                        <div className="mb-8">
                          <h3 className="text-lg font-bold uppercase tracking-wider text-ink mb-4 flex items-center gap-2">
                            <Gift className="w-5 h-5" />
                            Vos avantages {tier.current}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {tier.benefits.map((benefit, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-4 bg-soft-green rounded-xl">
                                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                                <p className="text-sm text-ink">{benefit}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* How it works */}
                        <div className="bg-ink/5 rounded-xl p-6">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-ink mb-4">Comment ça marche ?</h3>
                          <div className="space-y-3 text-sm text-ink/70">
                            <div className="flex items-start gap-3">
                              <TrendingUp className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                              <p>Gagnez <strong>10 points</strong> pour chaque euro dépensé</p>
                            </div>
                            <div className="flex items-start gap-3">
                              <Gift className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                              <p><strong>100 points = 1€</strong> de réduction sur vos achats</p>
                            </div>
                            <div className="flex items-start gap-3">
                              <Award className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                              <p>Débloquez des <strong>avantages exclusifs</strong> en montant de palier</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-ink/10 rounded-2xl p-8">
                      <h2 className="text-2xl font-serif text-ink mb-6 flex items-center gap-3">
                        <Settings className="w-7 h-7 text-ink" />
                        Paramètres du compte
                      </h2>

                      {/* Account Info */}
                      <div className="space-y-6 mb-8">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-2">
                            Email
                          </label>
                          <div className="flex items-center gap-3 p-4 bg-ink/5 rounded-xl">
                            <Mail className="w-5 h-5 text-ink/40" />
                            <span className="text-sm text-ink">{user.email}</span>
                          </div>
                        </div>

                        {user.phone && (
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-2">
                              Téléphone
                            </label>
                            <div className="flex items-center gap-3 p-4 bg-ink/5 rounded-xl">
                              <Phone className="w-5 h-5 text-ink/40" />
                              <span className="text-sm text-ink">{user.phone}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Preferences */}
                      <div className="border-t border-ink/10 pt-8">
                        <h3 className="text-lg font-bold uppercase tracking-wider text-ink mb-6">Préférences</h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border border-ink/10 rounded-xl hover:border-ink/20 transition-colors">
                            <div className="flex items-center gap-3">
                              <Bell className="w-5 h-5 text-ink/60" />
                              <div>
                                <p className="text-sm font-bold text-ink">Notifications par email</p>
                                <p className="text-xs text-ink/60">Recevoir les offres et nouveautés</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-ink/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between p-4 border border-ink/10 rounded-xl hover:border-ink/20 transition-colors">
                            <div className="flex items-center gap-3">
                              <CreditCard className="w-5 h-5 text-ink/60" />
                              <div>
                                <p className="text-sm font-bold text-ink">Enregistrer les moyens de paiement</p>
                                <p className="text-xs text-ink/60">Pour un paiement plus rapide</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" />
                              <div className="w-11 h-6 bg-ink/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between p-4 border border-ink/10 rounded-xl hover:border-ink/20 transition-colors">
                            <div className="flex items-center gap-3">
                              <Shield className="w-5 h-5 text-ink/60" />
                              <div>
                                <p className="text-sm font-bold text-ink">Authentification à deux facteurs</p>
                                <p className="text-xs text-ink/60">Sécurité renforcée</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" />
                              <div className="w-11 h-6 bg-ink/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Data Export */}
                      <div className="border-t border-ink/10 pt-8 mt-8">
                        <h3 className="text-lg font-bold uppercase tracking-wider text-ink mb-4">Données personnelles</h3>
                        <button className="flex items-center gap-2 px-4 py-3 border border-ink/20 text-ink hover:bg-ink/5 transition-colors rounded-xl text-sm font-bold uppercase tracking-wider">
                          <Download className="w-4 h-4" />
                          Télécharger mes données
                        </button>
                      </div>

                      {/* Danger Zone */}
                      <div className="border-t border-red-200 pt-8 mt-8">
                        <h3 className="text-lg font-bold uppercase tracking-wider text-red-600 mb-4">Zone dangereuse</h3>
                        <button className="px-4 py-3 border-2 border-red-600 text-red-600 hover:bg-red-50 transition-colors rounded-xl text-sm font-bold uppercase tracking-wider">
                          Supprimer mon compte
                        </button>
                        <p className="text-xs text-ink/50 mt-2">Cette action est irréversible</p>
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
