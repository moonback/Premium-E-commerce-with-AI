import React from 'react';
import { Toaster, ToastBar, toast as hotToast } from 'react-hot-toast';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Custom Toast component with Véridian design system
 * Wraps react-hot-toast with our styling
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            const isLoading = t.type === 'loading';

            return (
              <div
                className={cn(
                  'flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-sm transition-all',
                  'max-w-md',
                  isSuccess && 'border-emerald-200 bg-emerald-50/95',
                  isError && 'border-red-200 bg-red-50/95',
                  isLoading && 'border-ink/10 bg-bg/95',
                  !isSuccess && !isError && !isLoading && 'border-ink/10 bg-bg/95'
                )}
              >
                {/* Icon */}
                <div className="shrink-0">
                  {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                  {isError && <XCircle className="h-5 w-5 text-red-600" />}
                  {isLoading && (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
                  )}
                  {!isSuccess && !isError && !isLoading && (
                    <Info className="h-5 w-5 text-ink/60" />
                  )}
                </div>

                {/* Message */}
                <div className="flex-1 text-sm text-ink">{message}</div>

                {/* Close button */}
                {t.type !== 'loading' && (
                  <button
                    onClick={() => hotToast.dismiss(t.id)}
                    className="shrink-0 rounded-full p-1 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
                    aria-label="Fermer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          }}
        </ToastBar>
      )}
    </Toaster>
  );
}

// Re-export toast functions for convenience
export const toast = {
  success: (message: string) => hotToast.success(message),
  error: (message: string) => hotToast.error(message),
  loading: (message: string) => hotToast.loading(message),
  promise: hotToast.promise,
  dismiss: hotToast.dismiss,
  custom: hotToast.custom,
};
