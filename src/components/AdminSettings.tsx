import React, { useState, useEffect } from 'react';
import {
  Save, Database, Bell, Shield, Globe,
  TrendingUp, Package, CreditCard, Share2, Loader
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { StoreSettings } from '../types';
import { getErrorMessage } from '../lib/errors';

type SettingsTab = 'general' | 'commerce' | 'notifications' | 'analytics' | 'catalog' | 'payment' | 'social' | 'advanced';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'general',       label: 'Général',         icon: Globe },
  { id: 'commerce',      label: 'Commerce',         icon: Database },
  { id: 'notifications', label: 'Notifications',    icon: Bell },
  { id: 'analytics',     label: 'Analytics',        icon: TrendingUp },
  { id: 'catalog',       label: 'Catalogue',        icon: Package },
  { id: 'payment',       label: 'Paiement',         icon: CreditCard },
  { id: 'social',        label: 'Réseaux Sociaux',  icon: Share2 },
  { id: 'advanced',      label: 'Avancé',           icon: Shield },
];

const DEFAULT_SETTINGS: Partial<StoreSettings> = {
  store_name: 'Veridian Boutique',
  store_email: 'contact@veridian.com',
  store_phone: '+33 1 23 45 67 89',
  store_address: '',
  store_description: '',
  store_logo_url: '',
  currency: 'EUR',
  tax_rate: 20,
  shipping_fee: 5.99,
  free_shipping_threshold: 50,
  low_stock_threshold: 10,
  enable_notifications: true,
  enable_email_notifications: true,
  enable_sms_notifications: false,
  notification_email: '',
  enable_analytics: true,
  google_analytics_id: '',
  facebook_pixel_id: '',
  default_meta_title: '',
  default_meta_description: '',
  default_meta_keywords: '',
  facebook_url: '',
  instagram_url: '',
  twitter_url: '',
  linkedin_url: '',
  maintenance_mode: false,
  maintenance_message: 'Site en maintenance. Nous revenons bientôt !',
  auto_publish_products: false,
  require_product_approval: true,
  enable_product_reviews: true,
  enable_wishlist: true,
  enable_stripe: true,
  stripe_public_key: '',
  enable_paypal: false,
  paypal_client_id: '',
};

// ── Reusable field components ──────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">{label}</label>
      {children}
      {hint && <p className="text-xs text-ink/40 mt-1">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 border border-ink/10 rounded focus:border-ink/30 focus:outline-none bg-white"
    />
  );
}

function NumberInput({ value, onChange, step = 1, placeholder }: {
  value: number; onChange: (v: number) => void; step?: number; placeholder?: string;
}) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(parseFloat(e.target.value) || 0)}
      placeholder={placeholder}
      className="w-full px-4 py-3 border border-ink/10 rounded focus:border-ink/30 focus:outline-none bg-white"
    />
  );
}

function Toggle({ checked, onChange, label, hint }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-ink transition-colors
          after:content-[''] after:absolute after:top-[2px] after:left-[2px]
          after:bg-white after:border after:border-gray-300 after:rounded-full
          after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
      </div>
      <div>
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint && <p className="text-xs text-ink/50">{hint}</p>}
      </div>
    </label>
  );
}

