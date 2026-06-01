import React from 'react';
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
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  { icon: BarChart3,     label: "Overview",   display: "Tableau de bord", description: "Vue d'ensemble"  },
  { icon: TrendingUp,   label: "Analytics",  display: "Analytiques",     description: "Analyses"         },
  { icon: DollarSign,   label: "Marges",     display: "Marges",          description: "Rentabilité"      },
  { icon: Package,      label: "Products",   display: "Produits",        description: "Catalogue"        },
  { icon: Warehouse,    label: "Inventory",  display: "Inventaire",      description: "Stock"            },
  { icon: LayoutDashboard, label: "Categories", display: "Catégories",   description: "Hiérarchie"       },
  { icon: Menu,         label: "Mega Menu",  display: "Mega Menu",       description: "Navigation"       },
  { icon: ShoppingCart, label: "Orders",     display: "Commandes",       description: "Gestion commandes"},
  { icon: Users,        label: "Customers",  display: "Clients",         description: "Base clients"     },
  { icon: Tag,          label: "Discounts",  display: "Promotions",      description: "Codes & remises"  },
  { icon: Truck,        label: "Shipping",   display: "Livraison",       description: "Transporteurs"    },
  { icon: Activity,     label: "Activity",   display: "Activité",        description: "Journaux"         },
  { icon: Settings,     label: "Settings",   display: "Paramètres",      description: "Configuration"    },
];

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  return (
    <aside className="w-72 bg-gradient-to-b from-ink/5 to-transparent border-r border-ink/10 flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-ink/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-ink rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl font-serif text-ink tracking-tight">
              Admin Panel
            </h1>
            <p className="text-xs text-ink/50 tracking-wide">Gestion boutique</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = activeTab === item.label;
            return (
              <button
                key={item.label}
                onClick={() => onTabChange(item.label)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-ink text-white shadow-lg shadow-ink/20' 
                    : 'text-ink/60 hover:bg-soft-green/30 hover:text-ink'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-white/20' 
                    : 'bg-ink/5 group-hover:bg-ink/10'
                  }
                `}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className={`
                    text-sm font-bold tracking-wide
                    ${isActive ? 'text-white' : 'text-ink/80'}
                  `}>
                    {item.display}
                  </div>
                  <div className={`
                    text-xs tracking-wide
                    ${isActive ? 'text-white/70' : 'text-ink/40'}
                  `}>
                    {item.description}
                  </div>
                </div>
                {isActive && (
                  <div className="w-1 h-8 bg-white/50 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-ink/10">
        <div className="bg-soft-green/20 rounded-lg p-4">
          <p className="text-xs font-bold text-ink/70 mb-1">Version</p>
          <p className="text-sm font-mono text-ink">v2.0.0</p>
        </div>
      </div>
    </aside>
  );
}
