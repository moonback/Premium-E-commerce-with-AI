import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Mail, Phone, MapPin, ShoppingBag, Calendar, X, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserRole } from '../types';
import { PROFILE_COLUMNS_ADMIN } from '../lib/columns';

type Customer = {
  id: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  created_at: string;
  order_count?: number;
  total_spent?: number;
};

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; border: string }> = {
  admin:    { label: 'Admin',    color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200'     },
  staff:    { label: 'Staff',    color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  kiosk:    { label: 'Kiosque',  color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200'  },
  customer: { label: 'Client',   color: 'text-ink/60',      bg: 'bg-ink/5',      border: 'border-ink/15'      },
};

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.customer;
  return (
    <span className={`text-[10px] uppercase tracking-[0.15em] font-bold px-2 py-0.5 border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function Avatar({ email }: { email: string }) {
  return (
    <div className="w-9 h-9 bg-soft-green flex items-center justify-center shrink-0 text-sm font-bold text-ink/60 uppercase">
      {email.charAt(0)}
    </div>
  );
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const [{ data: profiles }, { data: orderStats }] = await Promise.all([
        supabase.from('profiles').select(PROFILE_COLUMNS_ADMIN).order('created_at', { ascending: false }) as any,
        supabase.from('orders').select('user_id, total') as any,
      ]);

      const statsMap: Record<string, { count: number; total: number }> = {};
      orderStats?.forEach(o => {
        if (!statsMap[o.user_id]) statsMap[o.user_id] = { count: 0, total: 0 };
        statsMap[o.user_id].count += 1;
        statsMap[o.user_id].total += o.total || 0;
      });

      setCustomers(
        (profiles ?? []).map(p => ({
          ...p,
          order_count: statsMap[p.id]?.count ?? 0,
          total_spent: statsMap[p.id]?.total ?? 0,
        }))
      );
    } catch {
      toast.error('Erreur chargement clients');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id: string, role: UserRole) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
      if (error) throw error;
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, role } : c));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, role } : null);
      toast.success('Rôle mis à jour');
    } catch {
      toast.error('Erreur mise à jour rôle');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!window.confirm('Supprimer ce client ? Action irréversible.')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setCustomers(prev => prev.filter(c => c.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success('Client supprimé');
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const filtered = customers.filter(c => {
    const matchRole = roleFilter === 'all' || c.role === roleFilter;
    const term = search.toLowerCase();
    const matchSearch = !term ||
      c.email.toLowerCase().includes(term) ||
      (c.phone ?? '').toLowerCase().includes(term) ||
      (c.city ?? '').toLowerCase().includes(term);
    return matchRole && matchSearch;
  });

  const totalRevenue = customers.reduce((s, c) => s + (c.total_spent ?? 0), 0);
  const activeCount = customers.filter(c => (c.order_count ?? 0) > 0).length;
  const avgBasket = activeCount > 0 ? totalRevenue / activeCount : 0;

  return (
    <div className="space-y-6">
      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total clients',  value: customers.length },
          { label: 'Clients actifs', value: activeCount },
          { label: 'Revenu total',   value: `${totalRevenue.toFixed(2)} €` },
          { label: 'Panier moyen',   value: `${avgBasket.toFixed(2)} €` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-ink/10 p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-ink/40 mb-1">{label}</p>
            <p className="text-2xl font-serif font-light text-ink">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/30" />
          <input
            type="text"
            placeholder="Email, téléphone, ville..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2.5 border border-ink/15 text-sm focus:outline-none focus:border-ink/40 bg-white"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="appearance-none pl-3 pr-8 py-2.5 border border-ink/15 text-sm focus:outline-none focus:border-ink/40 bg-white text-ink"
          >
            <option value="all">Tous les rôles</option>
            <option value="customer">Clients</option>
            <option value="staff">Staff</option>
            <option value="admin">Admins</option>
            <option value="kiosk">Kiosques</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/30 pointer-events-none" />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-ink/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/[0.02]">
                {['Client', 'Contact', 'Rôle', 'Commandes', 'Dépensé', 'Inscrit', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-ink/40 font-bold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {loading && filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-ink/30 text-sm">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-ink/30 text-sm">Aucun client trouvé</td></tr>
              ) : (
                filtered.map(c => (
                  <tr
                    key={c.id}
                    className="hover:bg-ink/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelected(c)}
                  >
                    {/* Client */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar email={c.email} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink truncate max-w-[180px]">{c.email}</p>
                          {c.city && (
                            <p className="text-xs text-ink/40 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" />{c.city}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-3.5">
                      {c.phone && (
                        <p className="text-xs text-ink/50 flex items-center gap-1">
                          <Phone className="w-3 h-3" />{c.phone}
                        </p>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="relative inline-flex items-center gap-1">
                        <RoleBadge role={c.role} />
                        <select
                          value={c.role}
                          onChange={e => updateRole(c.id, e.target.value as UserRole)}
                          disabled={updatingId === c.id}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full"
                          aria-label="Changer le rôle"
                        >
                          <option value="customer">Client</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                          <option value="kiosk">Kiosque</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-ink/30 shrink-0" />
                      </div>
                    </td>

                    {/* Orders */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-ink/60">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span className="font-medium text-ink">{c.order_count ?? 0}</span>
                      </div>
                    </td>

                    {/* Spent */}
                    <td className="px-5 py-3.5">
                      <span className="font-serif text-ink">{(c.total_spent ?? 0).toFixed(2)} €</span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-ink/40">
                        {format(new Date(c.created_at), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </td>

                    {/* Delete */}
                    <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => deleteCustomer(c.id)}
                        className="p-1.5 text-ink/20 hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-ink/5 bg-ink/[0.01]">
            <p className="text-[10px] uppercase tracking-widest text-ink/30">
              {filtered.length} client{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* ── Detail panel ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50" onClick={() => setSelected(null)}>
          <div
            className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink/10 bg-ink text-bg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/20 flex items-center justify-center text-accent font-bold uppercase">
                  {selected.email.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium truncate max-w-[220px]">{selected.email}</p>
                  <RoleBadge role={selected.role} />
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 text-bg/50 hover:text-bg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-soft-green/30 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">Commandes</p>
                  <p className="text-2xl font-serif text-ink">{selected.order_count ?? 0}</p>
                </div>
                <div className="bg-soft-green/30 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">Total dépensé</p>
                  <p className="text-2xl font-serif text-ink">{(selected.total_spent ?? 0).toFixed(2)} €</p>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-ink/40">Coordonnées</p>
                <div className="flex items-center gap-2 text-sm text-ink/70">
                  <Mail className="w-4 h-4 text-ink/30 shrink-0" />
                  {selected.email}
                </div>
                {selected.phone && (
                  <div className="flex items-center gap-2 text-sm text-ink/70">
                    <Phone className="w-4 h-4 text-ink/30 shrink-0" />
                    {selected.phone}
                  </div>
                )}
                {(selected.address_line1 || selected.city) && (
                  <div className="flex items-start gap-2 text-sm text-ink/70">
                    <MapPin className="w-4 h-4 text-ink/30 shrink-0 mt-0.5" />
                    <div>
                      {selected.address_line1 && <p>{selected.address_line1}</p>}
                      {selected.address_line2 && <p>{selected.address_line2}</p>}
                      {selected.city && <p>{selected.postal_code} {selected.city}</p>}
                      {selected.country && <p>{selected.country}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Inscription */}
              <div className="flex items-center gap-2 text-xs text-ink/40 border-t border-ink/10 pt-4">
                <Calendar className="w-3.5 h-3.5" />
                Inscrit le {format(new Date(selected.created_at), 'dd MMMM yyyy', { locale: fr })}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => deleteCustomer(selected.id)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 text-xs uppercase tracking-widest hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
