// src/components/ui/Drawer.tsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type DrawerSide = 'bottom' | 'right' | 'left';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: DrawerSide;
  className?: string;
}

const sideVariants: Record<DrawerSide, { initial: object; animate: object; exit: object; panelClass: string }> = {
  bottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    panelClass: 'inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl',
  },
  right: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    panelClass: 'inset-y-0 right-0 w-full max-w-md',
  },
  left: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    panelClass: 'inset-y-0 left-0 w-full max-w-md',
  },
};

export function Drawer({ open, onClose, title, children, side = 'bottom', className }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { initial, animate, exit, panelClass } = sideVariants[side];

  // ESC to close + focus trap
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
      )?.focus();
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      prev?.focus();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={initial}
            animate={animate}
            exit={exit}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className={cn(
              'fixed z-50 flex flex-col bg-bg shadow-2xl border border-ink/10',
              panelClass,
              className
            )}
          >
            {/* Drag handle for bottom drawer */}
            {side === 'bottom' && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-ink/20" aria-hidden="true" />
              </div>
            )}

            {title && (
              <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
                <h2 className="font-serif text-lg text-ink">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Fermer"
                  className="rounded-full p-1.5 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
