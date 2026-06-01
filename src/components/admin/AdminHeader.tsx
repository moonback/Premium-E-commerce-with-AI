import React from 'react';
import { DatabaseBackup, Plus } from 'lucide-react';

interface AdminHeaderProps {
  activeTab: string;
  onAction: () => void;
}

const tabDescriptions: Record<string, string> = {
  Overview: "Vue d'ensemble des performances de votre boutique",
  Analytics: "Analyses détaillées et métriques avancées",
  Marges: "Analyse de rentabilité et marges produits",
  Products: "Gestion complète du catalogue produits",
  Inventory: "Suivi des stocks et inventaire",
  Categories: "Organisation hiérarchique des catégories",
  "Mega Menu": "Configuration du menu de navigation",
  Orders: "Gestion des commandes clients",
  Customers: "Base de données clients",
  Discounts: "Gestion des promotions et réductions",
  Activity: "Journal d'activité système",
  Settings: "Configuration générale de la boutique",
};

export default function AdminHeader({ activeTab, onAction }: AdminHeaderProps) {
  const getActionButton = () => {
    if (activeTab === 'Products') {
      return {
        icon: Plus,
        label: "Nouveau Produit",
        variant: "primary" as const,
      };
    }
    return {
      icon: DatabaseBackup,
      label: "Sync Catalogue",
      variant: "secondary" as const,
    };
  };

  const action = getActionButton();
  const Icon = action.icon;

  return (
    <header className="mb-10 pb-8 border-b border-ink/10">
      <div className="flex justify-between items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-5xl font-light font-serif tracking-tight text-ink">
              {activeTab}
            </h1>
            <div className="px-3 py-1 bg-soft-green/30 rounded-full">
              <span className="text-xs font-bold text-ink/70 tracking-widest uppercase">
                Actif
              </span>
            </div>
          </div>
          <p className="text-ink/60 text-lg leading-relaxed max-w-2xl">
            {tabDescriptions[activeTab] || "Gérez votre boutique et vos données."}
          </p>
        </div>
        
        <button
          onClick={onAction}
          className={`
            px-8 py-4 font-bold text-xs uppercase tracking-widest
            transition-all duration-200 flex items-center gap-3
            shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
            ${action.variant === 'primary'
              ? 'bg-ink text-white hover:bg-ink/90'
              : 'bg-soft-green text-ink hover:bg-soft-green/80'
            }
          `}
        >
          <Icon className="w-5 h-5" />
          {action.label}
        </button>
      </div>
    </header>
  );
}
