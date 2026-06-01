// src/components/SkipLinks.tsx
import React from 'react';
import { cn } from '../lib/utils';
import { layers } from '../styles/tokens/layers';

interface SkipLink {
  href: string;
  label: string;
}

const skipLinks: SkipLink[] = [
  { href: '#main-content', label: 'Aller au contenu principal' },
  { href: '#navigation', label: 'Aller à la navigation' },
  { href: '#footer', label: 'Aller au pied de page' },
];

export default function SkipLinks() {
  return (
    <div className="skip-links" style={{ zIndex: layers.skipLink }}>
      {skipLinks.map(({ href, label }) => (
        <a
          key={href}
          href={href}
          className={cn(
            'skip-link',
            'sr-only focus:not-sr-only',
            'fixed top-4 left-4',
            'px-6 py-3 bg-accent text-bg',
            'font-bold uppercase tracking-widest text-xs',
            'rounded-lg shadow-2xl',
            'focus:outline-none focus:ring-4 focus:ring-accent/50',
            'transition-all duration-200',
            'hover:bg-accent/90'
          )}
        >
          {label}
        </a>
      ))}
    </div>
  );
}
