import React, { useState } from 'react';
import { Settings, Save, Database, Bell, Shield, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    storeName: 'Veridian Boutique',
    storeEmail: 'contact@veridian.com',
    storePhone: '+33 1 23 45 67 89',
    currency: 'EUR',
    taxRate: 20,
    shippingFee: 5.99,
    freeShippingThreshold: 50,
    lowStockThreshold: 10,
    enableNotifications: true,
    enableAnalytics: true,
    maintenanceMode: false,
  });

  const handleSave = () => {
    // In a real app, save to database
    toast.success('Paramètres sauvegardés');
  };

  return (
    <div className="space-y-6">
      <div className="bg-transparent border border-ink/10 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5" />
          <h3 className="text-lg font-serif">Informations Boutique</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">
              Nom de la boutique
            </label>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              className="w-full px-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">
              Email
            </label>
            <input
              type="email"
              value={settings.storeEmail}
              onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
              className="w-full px-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={settings.storePhone}
              onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
              className="w-full px-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">
              Devise
            </label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full px-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none bg-white"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-transparent border border-ink/10 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Database className="w-5 h-5" />
          <h3 className="text-lg font-serif">Paramètres Commerce</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">
              Taux de TVA (%)
            </label>
            <input
              type="number"
              value={settings.taxRate}
              onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">
              Frais de livraison (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.shippingFee}
              onChange={(e) => setSettings({ ...settings, shippingFee: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">
              Seuil livraison gratuite (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.freeShippingThreshold}
              onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">
              Seuil stock faible
            </label>
            <input
              type="number"
              value={settings.lowStockThreshold}
              onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-ink/10 focus:border-ink/30 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-transparent border border-ink/10 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5" />
          <h3 className="text-lg font-serif">Notifications & Fonctionnalités</h3>
        </div>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableNotifications}
              onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-sm">Activer les notifications email</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableAnalytics}
              onChange={(e) => setSettings({ ...settings, enableAnalytics: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-sm">Activer les analytics</span>
          </label>
        </div>
      </div>

      <div className="bg-transparent border border-red-200 p-6 bg-red-50">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-serif text-red-600">Zone Dangereuse</h3>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="text-sm text-red-600 font-bold">Mode Maintenance (désactive la boutique)</span>
        </label>
      </div>

      <button
        onClick={handleSave}
        className="w-full md:w-auto px-8 py-4 bg-ink text-white font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        Sauvegarder les Paramètres
      </button>
    </div>
  );
}
