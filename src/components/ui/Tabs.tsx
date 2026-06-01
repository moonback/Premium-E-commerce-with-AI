// src/components/ui/Tabs.tsx
import React, { createContext, useContext, useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface TabsContextValue {
  value: string;
  onChange: (v: string) => void;
  layoutId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs sub-components must be used inside <Tabs>');
  return ctx;
}

export interface TabsProps {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onChange, children, className }: TabsProps) {
  const layoutId = useId();
  return (
    <TabsContext.Provider value={{ value, onChange, layoutId }}>
      <div className={cn('flex flex-col', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 border-b border-ink/10 overflow-x-auto scrollbar-hide',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface TabTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabTrigger({ value, children, className }: TabTriggerProps) {
  const { value: active, onChange, layoutId } = useTabsContext();
  const isActive = active === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => onChange(value)}
      className={cn(
        'relative px-4 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1',
        isActive ? 'text-ink' : 'text-ink/40 hover:text-ink/70',
        className
      )}
    >
      {children}
      {isActive && (
        <motion.span
          layoutId={`tab-indicator-${layoutId}`}
          className="absolute inset-x-0 bottom-0 h-0.5 bg-ink"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}

export function TabPanel({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value: active } = useTabsContext();
  if (active !== value) return null;
  return (
    <div role="tabpanel" className={cn('pt-4', className)}>
      {children}
    </div>
  );
}
