import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Stat {
  label: string;
  value: string;
  change: string;
  icon?: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  delta?: number;
  history?: number[];
}

interface AdminStatsCardsProps {
  stats: Stat[];
}

// ── Sparkline (pure CSS bars) ──────────────────────────────────────────────
function Sparkline({ history, trend }: { history: number[]; trend?: 'up' | 'down' | 'neutral' }) {
  if (!history || history.length === 0) return null;
  const max = Math.max(...history, 1);
  const barColor = trend === 'up' ? 'bg-emerald-400' : trend === 'down' ? 'bg-red-400' : 'bg-ink/20';
  return (
    <div className="flex items-end gap-px h-8 mt-3" role="img" aria-label="Historique">
      {history.map((val, i) => (
        <div
          key={i}
          className={`flex-1 transition-all duration-300 ${i === history.length - 1 ? 'opacity-100' : 'opacity-40'} ${barColor}`}
          style={{ height: `${Math.max(Math.round((val / max) * 100), 8)}%` }}
        />
      ))}
    </div>
  );
}

// ── Trend badge ────────────────────────────────────────────────────────────
function TrendBadge({ trend, delta, change }: { trend?: 'up' | 'down' | 'neutral'; delta?: number; change: string }) {
  if (delta !== undefined && trend) {
    const styles = trend === 'up' ? 'text-emerald-700 bg-emerald-50' : trend === 'down' ? 'text-red-600 bg-red-50' : 'text-ink/40 bg-ink/5';
    const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 uppercase tracking-wider ${styles}`}>
        <Icon className="w-3 h-3" />
        {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{Math.abs(delta)}%
      </span>
    );
  }
  const isPositive = change.includes('Actif') || change.includes('En cours') || change.includes('Inscrits') || change.includes('Synchronisé');
  const isNeutral = change.includes('0') || change.includes('Aucune');
  const styles = isNeutral ? 'text-ink/40 bg-ink/5' : isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-blue-600 bg-blue-50';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 uppercase tracking-wider ${styles}`}>
      {isNeutral ? <Minus className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
      {change}
    </span>
  );
}

// ── Corner icon ────────────────────────────────────────────────────────────
function CornerIcon({ trend, change }: { trend?: 'up' | 'down' | 'neutral'; change: string }) {
  const resolved = trend ?? (change.includes('Actif') || change.includes('En cours') ? 'up' : 'neutral');
  const styles = resolved === 'up' ? 'text-emerald-600 bg-emerald-50' : resolved === 'down' ? 'text-red-500 bg-red-50' : 'text-ink/30 bg-ink/5';
  const Icon = resolved === 'up' ? TrendingUp : resolved === 'down' ? TrendingDown : Minus;
  return <div className={`p-2 ${styles}`}><Icon className="w-4 h-4" /></div>;
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
      {stats.map((stat, i) => {
        const StatIcon = stat.icon;
        return (
          <div
            key={i}
            className="bg-white border border-ink/10 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                {StatIcon && (
                  <div className="w-7 h-7 bg-soft-green flex items-center justify-center shrink-0">
                    <StatIcon className="w-3.5 h-3.5 text-ink/60" />
                  </div>
                )}
                <p className="text-xs font-bold uppercase tracking-widest text-ink/50">{stat.label}</p>
              </div>
              <CornerIcon trend={stat.trend} change={stat.change} />
            </div>

            {/* Value */}
            <h3 className="text-3xl font-light font-serif text-ink tracking-tight mb-3">
              {stat.value}
            </h3>

            {/* Badge */}
            <TrendBadge trend={stat.trend} delta={stat.delta} change={stat.change} />

            {/* Sparkline */}
            {stat.history && <Sparkline history={stat.history} trend={stat.trend} />}
          </div>
        );
      })}
    </div>
  );
}
