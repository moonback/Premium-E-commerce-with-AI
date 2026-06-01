import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'motion/react';

export interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav aria-label="Fil d'Ariane" className={`flex items-center gap-2 text-xs ${className}`}>
      <Link
        to="/"
        className="flex items-center gap-1 text-ink/50 hover:text-ink transition-colors group"
        aria-label="Retour à l'accueil"
      >
        <Home className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">Accueil</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.path}>
            <ChevronRight className="w-3.5 h-3.5 text-ink/30" aria-hidden="true" />
            {isLast ? (
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-bold text-ink uppercase tracking-wider"
                aria-current="page"
              >
                {item.label}
              </motion.span>
            ) : (
              <Link
                to={item.path}
                className="text-ink/50 hover:text-ink transition-colors uppercase tracking-wider hover:underline"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
