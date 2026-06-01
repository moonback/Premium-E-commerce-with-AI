import React, { useState, useEffect } from 'react';
import {
  DatabaseBackup, Plus, Truck, LayoutDashboard, BarChart2, TrendingUp,
  Package, Warehouse, Tag, Menu, ShoppingCart, Users, Percent,
  Activity, Settings, ChevronRight, Boxes,
} from 'lucide-react';

interface AdminHeaderProps {
  activeTab: string;
  onAction: () => void;
}

interface TabConfig {
  displayName: string;
  icon: React.ElementType;
  description: string;
}

const tabConfig: Record<string, TabConfig> = {
  Overview:    { displayName: "Vue d'ensemble", icon: LayoutDashboard, description: "Performances globales et indicateurs clés de votre boutique" },
  Analytics:   { displayName: "Analytiques",    icon: BarChart2,       description: "Analyses détaillées, métriques avancées et tendances" },
  Marges:      { displayName: "Marges",          icon: TrendingUp,      description: "Analyse de rentabilité et marges produits" },
  Products:    { displayName: "Produits",        icon: Package,         description: "Gestion complète du catalogue produits" },
  Inventory:   { displayName: "Inventaire",      icon: Warehouse,       description: "Suivi des stocks et gestion de l'inventaire" },
  Categories:  { displayName: "Catégories",      icon: Tag,             description: "Organisation hiérarchique des catégories" },
  'Mega Menu': { displayName: "Mega Menu",       icon: Menu,            description: "Configuration du menu de navigation principal" },
  Orders:      { displayName: "Commandes",       icon: ShoppingCart,    description: "Gestion et suivi des commandes clients" },
  Customers:   { displayName: "Clients",         icon: Users,           description: "Base de données et profils clients" },
  Discounts:   { displayName: "Promotions",      icon: Percent,         description: "Gestion des codes promo et réductions" },
  Shipping:    { displayName: "Livraison",       icon: Truck,           description: "Transporteurs, zones et tarifs de livraison" },
  Activity:    { displayName: "Activité",        icon: Activity,        description: "Journal d'activité et historique système" },
  Settings:    { displayName: "Paramètres",      icon: Settings,        description: "Configuration générale de la boutique" },
};

interface ActionConfig {
  icon: React.ElementType;
  label: string;
  variant: 'primary' | 'secondary';
  hidden?: boolean;
}

function getActionConfig(activeTab: string): ActionConfig {
  switch (activeTab) {
    case 'Products':  return { icon: Plus,           label: 'Nouveau Produit',      variant: 'primary' };
    case 'Shipping':  return { icon: Truck,          label: 'Ajouter transporteur', variant: 'primary' };
    case 'Settings':  return { icon: Settings,       label: '',                     variant: 'secondary', hidden: true };
    default:          return { icon: DatabaseBackup, label: 'Sync Catalogue',       variant: 'secondary' };
  }
}

function formatDateTime(date: Date): string {
  return (
    date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
    ' · ' +
    date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );
}

function useLiveClock(): string {
  const [time, setTime] = useState(() => formatDateTime(new Date()));
  useEffect(() => {
    const tick = () => setTime(formatDateTime(new Date()));
    const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000 - new Date().getMilliseconds();
    const timeout = setTimeout(() => {
      tick();
      const interval = setInterval(tick, 60_000);
      return () => clearInterval(interval);
    }, msUntilNextMinute);
    return () => clearTimeout(timeout);
  }, []);
  return time;
}

export default function AdminHeader({ activeTab, onAction }: AdminHeaderProps) {
  const config = tabConfig[activeTab] ?? {
    displayName: activeTab,
    icon: LayoutDashboard,
    description: 'Gérez votre boutique et vos données.',
  };
  const action = getActionConfig(activeTab);
  const ActionIcon = action.icon;
  const TabIcon = config.icon;
  const datetime = useLiveClock();

  return (
    <header className="mb-10 pb-8 border-b border-ink/10">
      {/* Breadcrumb + clock */}
      <div className="flex items-center justify-between mb-5">
        <nav className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-ink/40">
          <span>Admin</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-accent font-semibold">{config.displayName}</span>
        </nav>
        <time className="text-xs uppercase tracking-widest text-ink/40 tabular-nums">
          {datetime}
        </time>
      </div>

      {/* Main row */}
      <div className="flex justify-between items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 bg-soft-green flex items-center justify-center shrink-0">
              <TabIcon className="w-5 h-5 text-ink/70" />
            </div>
            <h1 className="text-4xl font-light font-serif tracking-tight text-ink">
              {config.displayName}
            </h1>
            <div className="px-3 py-1 bg-soft-green/40">
              <span className="text-xs font-bold text-ink/60 tracking-widest uppercase">Actif</span>
            </div>
          </div>
          <p className="text-ink/55 text-base leading-relaxed max-w-2xl pl-14">
            {config.description}
          </p>
        </div>

        {!action.hidden && (
          <button
            onClick={onAction}
            className={`
              px-7 py-3.5 font-bold text-xs uppercase tracking-widest
              transition-all duration-200 flex items-center gap-2.5 shrink-0 border
              ${action.variant === 'primary'
                ? 'bg-ink text-white border-ink hover:bg-ink/85'
                : 'bg-soft-green text-ink border-soft-green hover:bg-soft-green/70'
              }
            `}
          >
            <ActionIcon className="w-4 h-4" />
            {action.label}
          </button>
        )}
      </div>
    </header>
  );
}
