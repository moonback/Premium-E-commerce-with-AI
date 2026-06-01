// src/components/FreeShippingBar.tsx
// Dynamic free shipping progress bar — P1.7
import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface FreeShippingBarProps {
  currentAmount: number;
  threshold?: number;
  className?: string;
}

export default function FreeShippingBar({
  currentAmount,
  threshold = 50,
  className,
}: FreeShippingBarProps) {
  const progress = Math.min((currentAmount / threshold) * 100, 100);
  const remaining = Math.max(threshold - currentAmount, 0);
  const isUnlocked = currentAmount >= threshold;

  return (
    <div className={cn('space-y-1.5', className)} aria-live="polite" aria-atomic="true">
      {/* Progress bar */}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={
          isUnlocked
            ? 'Livraison gratuite débloquée'
            : `${remaining.toFixed(2)}€ restants pour la livraison gratuite`
        }
      >
        <motion.div
          className={cn(
            'h-full rounded-full transition-colors',
            isUnlocked ? 'bg-emerald-500' : 'bg-accent'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Label */}
      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-ink/50">
        {isUnlocked ? (
          <span className="text-emerald-600">🎉 Livraison gratuite débloquée</span>
        ) : (
          <>
            Ajoutez{' '}
            <span className="text-ink">{remaining.toFixed(2)}€</span> pour la livraison gratuite
          </>
        )}
      </p>
    </div>
  );
}
