import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, User, Package, ShoppingCart, Settings, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AUDIT_EVENT_COLUMNS } from '../lib/columns';

type AuditEvent = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before: any;
  after: any;
  created_at: string;
  profiles?: {
    email: string;
  };
};

export default function AdminActivityLog() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'orders' | 'products' | 'users'>('all');

  useEffect(() => {
    fetchEvents();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('audit_events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_events' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('audit_events')
        .select(`${AUDIT_EVENT_COLUMNS}, profiles(email)`)
        .order('created_at', { ascending: false })
        .limit(100) as any;

      if (filter !== 'all') {
        query = query.eq('entity_type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (entityType: string) => {
    switch (entityType) {
      case 'orders': return <ShoppingCart className="w-4 h-4" />;
      case 'products': return <Package className="w-4 h-4" />;
      case 'users': return <User className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'text-green-600 bg-green-50 border-green-200';
      case 'UPDATE': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'DELETE': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-ink/60 bg-ink/5 border-ink/10';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'INSERT': return 'Création';
      case 'UPDATE': return 'Modification';
      case 'DELETE': return 'Suppression';
      default: return action;
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-ink/50">Chargement du journal...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'orders', 'products', 'users'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${
              filter === f
                ? 'bg-ink text-white'
                : 'bg-transparent border border-ink/10 text-ink/60 hover:bg-soft-green'
            }`}
          >
            {f === 'all' ? 'Tout' : f === 'orders' ? 'Commandes' : f === 'products' ? 'Produits' : 'Utilisateurs'}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="bg-transparent border border-ink/10">
        <div className="p-4 border-b border-ink/10 bg-soft-green/20">
          <h3 className="text-lg font-serif flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Journal d'Activité
          </h3>
        </div>
        <div className="divide-y divide-ink/10 max-h-[600px] overflow-y-auto">
          {events.length === 0 ? (
            <div className="p-8 text-center text-ink/50">Aucune activité récente</div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="p-4 hover:bg-ink/5 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getActionIcon(event.entity_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-bold uppercase tracking-widest border ${getActionColor(event.action)}`}>
                        {getActionLabel(event.action)}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-ink/50">
                        {event.entity_type}
                      </span>
                    </div>
                    <p className="text-sm text-ink/80 mb-2">
                      {event.profiles?.email || 'Système'} a {getActionLabel(event.action).toLowerCase()} 
                      {event.entity_id && ` l'élément ${event.entity_id.slice(0, 8)}`}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-ink/50">
                      <Clock className="w-3 h-3" />
                      {format(new Date(event.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
