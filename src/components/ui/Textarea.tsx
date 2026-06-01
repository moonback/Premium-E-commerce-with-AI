// src/components/ui/Textarea.tsx
import React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = error ? `${textareaId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-[10px] font-bold uppercase tracking-widest text-ink/60"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-red-500" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          aria-describedby={errorId}
          aria-invalid={error ? 'true' : undefined}
          rows={props.rows ?? 4}
          className={cn(
            'w-full resize-y border bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink/30',
            'transition-colors duration-200 outline-none',
            'focus:border-ink',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-red-500' : 'border-ink/20 hover:border-ink/40',
            className
          )}
          {...props}
        />

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
Textarea.displayName = 'Textarea';
