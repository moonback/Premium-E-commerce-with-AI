import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Mail, Phone, MapPin, ShoppingBag, Calendar, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { UserRole } from '../types';

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

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, roleFilter, customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch order stats for each customer
      const { data: orderStats, error: statsError } = await supabase
        .from('orders')
        .select('user_id, total');

      if (statsError) throw statsError;

      // Aggregate order data
      const statsMap: { [key: string]: { count: number; total: number } } = {};
      orderStats?.forEach(order => {
        if (!statsMap[order.user_id]) {
          statsMap[order.user_id] = { count: 0, total: 0 };
        }
        statsMap[order.user_id].count += 1;
        statsMap[order.user_id].total += order.total || 0;
      });

      // Combine data
      const customersWithStats = profiles?.map(profile => ({
        ...profile,
        order_count: statsMap[profile.id]?.count || 0,
        total_spent: statsMap[profile.id]?.total || 0,
      })) || [];

      setCustomers(customersWithStats);
    } catch (err) {
      console.error('Error fetching customers:', err);
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(c => c.role === roleFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.email.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.city?.toLowerCase().includes(term)
      );
    }

    setFilteredCustomers(filtered);
  };

  const updateCustomerRole = async (customerId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', customerId);

      if (error) throw error;
      toast.success('Rôle mis à jour');
      fetchCustomers();
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  };

  const deleteCustomer = async (customerId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce client ? Cette action est irréversible.')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', customerId);

      if (error) throw error;
      toast.success('Client supprimé');
      fetchCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'staff': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'kiosk': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-ink/50">Chargement des clients...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          <input
            type="text"
            placeholder="Rechercher par email, téléphone, ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="px-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none text-sm bg-white"
        >
          <option value="all">Tous les rôles</option>
          <option value="customer">Clients</option>
          <option value="staff">Staff</option>
          <option value="admin">Admins</option>
          <option value="kiosk">Kiosques</option>
        </select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-transparent p-4 border border-ink/10">
          <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-1">Total Clients</p>
          <p className="text-2xl font-serif">{customers.length}</p>
        </div>
        <div className="bg-transparent p-4 border border-ink/10">
          <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-1">Clients Actifs</p>
          <p className="text-2xl font-serif">{customers.filter(c => (c.order_count || 0) > 0).length}</p>
        </div>
        <div className="bg-transparent p-4 border border-ink/10">
          <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-1">Revenu Total</p>
          <p className="text-2xl font-serif">
            {customers.reduce((sum, c) => sum + (c.total_spent || 0), 0).toFixed(2)}€
          </p>
        </div>
        <div className="bg-transparent p-4 border border-ink/10">
          <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-1">Panier Moyen</p>
          <p className="text-2xl font-serif">
            {(customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / 
              Math.max(customers.filter(c => (c.order_count || 0) > 0).length, 1)).toFixed(2)}€
          </p>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-transparent border border-ink/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-soft-green/10 text-ink/50 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left font-bold tracking-widest">Client</th>
                <th className="px-6 py-3 text-left font-bold tracking-widest">Contact</th>
                <th className="px-6 py-3 text-left font-bold tracking-widest">Rôle</th>
                <th className="px-6 py-3 text-left font-bold tracking-widest">Commandes</th>
                <th className="px-6 py-3 text-left font-bold tracking-widest">Total Dépensé</th>
                <th className="px-6 py-3 text-left font-bold tracking-widest">Inscrit le</th>
                <th className="px-6 py-3 text-right font-bold tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-ink/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-soft-green rounded-full flex items-center justify-center text-ink font-bold">
                        {customer.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{customer.email}</p>
                        {customer.city && (
                          <p className="text-xs text-ink/60 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {customer.city}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {customer.phone && (
                      <p className="text-xs flex items-center gap-1 text-ink/60">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={customer.role}
                      onChange={(e) => updateCustomerRole(customer.id, e.target.value as UserRole)}
                      className={`text-xs px-2 py-1 border font-bold uppercase tracking-widest ${getRoleBadgeColor(customer.role)}`}
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                      <option value="kiosk">Kiosk</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-ink/40" />
                      <span className="font-bold">{customer.order_count || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-serif text-lg">
                    {(customer.total_spent || 0).toFixed(2)}€
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs text-ink/60">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(customer.created_at), 'dd/MM/yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="p-2 hover:bg-soft-green transition-colors"
                        title="Voir détails"
                      >
                        <Edit2 className="w-4 h-4 text-ink/60" />
                      </button>
                      <button
                        onClick={() => deleteCustomer(customer.id)}
                        className="p-2 hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-serif">Détails Client</h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-ink/60 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">Email</p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-ink/40" />
                  {selectedCustomer.email}
                </p>
              </div>

              {selectedCustomer.phone && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">Téléphone</p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-ink/40" />
                    {selectedCustomer.phone}
                  </p>
                </div>
              )}

              {(selectedCustomer.address_line1 || selectedCustomer.city) && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">Adresse</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-ink/40 mt-1" />
                    <div>
                      {selectedCustomer.address_line1 && <p>{selectedCustomer.address_line1}</p>}
                      {selectedCustomer.address_line2 && <p>{selectedCustomer.address_line2}</p>}
                      {selectedCustomer.city && (
                        <p>{selectedCustomer.postal_code} {selectedCustomer.city}</p>
                      )}
                      {selectedCustomer.country && <p>{selectedCustomer.country}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ink/10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">Commandes</p>
                  <p className="text-2xl font-serif">{selectedCustomer.order_count || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">Total Dépensé</p>
                  <p className="text-2xl font-serif">{(selectedCustomer.total_spent || 0).toFixed(2)}€</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
