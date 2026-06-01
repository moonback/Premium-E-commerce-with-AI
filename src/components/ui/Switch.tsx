// src/components/ui/Switch.tsx
import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: SwitchSize;
  label?: string;
  className?: string;
}

const sizeConfig: Record<SwitchSize, { track: string; thumb: string; translate: string }> = {
  sm: {
    track: 'w-8 h-4',
    thumb: 'w-3 h-3',
    translate: 'translate-x-4',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-6 h-6',
    translate: 'translate-x-7',
  },
};

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  size = 'md',
  label,
  className,
}: SwitchProps) {
  const config = sizeConfig[size];

  return (
    <label
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={cn(
          'relative rounded-full transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          config.track,
          checked ? 'bg-accent' : 'bg-ink/20'
        )}
      >
        <motion.span
          className={cn(
            'absolute left-0.5 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md',
            config.thumb
          )}
          animate={{
            x: checked ? config.translate : '0',
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        />
      </button>
      {label && (
        <span className="text-sm font-medium text-ink select-none">
          {label}
        </span>
      )}
    </label>
  );
}
