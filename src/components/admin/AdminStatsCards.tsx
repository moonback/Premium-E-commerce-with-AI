import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Stat {
  label: string;
  value: string;
  change: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface AdminStatsCardsProps {
  stats: Stat[];
}

export default function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const getTrendIcon = (change: string) => {
    if (change.includes('Actif') || change.includes('En cours') || change.includes('Inscrits')) {
      return <TrendingUp className="w-4 h-4" />;
    }
    if (change.includes('0') || change.includes('Aucune')) {
      return <Minus className="w-4 h-4" />;
    }
    return <TrendingUp className="w-4 h-4" />;
  };

  const getTrendColor = (change: string) => {
    if (change.includes('Actif') || change.includes('En cours') || change.includes('Inscrits') || change.includes('Synchronisé')) {
      return 'text-green-600 bg-green-50';
    }
    if (change.includes('0') || change.includes('Aucune')) {
      return 'text-ink/40 bg-ink/5';
    }
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white border border-ink/10 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
        >
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-ink/50">
              {stat.label}
            </p>
            <div className={`p-2 rounded-lg ${getTrendColor(stat.change)}`}>
              {getTrendIcon(stat.change)}
            </div>
          </div>
          
          <div className="mb-3">
            <h3 className="text-3xl font-bold font-serif text-ink tracking-tight">
              {stat.value}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${getTrendColor(stat.change)}`}>
              {stat.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
