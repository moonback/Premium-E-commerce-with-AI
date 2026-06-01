import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck, Plus, Pencil, Trash2, Save, X, Loader, ToggleLeft, ToggleRight,
  GripVertical, Package, Zap, Globe, MapPin, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { ShippingCarrier, CarrierType } from '../../types';
import { getErrorMessage } from '../../lib/errors';

// ── Helpers ────────────────────────────────────────────────────────────────

const CARRIER_TYPE_CONFIG: Record<CarrierType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  home:          { label: 'Domicile',      icon: Truck,   color: 'text-blue-600',   bg: 'bg-blue-50'   },
  relay:         { label: 'Point Relais',  icon: MapPin,  color: 'text-emerald-600',bg: 'bg-emerald-50'},
  express:       { label: 'Express',       icon: Zap,     color: 'text-amber-600',  bg: 'bg-amber-50'  },
  international: { label: 'International', icon: Globe,   color: 'text-purple-600', bg: 'bg-purple-50' },
};

function formatPrice(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function delayLabel(min: number, max: number) {
  if (min === max) return `${min} jour${min > 1 ? 's' : ''} ouvré${min > 1 ? 's' : ''}`;
  return `${min} – ${max} jours ouvrés`;
}

// ── Empty carrier template ─────────────────────────────────────────────────

const EMPTY: Omit<ShippingCarrier, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  slug: '',
  logo_url: '',
  carrier_type: 'home',
  description: '',
  base_price: 4.90,
  free_above: 60,
  extra_kg_price: 0,
  min_days: 2,
  max_days: 4,
  is_active: true,
  available_countries: ['FR'],
  max_weight_kg: 30,
  tracking_url_template: '',
  display_order: 99,
};

// ── Form component ─────────────────────────────────────────────────────────

function CarrierForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: Partial<ShippingCarrier>;
  onSave: (data: Partial<ShippingCarrier>) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<Partial<ShippingCarrier>>({ ...EMPTY, ...initial });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = <K extends keyof ShippingCarrier>(k: K, v: ShippingCarrier[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  // Auto-generate slug from name
  const handleNameChange = (v: string) => {
    set('name', v);
    if (!initial.id) {
      set('slug', v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { toast.error('Le nom est requis'); return; }
    if (!form.slug?.trim()) { toast.error('Le slug est requis'); return; }
    onSave(form);
  };

  const inputCls = 'w-full border border-ink/20 bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-accent transition-colors';
  const labelCls = 'block text-[10px] uppercase tracking-[0.2em] text-ink/50 mb-1.5 font-medium';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type selector */}
      <div>
        <label className={labelCls}>Type de transporteur *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.entries(CARRIER_TYPE_CONFIG) as [CarrierType, typeof CARRIER_TYPE_CONFIG[CarrierType]][]).map(([type, cfg]) => {
            const Icon = cfg.icon;
            const active = form.carrier_type === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => set('carrier_type', type)}
                className={`flex flex-col items-center gap-1.5 p-3 border text-xs font-medium transition-all ${
                  active
                    ? 'border-ink bg-ink text-bg'
                    : 'border-ink/15 text-ink/60 hover:border-ink/30 hover:bg-ink/5'
                }`}
              >
                <Icon size={16} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Name + Slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Nom du transporteur *</label>
          <input
            type="text"
            value={form.name || ''}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="La Poste – Colissimo"
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Slug (identifiant unique) *</label>
          <input
            type="text"
            value={form.slug || ''}
            onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="colissimo"
            className={inputCls}
            required
          />
          <p className="text-[10px] text-ink/40 mt-1">Lettres minuscules et tirets uniquement</p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description</label>
        <textarea
          value={form.description || ''}
          onChange={e => set('description', e.target.value)}
          rows={2}
          placeholder="Livraison à domicile ou en bureau de poste..."
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Tarif de base (€) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.base_price ?? ''}
            onChange={e => set('base_price', parseFloat(e.target.value) || 0)}
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Gratuit à partir de (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.free_above ?? ''}
            onChange={e => set('free_above', e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="Laisser vide = jamais gratuit"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Supplément / kg (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.extra_kg_price ?? 0}
            onChange={e => set('extra_kg_price', parseFloat(e.target.value) || 0)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Delays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Délai minimum (jours ouvrés) *</label>
          <input
            type="number"
            min="1"
            value={form.min_days ?? 1}
            onChange={e => set('min_days', parseInt(e.target.value) || 1)}
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Délai maximum (jours ouvrés) *</label>
          <input
            type="number"
            min="1"
            value={form.max_days ?? 1}
            onChange={e => set('max_days', parseInt(e.target.value) || 1)}
            className={inputCls}
            required
          />
        </div>
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(v => !v)}
        className="flex items-center gap-2 text-xs text-ink/50 hover:text-ink transition-colors"
      >
        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Options avancées (URL de suivi, poids max, pays, ordre)
      </button>

      {showAdvanced && (
        <div className="space-y-4 border-t border-ink/10 pt-4">
          <div>
            <label className={labelCls}>URL de suivi</label>
            <input
              type="text"
              value={form.tracking_url_template || ''}
              onChange={e => set('tracking_url_template', e.target.value)}
              placeholder="https://www.laposte.fr/...?code={tracking_number}"
              className={inputCls}
            />
            <p className="text-[10px] text-ink/40 mt-1">Utilisez <code className="bg-ink/5 px-1">{'{tracking_number}'}</code> comme variable</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Poids max (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.max_weight_kg ?? 30}
                onChange={e => set('max_weight_kg', parseFloat(e.target.value) || 30)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Pays disponibles</label>
              <input
                type="text"
                value={(form.available_countries || ['FR']).join(', ')}
                onChange={e => set('available_countries', e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean))}
                placeholder="FR, BE, CH"
                className={inputCls}
              />
              <p className="text-[10px] text-ink/40 mt-1">Codes ISO séparés par des virgules</p>
            </div>
            <div>
              <label className={labelCls}>Ordre d'affichage</label>
              <input
                type="number"
                min="0"
                value={form.display_order ?? 99}
                onChange={e => set('display_order', parseInt(e.target.value) || 0)}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>URL du logo</label>
            <input
              type="url"
              value={form.logo_url || ''}
              onChange={e => set('logo_url', e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </div>
        </div>
      )}

      {/* Active toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative">
          <input
            type="checkbox"
            checked={!!form.is_active}
            onChange={e => set('is_active', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-ink transition-colors
            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
            after:bg-white after:border after:border-gray-300 after:rounded-full
            after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
        </div>
        <div>
          <span className="text-sm font-medium text-ink">Transporteur actif</span>
          <p className="text-xs text-ink/50">Visible dans le checkout et la page livraison</p>
        </div>
      </label>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-ink/10">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-5 py-2.5 border border-ink/20 text-ink/70 text-xs uppercase tracking-[0.2em] hover:bg-ink/5 transition-colors"
        >
          <X size={13} /> Annuler
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-ink text-bg text-xs uppercase tracking-[0.2em] hover:bg-accent transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader size={13} className="animate-spin" /> : <Save size={13} />}
          {initial.id ? 'Mettre à jour' : 'Créer le transporteur'}
        </button>
      </div>
    </form>
  );
}

// ── Carrier card ───────────────────────────────────────────────────────────

function CarrierCard({
  carrier,
  onEdit,
  onDelete,
  onToggle,
}: {
  carrier: ShippingCarrier;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const cfg = CARRIER_TYPE_CONFIG[carrier.carrier_type] ?? CARRIER_TYPE_CONFIG.home;
  const Icon = cfg.icon;

  return (
    <div className={`border bg-white transition-all ${carrier.is_active ? 'border-ink/10' : 'border-ink/5 opacity-60'}`}>
      <div className="p-5 flex items-start gap-4">
        {/* Drag handle (visual only) */}
        <div className="mt-1 text-ink/20 cursor-grab">
          <GripVertical size={16} />
        </div>

        {/* Icon */}
        <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${cfg.bg}`}>
          <Icon size={18} className={cfg.color} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-ink">{carrier.name}</h3>
            <span className={`text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 font-medium ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            {!carrier.is_active && (
              <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 bg-red-50 text-red-500">
                Inactif
              </span>
            )}
          </div>
          {carrier.description && (
            <p className="text-xs text-ink/50 mt-0.5 line-clamp-1">{carrier.description}</p>
          )}
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="text-xs text-ink/60">
              <span className="font-medium text-ink">{formatPrice(carrier.base_price)}</span>
              {carrier.free_above != null && (
                <span className="text-accent ml-1">· Gratuit dès {formatPrice(carrier.free_above)}</span>
              )}
            </span>
            <span className="text-xs text-ink/60">
              ⏱ {delayLabel(carrier.min_days, carrier.max_days)}
            </span>
            <span className="text-xs text-ink/40 font-mono">/{carrier.slug}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggle}
            title={carrier.is_active ? 'Désactiver' : 'Activer'}
            className="p-2 text-ink/40 hover:text-ink transition-colors"
          >
            {carrier.is_active
              ? <ToggleRight size={20} className="text-emerald-600" />
              : <ToggleLeft size={20} />}
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-ink/40 hover:text-ink transition-colors"
            title="Modifier"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-ink/40 hover:text-red-500 transition-colors"
            title="Supprimer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AdminShipping() {
  const [carriers, setCarriers] = useState<ShippingCarrier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<ShippingCarrier> | null>(null);

  const load = useCallback(async () => {
    if (!supabase) { setIsLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('shipping_carriers')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setCarriers(data ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erreur chargement transporteurs'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: Partial<ShippingCarrier>) => {
    if (!supabase) return;
    setIsSaving(true);
    try {
      const payload = { ...data };
      delete (payload as any).created_at;
      delete (payload as any).updated_at;

      if (editing?.id) {
        const { error } = await supabase
          .from('shipping_carriers')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Transporteur mis à jour');
      } else {
        delete (payload as any).id;
        const { error } = await supabase
          .from('shipping_carriers')
          .insert([payload]);
        if (error) throw error;
        toast.success('Transporteur créé');
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erreur sauvegarde'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer le transporteur "${name}" ?`)) return;
    if (!supabase) return;
    try {
      const { error } = await supabase.from('shipping_carriers').delete().eq('id', id);
      if (error) throw error;
      toast.success('Transporteur supprimé');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleToggle = async (carrier: ShippingCarrier) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('shipping_carriers')
        .update({ is_active: !carrier.is_active })
        .eq('id', carrier.id);
      if (error) throw error;
      setCarriers(prev => prev.map(c => c.id === carrier.id ? { ...c, is_active: !c.is_active } : c));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (c: ShippingCarrier) => { setEditing(c); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const activeCount = carriers.filter(c => c.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-serif text-ink">Modes de Livraison</h2>
          <p className="text-sm text-ink/50 mt-1">
            {activeCount} transporteur{activeCount > 1 ? 's' : ''} actif{activeCount > 1 ? 's' : ''} sur {carriers.length}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-ink text-bg px-5 py-2.5 text-xs uppercase tracking-[0.2em] hover:bg-accent transition-colors"
        >
          <Plus size={14} />
          Ajouter un transporteur
        </button>
      </div>

      {/* Stats bar */}
      {carriers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(CARRIER_TYPE_CONFIG) as [CarrierType, typeof CARRIER_TYPE_CONFIG[CarrierType]][]).map(([type, cfg]) => {
            const Icon = cfg.icon;
            const count = carriers.filter(c => c.carrier_type === type).length;
            return (
              <div key={type} className={`flex items-center gap-3 p-3 border border-ink/10 ${cfg.bg}`}>
                <Icon size={16} className={cfg.color} />
                <div>
                  <p className="text-xs font-medium text-ink">{cfg.label}</p>
                  <p className="text-[10px] text-ink/50">{count} transporteur{count > 1 ? 's' : ''}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form panel */}
      {showForm && (
        <div className="border border-accent/30 bg-white p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-ink flex items-center justify-center">
              {editing?.id ? <Pencil size={14} className="text-bg" /> : <Plus size={14} className="text-bg" />}
            </div>
            <h3 className="font-serif text-lg text-ink">
              {editing?.id ? `Modifier — ${editing.name}` : 'Nouveau transporteur'}
            </h3>
          </div>
          <CarrierForm
            initial={editing ?? {}}
            onSave={handleSave}
            onCancel={closeForm}
            isSaving={isSaving}
          />
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader size={24} className="animate-spin text-ink/30" />
        </div>
      ) : carriers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-ink/20">
          <Package size={32} className="text-ink/20" />
          <p className="text-sm text-ink/40">Aucun transporteur configuré</p>
          <button
            onClick={openCreate}
            className="text-xs uppercase tracking-[0.2em] text-accent border border-accent/30 px-5 py-2 hover:bg-accent/5 transition-colors"
          >
            Ajouter le premier transporteur
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Active */}
          {carriers.filter(c => c.is_active).length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-[0.3em] text-ink/40 px-1">Actifs</p>
              {carriers.filter(c => c.is_active).map(c => (
                <CarrierCard
                  key={c.id}
                  carrier={c}
                  onEdit={() => openEdit(c)}
                  onDelete={() => handleDelete(c.id, c.name)}
                  onToggle={() => handleToggle(c)}
                />
              ))}
            </div>
          )}
          {/* Inactive */}
          {carriers.filter(c => !c.is_active).length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-[9px] uppercase tracking-[0.3em] text-ink/40 px-1">Inactifs</p>
              {carriers.filter(c => !c.is_active).map(c => (
                <CarrierCard
                  key={c.id}
                  carrier={c}
                  onEdit={() => openEdit(c)}
                  onDelete={() => handleDelete(c.id, c.name)}
                  onToggle={() => handleToggle(c)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info box */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 text-xs text-blue-700">
        <AlertCircle size={15} className="shrink-0 mt-0.5" />
        <p>
          Les transporteurs actifs apparaissent dans le <strong>checkout</strong> et sur la{' '}
          <strong>page Livraison</strong>. Les prix sont calculés automatiquement selon le seuil
          de livraison gratuite configuré.
        </p>
      </div>
    </div>
  );
}
