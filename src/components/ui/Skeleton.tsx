// src/components/ui/Skeleton.tsx
import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps {
  className?: string;
  /** Rounded pill shape */
  rounded?: boolean;
  /** Circle shape */
  circle?: boolean;
}

export function Skeleton({ className, rounded = false, circle = false }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-ink/10',
        circle ? 'rounded-full' : rounded ? 'rounded-full' : 'rounded',
        className
      )}
    />
  );
}

/** Convenience wrapper for a text line skeleton */
export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn('animate-pulse rounded bg-ink/10 h-3', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')} />
      ))}
    </div>
  );
}
