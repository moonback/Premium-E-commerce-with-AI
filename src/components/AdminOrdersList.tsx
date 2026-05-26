import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Edit2, Trash2, CheckCircle, Clock, Truck, Package, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

type Order = {
  id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
  profiles?: {
    email: string;
    phone: string;
  };
};

export default function AdminOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(email, phone)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
      toast.success('Statut mis à jour');
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteOrder = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette commande ?')) return;
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      toast.success('Commande supprimée');
    } catch (err) {
      console.error('Error deleting order:', err);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Nouvelle': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'En préparation': return <Package className="w-4 h-4 text-orange-500" />;
      case 'Prête': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Livrée': return <Truck className="w-4 h-4 text-purple-500" />;
      case 'Terminée': return <CheckCircle className="w-4 h-4 text-ink" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) return <div className="p-8 text-center text-ink/50">Chargement des commandes...</div>;

  return (
    <div className="bg-transparent border border-ink/10 overflow-hidden">
      <div className="p-4 border-b border-ink/10 flex justify-between items-center bg-soft-green/20">
        <h3 className="text-lg font-serif">Gestion des Commandes (CRUD)</h3>
        <button onClick={fetchOrders} className="text-xs font-bold uppercase tracking-widest text-ink/60 hover:text-ink">
          Rafraîchir
        </button>
      </div>
      <table className="w-full text-sm text-left">
        <thead className="bg-soft-green/10 text-ink/50 uppercase text-xs">
          <tr>
            <th className="px-6 py-3 font-bold tracking-widest">ID / Date</th>
            <th className="px-6 py-3 font-bold tracking-widest">Client</th>
            <th className="px-6 py-3 font-bold tracking-widest">Total</th>
            <th className="px-6 py-3 font-bold tracking-widest">Statut</th>
            <th className="px-6 py-3 text-right font-bold tracking-widest">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-ink/5 transition-colors">
              <td className="px-6 py-4">
                <div className="font-mono text-xs text-ink/60">{order.id.slice(0, 8)}...</div>
                <div className="text-xs">{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</div>
              </td>
              <td className="px-6 py-4">
                <div className="font-bold">{order.profiles?.email || 'Client Anonyme'}</div>
                <div className="text-xs text-ink/60">{order.profiles?.phone || ''}</div>
              </td>
              <td className="px-6 py-4 font-serif">{order.total.toFixed(2)} €</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="bg-transparent text-sm border-none focus:ring-0 cursor-pointer"
                  >
                    <option value="Nouvelle">Nouvelle</option>
                    <option value="En préparation">En préparation</option>
                    <option value="Prête">Prête</option>
                    <option value="Livrée">Livrée</option>
                    <option value="Terminée">Terminée</option>
                  </select>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => deleteOrder(order.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                  title="Supprimer la commande"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-ink/50 font-serif">
                Aucune commande trouvée.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
