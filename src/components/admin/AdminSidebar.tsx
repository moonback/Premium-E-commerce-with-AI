import React, { useState, useEffect } from 'react';
import {
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  TrendingUp,
  Warehouse,
  Activity,
  Tag,
  Menu,
  DollarSign,
  LayoutDashboard,
  Truck,
  ChevronLeft,
  ChevronRight,
  Bell,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// ── Navigation groups ──────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    title: 'Tableau de bord',
    items: [
      { icon: BarChart3,      label: 'Overview',    display: 'Vue d\'ensemble', description: 'KPIs & alertes'    },
      { icon: TrendingUp,     label: 'Analytics',   display: 'Analytiques',    description: 'Courbes & rapports' },
      { icon: DollarSign,     label: 'Marges',      display: 'Marges',         description: 'Rentabilité'        },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { icon: Package,        label: 'Products',    display: 'Produits',       description: 'Catalogue'          },
      { icon: Warehouse,      label: 'Inventory',   display: 'Inventaire',     description: 'Niveaux de stock'   },
      { icon: LayoutDashboard,label: 'Categories',  display: 'Catégories',     description: 'Arborescence'       },
      { icon: Menu,           label: 'Mega Menu',   display: 'Mega Menu',      description: 'Navigation vitrine' },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { icon: ShoppingCart,   label: 'Orders',      display: 'Commandes',      description: 'Gestion & suivi'    },
      { icon: Users,          label: 'Customers',   display: 'Clients',        description: 'Base clients'       },
      { icon: Tag,            label: 'Discounts',   display: 'Promotions',     description: 'Codes & remises'    },
      { icon: Truck,          label: 'Shipping',    display: 'Livraison',      description: 'Transporteurs'      },
    ],
  },
  {
    title: 'Système',
    items: [
      { icon: Activity,       label: 'Activity',    display: 'Activité',       description: 'Journaux'           },
      { icon: Settings,       label: 'Settings',    display: 'Paramètres',     description: 'Configuration'      },
    ],
  },
];

// ── Live badge counts ──────────────────────────────────────────────────────

type Badges = { Orders: number; Inventory: number };

function useLiveBadges(): Badges {
  const [badges, setBadges] = useState<Badges>({ Orders: 0, Inventory: 0 });

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    const fetch = async () => {
      try {
        const [{ data: orders }, { data: products }] = await Promise.all([
          supabase.from('orders').select('status').eq('status', 'Nouvelle'),
          supabase.from('products').select('stock').lt('stock', 10),
        ]);
        if (!cancelled) {
          setBadges({
            Orders: orders?.length ?? 0,
            Inventory: products?.length ?? 0,
          });
        }
      } catch { /* silent */ }
    };

    fetch();
    const id = setInterval(fetch, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return badges;
}

// ── Sidebar component ──────────────────────────────────────────────────────

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const badges = useLiveBadges();

  const getBadge = (label: string): number => {
    if (label === 'Orders') return badges.Orders;
    if (label === 'Inventory') return badges.Inventory;
    return 0;
  };

  const totalAlerts = badges.Orders + badges.Inventory;

  return (
    <aside
      className={`
        relative flex flex-col bg-ink text-bg border-r border-white/5
        transition-all duration-300 ease-in-out shrink-0
        ${collapsed ? 'w-[72px]' : 'w-64'}
      `}
    >
      {/* ── Header ── */}
      <div className={`flex items-center border-b border-white/10 ${collapsed ? 'justify-center p-4' : 'gap-3 px-5 py-5'}`}>
        <div className="relative shrink-0">
          <div className="w-9 h-9 bg-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-ink" />
          </div>
          {totalAlerts > 0 && collapsed && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          )}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-serif text-base font-light text-bg leading-tight">Véridian</p>
            <p className="text-[10px] text-bg/40 uppercase tracking-[0.2em]">Administration</p>
          </div>
        )}
      </div>

      {/* ── Alerts strip (expanded only) ── */}
      {!collapsed && totalAlerts > 0 && (
        <div className="mx-3 mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <p className="text-[10px] text-red-300 leading-tight">
            {badges.Orders > 0 && `${badges.Orders} commande${badges.Orders > 1 ? 's' : ''} en attente`}
            {badges.Orders > 0 && badges.Inventory > 0 && ' · '}
            {badges.Inventory > 0 && `${badges.Inventory} stock${badges.Inventory > 1 ? 's' : ''} faible${badges.Inventory > 1 ? 's' : ''}`}
          </p>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-1">
            {/* Group label */}
            {!collapsed && (
              <p className="px-5 pt-3 pb-1 text-[9px] uppercase tracking-[0.3em] text-bg/25 font-medium select-none">
                {group.title}
              </p>
            )}
            {collapsed && <div className="mx-3 my-2 border-t border-white/10" />}

            {group.items.map((item) => {
              const isActive = activeTab === item.label;
              const badge = getBadge(item.label);
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  onClick={() => onTabChange(item.label)}
                  title={collapsed ? item.display : undefined}
                  className={`
                    relative w-full flex items-center transition-all duration-150 group
                    ${collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5 mx-2 w-[calc(100%-16px)]'}
                    ${isActive
                      ? 'bg-accent/15 text-accent'
                      : 'text-bg/50 hover:text-bg hover:bg-white/5'
                    }
                  `}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r-full" />
                  )}

                  {/* Icon */}
                  <div className={`shrink-0 ${collapsed ? '' : 'w-7 h-7 flex items-center justify-center'}`}>
                    <Icon className={`transition-colors ${collapsed ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'text-accent' : ''}`} />
                  </div>

                  {/* Label + description */}
                  {!collapsed && (
                    <div className="flex-1 text-left min-w-0">
                      <p className={`text-[13px] font-medium leading-tight truncate ${isActive ? 'text-accent' : 'text-bg/80'}`}>
                        {item.display}
                      </p>
                      <p className="text-[10px] text-bg/30 truncate leading-tight mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  )}

                  {/* Badge */}
                  {badge > 0 && (
                    <span className={`
                      shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold
                      flex items-center justify-center
                      ${isActive ? 'bg-accent text-ink' : 'bg-red-500 text-white'}
                      ${collapsed ? 'absolute top-1.5 right-2' : ''}
                    `}>
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5">
            <div className="w-6 h-6 bg-accent/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-bg/40 uppercase tracking-[0.15em]">Plateforme</p>
              <p className="text-xs font-mono text-bg/60">v2.4 · Active</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="absolute -right-3 top-[72px] w-6 h-6 bg-ink border border-white/10 flex items-center justify-center text-bg/50 hover:text-bg transition-colors z-10"
        title={collapsed ? 'Développer' : 'Réduire'}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft className="w-3 h-3" />
        }
      </button>
    </aside>
  );
}
