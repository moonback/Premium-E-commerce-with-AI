import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { User as UserIcon, Package, Star, LogOut, CheckCircle, Clock, Heart } from 'lucide-react';
import ProfileInfo from '../components/ProfileInfo';
import AddressBook from '../components/AddressBook';
import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../lib/errors';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Product } from '../types';

type ProfileOrder = {
  id: string;
  status: string;
  order_number?: string | null;
  created_at: string;
  total: number;
};

export default function Profile() {
  const { user, setUser, loyaltyPoints, wishlist, fetchWishlist, removeFromWishlist, addToCart, products } = useStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ProfileOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist'>('orders');

  const getTierInfo = (points: number) => {
    if (points < 1000) {
      return { current: 'Bronze', next: 'Silver', nextPoints: 1000, progress: (points / 1000) * 100 };
    } else if (points < 2500) {
      return { current: 'Silver', next: 'Gold', nextPoints: 2500, progress: ((points - 1000) / 1500) * 100 };
    } else if (points < 5000) {
      return { current: 'Gold', next: 'Platinum', nextPoints: 5000, progress: ((points - 2500) / 2500) * 100 };
    } else {
      return { current: 'Platinum', next: 'Elite', nextPoints: 10000, progress: Math.min(((points - 5000) / 5000) * 100, 100) };
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
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
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

  return (
    <div className="flex-1 bg-bg px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-light font-serif text-ink mb-12">Mon Compte</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Menu / Recap Sidebar */}
          <div className="col-span-1 flex flex-col gap-6">
            <div className="p-8 border border-ink/10 bg-transparent">
              <div className="w-12 h-12 bg-soft-green rounded-full flex items-center justify-center mb-4">
                <UserIcon className="w-5 h-5 text-ink" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink/40 mb-1">Connecté en tant que</p>
              <p className="text-lg font-serif mb-6">{user.email}</p>
 
              <div className="h-px w-full bg-ink/10 mb-6" />
 
              <div className="flex flex-col gap-3 text-xs uppercase tracking-widest font-bold">
                <button className="flex items-center gap-3 text-ink hover:text-ink/60 transition-colors text-left" disabled>
                  <Package className="w-4 h-4" /> Mes Commandes
                </button>
                <button onClick={handleLogout} className="flex items-center gap-3 text-red-600 hover:text-red-400 transition-colors text-left mt-4 pt-4 border-t border-ink/10 cursor-pointer">
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
              </div>
            </div>

            <div className="p-8 border border-ink/10 bg-transparent relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Star className="w-32 h-32" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink/40 mb-4 relative z-10">Programme de Fidélité</p>
              <div className="flex items-baseline gap-2 mb-2 relative z-10">
                <span className="text-4xl font-serif">{loyaltyPoints.toLocaleString()}</span>
                <span className="text-xs font-bold uppercase tracking-widest opacity-50">Points</span>
              </div>
              
              {/* Animated progress gauge */}
              <div className="mt-4 mb-4 relative z-10 space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-ink/50">
                  <span>Palier {tier.current}</span>
                  <span>Prochain : {tier.next}</span>
                </div>
                <div className="h-1.5 w-full bg-ink/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${tier.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-accent rounded-full"
                  />
                </div>
                <p className="text-[9px] text-ink/40 font-bold uppercase tracking-wider text-right">
                  {loyaltyPoints} / {tier.nextPoints} PTS
                </p>
              </div>

              <p className="text-xs italic text-ink/60 relative z-10">100 points = 1€ de remise. Avantages exclusifs débloqués.</p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-2">
            <ProfileInfo />
            <AddressBook />
            
            {/* Tabs for Orders and Wishlist */}
            <div className="mt-6 mb-4 flex gap-4 border-b border-ink/10">
              <button
                onClick={() => setActiveTab('orders')}
                className={`pb-3 px-2 text-sm font-bold uppercase tracking-widest transition-colors ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-ink text-ink'
                    : 'text-ink/40 hover:text-ink/60'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Commandes
              </button>
              <button
                onClick={() => setActiveTab('wishlist')}
                className={`pb-3 px-2 text-sm font-bold uppercase tracking-widest transition-colors ${
                  activeTab === 'wishlist'
                    ? 'border-b-2 border-ink text-ink'
                    : 'text-ink/40 hover:text-ink/60'
                }`}
              >
                <Heart className="w-4 h-4 inline mr-2" />
                Favoris ({wishlist.length})
              </button>
            </div>

            {activeTab === 'orders' && (
              <div className="p-8 border border-ink/10 bg-transparent min-h-[400px]">
                <h2 className="text-2xl font-serif mb-6 flex items-center gap-2">
                  Historique des commandes
                </h2>

                {loading ? (
                  <div className="animate-pulse flex flex-col gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 bg-ink/5 w-full"></div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed border-ink/10">
                    <Package className="w-8 h-8 text-ink/20 mb-4" />
                    <p className="text-sm uppercase tracking-widest font-bold text-ink/40 mb-2">Aucune commande</p>
                    <p className="text-xs text-ink/60 italic max-w-sm">
                      Vous n'avez pas encore passé de commande. Découvrez notre sélection d'articles exclusifs.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {orders.map(order => (
                      <div key={order.id} className="border border-ink/10 p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-ink/20 transition-colors">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest">Commande #{order.order_number || order.id.slice(0, 8)}</span>
                            {order.status === 'Nouvelle' ? (
                               <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-ink py-1 px-2 border border-ink/20 bg-soft-green">
                                 <Clock className="w-3 h-3" /> Nouvelle
                               </span>
                             ) : order.status === 'En préparation' ? (
                               <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-ink py-1 px-2 border border-ink/20 bg-soft-green">
                                 <Clock className="w-3 h-3" /> En préparation
                               </span>
                             ) : order.status === 'Prête' ? (
                               <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-soft-green py-1 px-2 border border-ink/20 bg-ink">
                                 <CheckCircle className="w-3 h-3" /> Prête
                               </span>
                             ) : order.status === 'Livrée' ? (
                               <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-soft-green py-1 px-2 border border-ink/20 bg-ink">
                                 <CheckCircle className="w-3 h-3" /> Livrée
                               </span>
                             ) : (
                               <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-ink py-1 px-2 border border-ink/20 bg-soft-green">
                                 <Clock className="w-3 h-3" /> {order.status}
                               </span>
                             )}
                          </div>
                          <p className="text-xs text-ink/60 italic">Passée le {new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                          <p className="text-xs text-ink/50 mt-1">{getOrderNextStep(order.status)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-serif font-bold">{order.total.toFixed(2)}€</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="p-8 border border-ink/10 bg-transparent min-h-[400px]">
                <h2 className="text-2xl font-serif mb-6 flex items-center gap-2">
                  <Heart className="w-6 h-6" />
                  Mes Favoris
                </h2>

                {wishlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed border-ink/10">
                    <Heart className="w-8 h-8 text-ink/20 mb-4" />
                    <p className="text-sm uppercase tracking-widest font-bold text-ink/40 mb-2">Aucun favori</p>
                    <p className="text-xs text-ink/60 italic max-w-sm">
                      Ajoutez des produits à vos favoris pour les retrouver facilement.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlist.map(item => {
                      const product = products.find(p => p.id === item.product_id);
                      if (!product) return null;
                      
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="border border-ink/10 p-4 flex gap-4 hover:border-ink/20 transition-colors group"
                        >
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-serif text-base text-ink truncate">{product.name}</h3>
                            <p className="text-sm font-semibold text-ink/80 mt-1">{product.price.toFixed(2)}€</p>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => {
                                  addToCart(product);
                                }}
                                className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 bg-ink text-bg hover:bg-ink/90 transition-colors"
                              >
                                Ajouter
                              </button>
                              <button
                                onClick={() => removeFromWishlist(product.id)}
                                className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 border border-ink/20 text-ink hover:bg-ink/5 transition-colors"
                              >
                                Retirer
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
          </div>
        </div>
      </div>
    </div>
  );
}
