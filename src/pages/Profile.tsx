import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { User as UserIcon, Package, Star, LogOut, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, setUser, loyaltyPoints } = useStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
            setOrders(data);
          }
        } catch (err) {
            console.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
      };
      fetchOrders();
    } else {
        setLoading(false);
    }
  }, [user]);

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
                <button onClick={handleLogout} className="flex items-center gap-3 text-red-600 hover:text-red-400 transition-colors text-left mt-4 pt-4 border-t border-ink/10">
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
              </div>
            </div>
            
            <div className="p-8 border border-ink/10 bg-transparent relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Star className="w-32 h-32" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink/40 mb-4 relative z-10">Programme Véridian Céleste</p>
              <div className="flex items-baseline gap-2 mb-2 relative z-10">
                <span className="text-4xl font-serif">{loyaltyPoints.toLocaleString()}</span>
                <span className="text-xs font-bold uppercase tracking-widest opacity-50">Points</span>
              </div>
              <p className="text-xs italic text-ink/60 relative z-10">100 points = 1€ de remise. Avantages exclusifs débloqués.</p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-1 md:col-span-2">
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
                    Vous n'avez pas encore passé de commande. Découvrez notre sélection de pâtisseries trompe-l'œil.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {orders.map(order => (
                    <div key={order.id} className="border border-ink/10 p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-ink/20 transition-colors">
                       <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest">Commande #{order.id.slice(0,8)}</span>
                            {order.status === 'Terminée' ? (
                               <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-soft-green py-1 px-2 bg-ink"><CheckCircle className="w-3 h-3"/> Terminée</span>
                            ) : (
                               <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-ink py-1 px-2 border border-ink/20 bg-soft-green"><Clock className="w-3 h-3"/> En préparation</span>
                            )}
                          </div>
                          <p className="text-xs text-ink/60 italic">Passée le {new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-xl font-serif font-bold">{order.total.toFixed(2)}€</p>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
