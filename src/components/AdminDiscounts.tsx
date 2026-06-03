import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Tag, Plus, Edit2, Trash2, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

type Discount = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount?: number;
  max_uses?: number;
  current_uses: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
};

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Partial<Discount>>({
    type: 'percentage',
    is_active: true,
    current_uses: 0,
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscounts(data || []);
    } catch (err) {
      console.error('Error fetching discounts:', err);
      // Table might not exist yet
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingDiscount.code || !editingDiscount.value) {
      toast.error('Code et valeur requis');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return toast.error("Session expirée");

      // Clean payload - only include writable fields
      const payload: any = {
        code: editingDiscount.code.toUpperCase(),
        type: editingDiscount.type || 'percentage',
        value: editingDiscount.value,
        is_active: editingDiscount.is_active ?? true,
        current_uses: editingDiscount.current_uses || 0,
        valid_from: editingDiscount.valid_from || new Date().toISOString(),
      };

      // Optional fields
      if (editingDiscount.min_order_amount !== undefined && editingDiscount.min_order_amount !== null) {
        payload.min_order_amount = editingDiscount.min_order_amount;
      }
      if (editingDiscount.max_uses !== undefined && editingDiscount.max_uses !== null) {
        payload.max_uses = editingDiscount.max_uses;
      }
      if (editingDiscount.valid_until) {
        payload.valid_until = editingDiscount.valid_until;
      }

      const isEdit = !!editingDiscount.id;
      const url = isEdit ? `/api/admin/discounts/${editingDiscount.id}` : "/api/admin/discounts";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const resJson = await response.json();
      if (!response.ok) throw new Error(resJson.error || "Erreur serveur");

      toast.success(isEdit ? 'Code promo mis à jour' : 'Code promo créé');
      setIsEditing(false);
      setEditingDiscount({ type: 'percentage', is_active: true, current_uses: 0 });
      fetchDiscounts();
    } catch (err: any) {
      console.error('Error saving discount:', err);
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  const deleteDiscount = async (id: string) => {
    if (!window.confirm('Supprimer ce code promo ?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return toast.error("Session expirée");

      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      const resJson = await response.json();
      if (!response.ok) throw new Error(resJson.error || "Erreur serveur");

      toast.success('Code promo supprimé');
      fetchDiscounts();
    } catch (err) {
      console.error('Error deleting discount:', err);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return toast.error("Session expirée");

      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_active: !currentActive })
      });

      const resJson = await response.json();
      if (!response.ok) throw new Error(resJson.error || "Erreur serveur");

      toast.success(currentActive ? 'Code désactivé' : 'Code activé');
      fetchDiscounts();
    } catch (err) {
      console.error('Error toggling discount:', err);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié');
  };

  if (loading) {
    return <div className="p-8 text-center text-ink/50">Chargement des codes promo...</div>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => {
          setEditingDiscount({ type: 'percentage', is_active: true, current_uses: 0 });
          setIsEditing(true);
        }}
        className="px-6 py-3 bg-ink text-white font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Nouveau Code Promo
      </button>

      {/* Discounts List */}
      <div className="bg-transparent border border-ink/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-soft-green/10 text-ink/50 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left font-bold tracking-widest">Code</th>
              <th className="px-6 py-3 text-left font-bold tracking-widest">Type</th>
              <th className="px-6 py-3 text-left font-bold tracking-widest">Valeur</th>
              <th className="px-6 py-3 text-left font-bold tracking-widest">Utilisations</th>
              <th className="px-6 py-3 text-left font-bold tracking-widest">Validité</th>
              <th className="px-6 py-3 text-left font-bold tracking-widest">Statut</th>
              <th className="px-6 py-3 text-right font-bold tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {discounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-ink/50">
                  Aucun code promo. Créez-en un pour commencer.
                </td>
              </tr>
            ) : (
              discounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-ink/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-ink/40" />
                      <span className="font-mono font-bold">{discount.code}</span>
                      <button
                        onClick={() => copyCode(discount.code)}
                        className="p-1 hover:bg-soft-green transition-colors"
                        title="Copier"
                      >
                        <Copy className="w-3 h-3 text-ink/40" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs uppercase tracking-widest">
                      {discount.type === 'percentage' ? 'Pourcentage' : 'Montant fixe'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-serif text-lg">
                    {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value}€`}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold">{discount.current_uses}</span>
                    {discount.max_uses && <span className="text-ink/50"> / {discount.max_uses}</span>}
                  </td>
                  <td className="px-6 py-4 text-xs text-ink/60">
                    {discount.valid_until ? (
                      <>Jusqu'au {format(new Date(discount.valid_until), 'dd/MM/yyyy')}</>
                    ) : (
                      'Illimité'
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(discount.id, discount.is_active)}
                      className={`px-2 py-1 text-xs font-bold uppercase tracking-widest border ${
                        discount.is_active
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      {discount.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingDiscount(discount);
                          setIsEditing(true);
                        }}
                        className="p-2 hover:bg-soft-green transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4 text-ink/60" />
                      </button>
                      <button
                        onClick={() => deleteDiscount(discount.id)}
                        className="p-2 hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-serif">
                {editingDiscount.id ? 'Modifier' : 'Nouveau'} Code Promo
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-ink/60 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">
                  Code *
                </label>
                <input
                  type="text"
                  value={editingDiscount.code || ''}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none font-mono"
                  placeholder="PROMO2024"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">
                    Type *
                  </label>
                  <select
                    value={editingDiscount.type}
                    onChange={(e) => setEditingDiscount({ ...editingDiscount, type: e.target.value as any })}
                    className="w-full px-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none bg-white"
                  >
                    <option value="percentage">Pourcentage</option>
                    <option value="fixed">Montant fixe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">
                    Valeur *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingDiscount.value || ''}
                    onChange={(e) => setEditingDiscount({ ...editingDiscount, value: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">
                    Montant min. commande
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingDiscount.min_order_amount || ''}
                    onChange={(e) => setEditingDiscount({ ...editingDiscount, min_order_amount: parseFloat(e.target.value) || undefined })}
                    className="w-full px-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">
                    Utilisations max
                  </label>
                  <input
                    type="number"
                    value={editingDiscount.max_uses || ''}
                    onChange={(e) => setEditingDiscount({ ...editingDiscount, max_uses: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">
                  Valide jusqu'au
                </label>
                <input
                  type="date"
                  value={editingDiscount.valid_until ? editingDiscount.valid_until.split('T')[0] : ''}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, valid_until: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="w-full px-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={editingDiscount.is_active}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, is_active: e.target.checked })}
                  className="w-5 h-5"
                />
                <label className="text-sm">Code actif</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-ink text-white font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors"
                >
                  Sauvegarder
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 border border-ink/10 font-bold text-xs uppercase tracking-widest hover:bg-soft-green transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
