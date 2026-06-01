// src/components/ui/Tabs.tsx
import React, { useState, createContext, useContext } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within Tabs');
  }
  return context;
};

// ─── Root Component ────────────────────────────────────────────────────────
export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children: React.ReactNode;
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = 'horizontal',
  className,
  children,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;

  const handleValueChange = (newValue: string) => {
    if (!controlledValue) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider
      value={{
        activeTab: value,
        setActiveTab: handleValueChange,
        orientation,
      }}
    >
      <div
        className={cn(
          'flex',
          orientation === 'vertical' ? 'flex-row gap-6' : 'flex-col gap-4',
          className
        )}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// ─── TabsList Component ────────────────────────────────────────────────────
export interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export function TabsList({ className, children }: TabsListProps) {
  const { orientation } = useTabs();

  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={cn(
        'relative inline-flex gap-1 p-1 bg-ink/5 rounded-xl',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── TabsTrigger Component ─────────────────────────────────────────────────
export interface TabsTriggerProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function TabsTrigger({
  value,
  disabled = false,
  className,
  children,
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(
        'relative px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        isActive ? 'text-ink' : 'text-ink/50 hover:text-ink/70',
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute inset-0 bg-bg rounded-lg shadow-sm"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

// ─── TabsContent Component ─────────────────────────────────────────────────
export interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const { activeTab } = useTabs();
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <motion.div
      id={`panel-${value}`}
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
      className={cn('focus:outline-none', className)}
      tabIndex={0}
    >
      {children}
    </motion.div>
  );
}
