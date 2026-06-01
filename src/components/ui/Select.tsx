// src/components/ui/Select.tsx
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className, id, ...props }, ref) => {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[10px] font-bold uppercase tracking-widest text-ink/60"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-red-500" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-describedby={errorId}
            aria-invalid={error ? 'true' : undefined}
            className={cn(
              'w-full appearance-none border bg-transparent py-3 pl-4 pr-10 text-sm text-ink',
              'transition-colors duration-200 outline-none',
              'focus:border-ink',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-red-500' : 'border-ink/20 hover:border-ink/40',
              className
            )}
            {...props}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
            aria-hidden="true"
          />
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-[11px] font-semibold text-red-500">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[11px] text-ink/40">{hint}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
