// src/components/ui/Button.tsx
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { Loader2, Check } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  ripple?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-ink text-bg border border-ink hover:bg-ink/90 focus-visible:ring-ink disabled:bg-ink/40 disabled:border-ink/40',
  secondary:
    'bg-soft-green text-ink border border-ink/20 hover:bg-soft-green/70 focus-visible:ring-ink/30 disabled:opacity-50',
  ghost:
    'bg-transparent text-ink border border-transparent hover:bg-ink/5 focus-visible:ring-ink/30 disabled:opacity-40',
  outline:
    'bg-transparent text-ink border border-ink hover:bg-ink/5 focus-visible:ring-ink disabled:opacity-40',
  danger:
    'bg-red-600 text-white border border-red-600 hover:bg-red-700 focus-visible:ring-red-500 disabled:opacity-50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[10px] tracking-widest',
  md: 'px-6 py-3 text-xs tracking-widest',
  lg: 'px-8 py-4 text-xs tracking-widest',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      success = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      ripple = true,
      className,
      children,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !isDisabled) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();

        setRipples((prev) => [...prev, { x, y, id }]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 600);
      }

      onClick?.(e);
    };

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        onClick={handleClick}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 font-bold uppercase transition-all duration-200 overflow-hidden',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {/* Ripple effect */}
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 0,
              height: 0,
            }}
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{
              width: 300,
              height: 300,
              opacity: 0,
              x: -150,
              y: -150,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}

        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : success ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </motion.span>
          ) : (
            leftIcon && <span aria-hidden="true">{leftIcon}</span>
          )}
          {children}
          {!loading && !success && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
