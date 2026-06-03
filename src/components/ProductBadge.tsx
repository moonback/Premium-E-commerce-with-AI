// src/components/ProductBadge.tsx
import React from 'react';
import { motion } from 'motion/react';
import type { TargetAndTransition, Transition } from 'motion/react';
import { cn } from '../lib/utils';
import { Sparkles, TrendingUp, AlertCircle, Tag, Flame } from 'lucide-react';

export type BadgeType = 'new' | 'promo' | 'lowStock' | 'bestseller' | 'trending' | 'exclusive';

export interface ProductBadgeProps {
  type: BadgeType;
  value?: string | number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

const badgeConfig: Record<
  BadgeType,
  {
    icon: React.ElementType;
    bgColor: string;
    textColor: string;
    animation?: 'pulse' | 'bounce' | 'glow';
  }
> = {
  new: {
    icon: Sparkles,
    bgColor: 'bg-accent',
    textColor: 'text-bg',
    animation: 'pulse',
  },
  promo: {
    icon: Tag,
    bgColor: 'bg-red-600',
    textColor: 'text-white',
    animation: 'bounce',
  },
  lowStock: {
    icon: AlertCircle,
    bgColor: 'bg-amber-500',
    textColor: 'text-bg',
    animation: 'pulse',
  },
  bestseller: {
    icon: TrendingUp,
    bgColor: 'bg-emerald-600',
    textColor: 'text-white',
  },
  trending: {
    icon: Flame,
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    animation: 'glow',
  },
  exclusive: {
    icon: Sparkles,
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
  },
};

const positionClasses: Record<string, string> = {
  'top-left': 'top-3 left-3',
  'top-right': 'top-3 right-3',
  'bottom-left': 'bottom-3 left-3',
  'bottom-right': 'bottom-3 right-3',
};

type AnimationConfig = {
  animate: TargetAndTransition;
  transition: Transition;
};

const animations: Record<string, AnimationConfig> = {
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  bounce: {
    animate: {
      y: [0, -4, 0],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  glow: {
    animate: {
      boxShadow: [
        '0 0 0px rgba(255, 255, 255, 0)',
        '0 0 20px rgba(255, 255, 255, 0.5)',
        '0 0 0px rgba(255, 255, 255, 0)',
      ],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export function ProductBadge({
  type,
  value,
  position = 'top-right',
  className,
}: ProductBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;
  const animationConfig: Partial<AnimationConfig> = config.animation ? animations[config.animation] : {};

  const getLabel = () => {
    switch (type) {
      case 'new': return 'Nouveau';
      case 'promo': return value ? `-${value}%` : 'Promo';
      case 'lowStock': return value ? `Stock: ${value}` : 'Stock limité';
      case 'bestseller': return 'Best-seller';
      case 'trending': return 'Tendance';
      case 'exclusive': return 'Exclusif';
      default: return '';
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, ...(animationConfig.animate ?? {}) }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 25,
        ...(animationConfig.transition ?? {}),
      }}
      className={cn(
        'absolute z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shadow-lg',
        'text-xs font-bold uppercase tracking-wider',
        config.bgColor,
        config.textColor,
        positionClasses[position],
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{getLabel()}</span>
    </motion.div>
  );
}

// Composant pour gérer plusieurs badges
export interface ProductBadgesProps {
  isNew?: boolean;
  discount?: number;
  stock?: number;
  isBestseller?: boolean;
  isTrending?: boolean;
  isExclusive?: boolean;
  className?: string;
}

export function ProductBadges({
  isNew,
  discount,
  stock,
  isBestseller,
  isTrending,
  isExclusive,
  className,
}: ProductBadgesProps) {
  const badges: Array<{ type: BadgeType; value?: string | number; position: any }> = [];

  // Priorité des badges (max 2 visibles)
  if (discount && discount > 0) {
    badges.push({ type: 'promo', value: discount, position: 'top-right' });
  }
  
  if (isNew && badges.length < 2) {
    badges.push({ type: 'new', position: 'top-left' });
  }
  
  if (stock !== undefined && stock > 0 && stock < 5 && badges.length < 2) {
    badges.push({ type: 'lowStock', value: stock, position: 'top-right' });
  }
  
  if (isBestseller && badges.length < 2) {
    badges.push({ type: 'bestseller', position: 'top-left' });
  }
  
  if (isTrending && badges.length < 2) {
    badges.push({ type: 'trending', position: 'top-left' });
  }
  
  if (isExclusive && badges.length < 2) {
    badges.push({ type: 'exclusive', position: 'top-left' });
  }

  if (badges.length === 0) return null;

  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      {badges.map((badge, index) => (
        <ProductBadge
          key={`${badge.type}-${index}`}
          type={badge.type}
          value={badge.value}
          position={badge.position}
        />
      ))}
    </div>
  );
}
