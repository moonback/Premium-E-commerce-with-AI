import React from 'react';
import { Star, TrendingUp, Award, Sparkles, Clock } from 'lucide-react';
import { ProductBadge } from '../types';

interface ProductBadgesManagerProps {
  badges: ProductBadge[];
  onChange: (badges: ProductBadge[]) => void;
}

const BADGE_OPTIONS: { value: ProductBadge; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'featured', label: 'En Vedette', icon: Star, color: 'text-yellow-600' },
  { value: 'bestseller', label: 'Best Seller', icon: Award, color: 'text-purple-600' },
  { value: 'top_sales', label: 'Meilleures Ventes', icon: TrendingUp, color: 'text-green-600' },
  { value: 'new', label: 'Nouveau', icon: Sparkles, color: 'text-blue-600' },
  { value: 'limited', label: 'Édition Limitée', icon: Clock, color: 'text-red-600' },
];

export default function ProductBadgesManager({ badges, onChange }: ProductBadgesManagerProps) {
  const handleToggleBadge = (badge: ProductBadge) => {
    if (badges.includes(badge)) {
      onChange(badges.filter(b => b !== badge));
    } else {
      onChange([...badges, badge]);
    }
  };

  return (
    <div className="space-y-4 border border-ink/10 p-6 bg-soft-green/5 rounded">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-ink/60" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-ink/70">
          Badges Produit
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {BADGE_OPTIONS.map(({ value, label, icon: Icon, color }) => (
          <label
            key={value}
            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
              badges.includes(value)
                ? 'border-ink bg-soft-green/20'
                : 'border-ink/10 hover:border-ink/30 bg-white/50'
            }`}
          >
            <input
              type="checkbox"
              checked={badges.includes(value)}
              onChange={() => handleToggleBadge(value)}
              className="accent-ink"
            />
            <Icon className={`w-5 h-5 ${color}`} />
            <span className="text-sm font-bold">{label}</span>
          </label>
        ))}
      </div>

      {badges.length > 0 && (
        <div className="mt-4 p-3 bg-soft-green/20 border border-ink/10 rounded text-xs">
          <p className="font-bold mb-1">Badges sélectionnés :</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {badges.map(badge => {
              const option = BADGE_OPTIONS.find(o => o.value === badge);
              if (!option) return null;
              const Icon = option.icon;
              return (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-ink text-white rounded-full text-xs font-bold"
                >
                  <Icon className="w-3 h-3" />
                  {option.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-soft-green/20 border border-ink/10 rounded text-xs text-ink/60">
        <p className="font-bold mb-1">💡 Utilisation des badges :</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>En Vedette</strong> : Produits mis en avant sur la page d'accueil</li>
          <li><strong>Best Seller</strong> : Produits populaires auprès des clients</li>
          <li><strong>Meilleures Ventes</strong> : Produits avec le plus de ventes</li>
          <li><strong>Nouveau</strong> : Produits récemment ajoutés au catalogue</li>
          <li><strong>Édition Limitée</strong> : Produits en quantité limitée</li>
        </ul>
      </div>
    </div>
  );
}
