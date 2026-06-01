// src/components/ui/Input.tsx
import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, rightAddon, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[10px] font-bold uppercase tracking-widest text-ink/60"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <span className="pointer-events-none absolute left-3 text-ink/40" aria-hidden="true">
              {leftAddon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-describedby={cn(errorId, hintId) || undefined}
            aria-invalid={error ? 'true' : undefined}
            className={cn(
              'w-full border bg-transparent py-3 text-sm text-ink placeholder:text-ink/30',
              'transition-colors duration-200 outline-none',
              'focus:border-ink focus:ring-0',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-red-500 focus:border-red-500'
                : 'border-ink/20 hover:border-ink/40',
              leftAddon ? 'pl-10' : 'pl-4',
              rightAddon ? 'pr-10' : 'pr-4',
              className
            )}
            {...props}
          />

          {rightAddon && (
            <span className="pointer-events-none absolute right-3 text-ink/40" aria-hidden="true">
              {rightAddon}
            </span>
          )}
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-[11px] font-semibold text-red-500">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-[11px] text-ink/40">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
