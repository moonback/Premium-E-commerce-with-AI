// src/components/ui/Skeleton.tsx
import React from 'react';
import { cn } from '../../lib/utils';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'rounded h-4',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
};

export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
  animation = 'wave',
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  
  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  
  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  return (
    <div
      className={cn(
        'bg-ink/10 relative overflow-hidden',
        variantClasses[variant],
        animation === 'pulse' && 'animate-pulse',
        animation === 'wave' && 'skeleton-wave',
        className
      )}
      style={style}
      aria-busy="true"
      aria-live="polite"
    >
      {animation === 'wave' && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
    </div>
  );
}

// Composants de composition
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <Skeleton variant="rectangular" height={200} />
      <div className="space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
}