function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-ink/10 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon className="w-5 h-5 text-ink/70" />
        <h3 className="text-lg font-serif text-ink">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Partial<StoreSettings>>(DEFAULT_SETTINGS);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    if (!supabase) { setIsLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('store_settings').select('*').limit(1).maybeSingle();
      if (error) throw error;
      if (data) { setSettings(data); setSettingsId(data.id); }
    } catch (err) {
      toast.error('Erreur chargement paramètres');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase) { toast.error('Supabase non configuré'); return; }
    setIsSaving(true);
    try {
      const payload = { ...settings };
      delete (payload as any).id;
      delete (payload as any).created_at;
      delete (payload as any).updated_at;

      if (settingsId) {
        const { error } = await supabase.from('store_settings').update(payload).eq('id', settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('store_settings').insert([payload]).select().single();
        if (error) throw error;
        if (data) setSettingsId(data.id);
      }
      toast.success('Paramètres sauvegardés');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erreur sauvegarde'));
    } finally {
      setIsSaving(false);
    }
  };

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-ink/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-serif text-ink">Paramètres de la Boutique</h2>
          <p className="text-sm text-ink/50 mt-1">Gérez votre boutique, métriques et catalogue</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-ink text-white font-bold text-xs uppercase tracking-widest
            hover:bg-ink/90 transition-colors flex items-center gap-2 disabled:opacity-50 rounded"
        >
          {isSaving ? <><Loader className="w-4 h-4 animate-spin" />Sauvegarde...</> : <><Save className="w-4 h-4" />Sauvegarder</>}
        </button>
      </div>

      {/* Tab bar */}
      <div className="border-b border-ink/10 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === id
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ink/40 hover:text-ink/70'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── GÉNÉRAL ─────────────────────────────────────────────────────── */}
      {activeTab === 'general' && (
        <SectionCard icon={Globe} title="Informations Générales">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Nom de la boutique *">
              <TextInput value={settings.store_name || ''} onChange={v => set('store_name', v)} placeholder="Veridian Boutique" />
            </Field>
            <Field label="Email de contact *">
              <TextInput type="email" value={settings.store_email || ''} onChange={v => set('store_email', v)} placeholder="contact@veridian.com" />
            </Field>
            <Field label="Téléphone">
              <TextInput type="tel" value={settings.store_phone || ''} onChange={v => set('store_phone', v)} placeholder="+33 1 23 45 67 89" />
            </Field>
            <Field label="Adresse">
              <TextInput value={settings.store_address || ''} onChange={v => set('store_address', v)} placeholder="123 Rue de la Paix, 75001 Paris" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <textarea
                  value={settings.store_description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set('store_description', e.target.value)}
                  rows={3}
                  placeholder="Boutique premium de produits artisanaux..."
                  className="w-full px-4 py-3 border border-ink/10 rounded focus:border-ink/30 focus:outline-none resize-none bg-white"
                />
              </Field>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── COMMERCE ────────────────────────────────────────────────────── */}
      {activeTab === 'commerce' && (
        <SectionCard icon={Database} title="Paramètres Commerce">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Devise">
              <select
                value={settings.currency || 'EUR'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set('currency', e.target.value)}
                className="w-full px-4 py-3 border border-ink/10 rounded focus:border-ink/30 focus:outline-none bg-white"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CHF">CHF (Fr)</option>
                <option value="MAD">MAD (د.م.)</option>
              </select>
            </Field>
            <Field label="Taux de TVA (%)" hint="Appliqué sur tous les produits">
              <NumberInput value={settings.tax_rate || 0} onChange={v => set('tax_rate', v)} step={0.01} placeholder="20.00" />
            </Field>
            <Field label="Frais de livraison (€)">
              <NumberInput value={settings.shipping_fee || 0} onChange={v => set('shipping_fee', v)} step={0.01} placeholder="5.99" />
            </Field>
            <Field label="Seuil livraison gratuite (€)" hint="0 pour désactiver">
              <NumberInput value={settings.free_shipping_threshold || 0} onChange={v => set('free_shipping_threshold', v)} step={0.01} placeholder="50.00" />
            </Field>
            <Field label="Seuil stock faible" hint="Alerte quand le stock passe sous ce seuil">
              <NumberInput value={settings.low_stock_threshold || 0} onChange={v => set('low_stock_threshold', v)} placeholder="10" />
            </Field>
          </div>
        </SectionCard>
      )}

      {/* ── NOTIFICATIONS ───────────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <SectionCard icon={Bell} title="Notifications">
          <div className="space-y-5">
            <Toggle checked={!!settings.enable_notifications} onChange={v => set('enable_notifications', v)}
              label="Activer les notifications" hint="Recevoir des alertes pour les événements importants" />
            <Toggle checked={!!settings.enable_email_notifications} onChange={v => set('enable_email_notifications', v)}
              label="Notifications par email" hint="Nouvelles commandes, stock faible, etc." />
            <Toggle checked={!!settings.enable_sms_notifications} onChange={v => set('enable_sms_notifications', v)}
              label="Notifications par SMS" hint="Alertes urgentes uniquement" />
            <Field label="Email de notification" hint="Laissez vide pour utiliser l'email principal">
              <TextInput type="email" value={settings.notification_email || ''} onChange={v => set('notification_email', v)} placeholder="notifications@veridian.com" />
            </Field>
          </div>
        </SectionCard>
      )}

      {/* ── ANALYTICS ───────────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <SectionCard icon={TrendingUp} title="Analytics & Métriques">
          <div className="space-y-6">
            <Toggle checked={!!settings.enable_analytics} onChange={v => set('enable_analytics', v)}
              label="Activer les analytics" hint="Suivre les performances et le comportement des visiteurs" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Google Analytics ID (GA4)" hint="Format : G-XXXXXXXXXX">
                <TextInput value={settings.google_analytics_id || ''} onChange={v => set('google_analytics_id', v)} placeholder="G-XXXXXXXXXX" />
              </Field>
              <Field label="Facebook Pixel ID" hint="Suivi des conversions Meta Ads">
                <TextInput value={settings.facebook_pixel_id || ''} onChange={v => set('facebook_pixel_id', v)} placeholder="123456789012345" />
              </Field>
            </div>
            <div className="border-t border-ink/10 pt-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-ink/50 mb-4">SEO par défaut</h4>
              <div className="space-y-4">
                <Field label="Meta Title par défaut">
                  <TextInput value={settings.default_meta_title || ''} onChange={v => set('default_meta_title', v)} placeholder="Veridian Boutique – Produits Premium" />
                </Field>
                <Field label="Meta Description par défaut">
                  <textarea
                    value={settings.default_meta_description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set('default_meta_description', e.target.value)}
                    rows={2}
                    placeholder="Découvrez notre sélection de produits artisanaux et durables..."
                    className="w-full px-4 py-3 border border-ink/10 rounded focus:border-ink/30 focus:outline-none resize-none bg-white"
                  />
                </Field>
                <Field label="Mots-clés par défaut" hint="Séparés par des virgules">
                  <TextInput value={settings.default_meta_keywords || ''} onChange={v => set('default_meta_keywords', v)} placeholder="boutique, artisanal, premium, durable" />
                </Field>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── CATALOGUE ───────────────────────────────────────────────────── */}
      {activeTab === 'catalog' && (
        <SectionCard icon={Package} title="Gestion du Catalogue">
          <div className="space-y-5">
            <Toggle checked={!!settings.auto_publish_products} onChange={v => set('auto_publish_products', v)}
              label="Publication automatique" hint="Les nouveaux produits sont publiés immédiatement" />
            <Toggle checked={!!settings.require_product_approval} onChange={v => set('require_product_approval', v)}
              label="Approbation requise" hint="Les produits doivent être validés avant publication" />
            <Toggle checked={!!settings.enable_product_reviews} onChange={v => set('enable_product_reviews', v)}
              label="Avis produits" hint="Permettre aux clients de laisser des avis et notes" />
            <Toggle checked={!!settings.enable_wishlist} onChange={v => set('enable_wishlist', v)}
              label="Liste de souhaits" hint="Permettre aux clients de sauvegarder leurs favoris" />
          </div>
        </SectionCard>
      )}

      {/* ── PAIEMENT ────────────────────────────────────────────────────── */}
      {activeTab === 'payment' && (
        <SectionCard icon={CreditCard} title="Méthodes de Paiement">
          <div className="space-y-4">
            {/* Stripe */}
            <div className="border border-ink/10 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-ink">Stripe</p>
                    <p className="text-xs text-ink/50">Cartes bancaires, Apple Pay, Google Pay</p>
                  </div>
                </div>
                <Toggle checked={!!settings.enable_stripe} onChange={v => set('enable_stripe', v)} label="" />
              </div>
              {settings.enable_stripe && (
                <Field label="Clé publique Stripe" hint="Commence par pk_live_ ou pk_test_">
                  <TextInput value={settings.stripe_public_key || ''} onChange={v => set('stripe_public_key', v)} placeholder="pk_test_..." />
                </Field>
              )}
            </div>
            {/* PayPal */}
            <div className="border border-ink/10 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <span className="text-blue-700 font-bold text-sm">PP</span>
                  </div>
                  <div>
                    <p className="font-medium text-ink">PayPal</p>
                    <p className="text-xs text-ink/50">Paiement PayPal et cartes via PayPal</p>
                  </div>
                </div>
                <Toggle checked={!!settings.enable_paypal} onChange={v => set('enable_paypal', v)} label="" />
              </div>
              {settings.enable_paypal && (
                <Field label="Client ID PayPal">
                  <TextInput value={settings.paypal_client_id || ''} onChange={v => set('paypal_client_id', v)} placeholder="AXxx..." />
                </Field>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── RÉSEAUX SOCIAUX ─────────────────────────────────────────────── */}
      {activeTab === 'social' && (
        <SectionCard icon={Share2} title="Réseaux Sociaux">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Facebook">
              <TextInput value={settings.facebook_url || ''} onChange={v => set('facebook_url', v)} placeholder="https://facebook.com/veridian" />
            </Field>
            <Field label="Instagram">
              <TextInput value={settings.instagram_url || ''} onChange={v => set('instagram_url', v)} placeholder="https://instagram.com/veridian" />
            </Field>
            <Field label="Twitter / X">
              <TextInput value={settings.twitter_url || ''} onChange={v => set('twitter_url', v)} placeholder="https://twitter.com/veridian" />
            </Field>
            <Field label="LinkedIn">
              <TextInput value={settings.linkedin_url || ''} onChange={v => set('linkedin_url', v)} placeholder="https://linkedin.com/company/veridian" />
            </Field>
          </div>
        </SectionCard>
      )}

      {/* ── AVANCÉ ──────────────────────────────────────────────────────── */}
      {activeTab === 'advanced' && (
        <div className="space-y-4">
          <SectionCard icon={Shield} title="Mode Maintenance">
            <div className="space-y-4">
              <Toggle
                checked={!!settings.maintenance_mode}
                onChange={v => set('maintenance_mode', v)}
                label="Activer le mode maintenance"
                hint="La boutique sera inaccessible aux visiteurs"
              />
              {settings.maintenance_mode && (
                <Field label="Message de maintenance">
                  <textarea
                    value={settings.maintenance_message || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set('maintenance_message', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-ink/10 rounded focus:border-ink/30 focus:outline-none resize-none bg-white"
                    placeholder="Site en maintenance. Nous revenons bientôt !"
                  />
                </Field>
              )}
              {settings.maintenance_mode && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <Shield className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Mode maintenance actif</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Seuls les administrateurs peuvent accéder à la boutique. Les clients verront le message de maintenance.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-serif text-red-700">Zone Dangereuse</h3>
            </div>
            <p className="text-sm text-red-600 mb-4">
              Ces actions sont irréversibles. Procédez avec précaution.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (window.confirm('Réinitialiser tous les paramètres aux valeurs par défaut ?')) {
                    setSettings(DEFAULT_SETTINGS);
                    toast('Paramètres réinitialisés (non sauvegardés)', { icon: '⚠️' });
                  }
                }}
                className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded hover:bg-red-100 transition-colors"
              >
                Réinitialiser les paramètres
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom save button */}
      <div className="flex justify-end pt-4 border-t border-ink/10">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-ink text-white font-bold text-xs uppercase tracking-widest
            hover:bg-ink/90 transition-colors flex items-center gap-2 disabled:opacity-50 rounded"
        >
          {isSaving ? <><Loader className="w-4 h-4 animate-spin" />Sauvegarde...</> : <><Save className="w-4 h-4" />Sauvegarder les paramètres</>}
        </button>
      </div>
    </div>
  );
}
