import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';

// Define the Kanban stages in order
const STAGES = [
  'Nouvelle',
  'En préparation',
  'Prête',
  'Livrée',
] as const;

type OrderStage = typeof STAGES[number];

type KitchenOrder = {
  id: string;
  status: string;
  order_number?: string | null;
  created_at?: string;
};

export default function KitchenOrders() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const updateOrderStatus = useStore(state => state.updateOrderStatus);

  // Fetch orders from Supabase
  const fetchOrders = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      setOrders((data ?? []) as KitchenOrder[]);
    } catch (e) {
      console.error('Failed to load kitchen orders', e);
    }
  };

  useEffect(() => {
    if (!supabase) return;

    fetchOrders();
    // Subscribe to realtime changes (optional)
    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Determine next status
  const isOrderStage = (status: string): status is OrderStage =>
    STAGES.includes(status as OrderStage);

  const getNextStatus = (current: string) => {
    if (!isOrderStage(current)) return null;
    const idx = STAGES.indexOf(current);
    if (idx >= 0 && idx < STAGES.length - 1) {
      return STAGES[idx + 1];
    }
    return null;
  };

  const handleAdvance = async (orderId: string, currentStatus: string) => {
    const next = getNextStatus(currentStatus);
    if (!next) return;
    await updateOrderStatus(orderId, next);
    // Refresh order list
    fetchOrders();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {STAGES.map(stage => (
        <div key={stage} className="border border-ink/10 rounded p-3 bg-white/80 backdrop-blur-sm">
          <h3 className="font-serif text-sm uppercase mb-2 flex items-center gap-1">
            {stage === 'Nouvelle' && <Clock className="w-4 h-4" />}
            {stage === 'En préparation' && <Clock className="w-4 h-4" />}
            {stage === 'Prête' && <CheckCircle className="w-4 h-4" />}
            {stage === 'Livrée' && <CheckCircle className="w-4 h-4" />}
            {stage}
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {orders
              .filter(o => o.status === stage)
              .map(order => (
                <div key={order.id} className="flex items-center justify-between bg-soft-green/30 p-2 rounded">
                  <span className="text-xs font-mono">#{order.order_number || order.id.slice(0, 8)}</span>
                  <button
                    className="text-ink text-xs underline"
                    onClick={() => handleAdvance(order.id, order.status)}
                    disabled={!getNextStatus(order.status)}
                  >
                    {getNextStatus(order.status) ? (
                      <span className="flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        {getNextStatus(order.status)}
                      </span>
                    ) : (
                      '✓'
                    )}
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
