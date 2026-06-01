// src/components/BottomNav.tsx
// Bottom navigation bar for mobile — P1.6
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useStore } from '../store';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  action?: () => void;
}

export default function BottomNav() {
  const location = useLocation();
  const { cart, favorites, setCartOpen, setAuthModalOpen, user } = useStore();

  // Hide on non-store routes
  const hiddenRoutes = ['/pos', '/admin', '/screen', '/checkout'];
  if (hiddenRoutes.some(r => location.pathname.startsWith(r))) return null;

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const items: NavItem[] = [
    { to: '/', icon: Home, label: 'Accueil' },
    { to: '/?search=1', icon: Search, label: 'Recherche' },
    { to: '/profile', icon: Heart, label: 'Favoris', badge: favorites.length > 0 ? favorites.length : undefined },
    {
      to: '#cart',
      icon: ShoppingBag,
      label: 'Panier',
      badge: cartCount > 0 ? cartCount : undefined,
      action: () => setCartOpen(true),
    },
    {
      to: user ? '/profile' : '#auth',
      icon: User,
      label: user ? 'Compte' : 'Connexion',
      action: !user ? () => setAuthModalOpen(true) : undefined,
    },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-bg/95 backdrop-blur-md md:hidden"
    >
      <ul className="flex items-center justify-around px-2 py-2" role="list">
        {items.map(({ to, icon: Icon, label, badge, action }) => {
          const isActive =
            to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to.split('?')[0]) && to !== '#cart' && to !== '#auth';

          const handleClick = (e: React.MouseEvent) => {
            if (action) {
              e.preventDefault();
              action();
            }
          };

          return (
            <li key={label} className="flex-1">
              <Link
                to={action ? '#' : to}
                onClick={handleClick}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-1 py-1.5 px-2 transition-colors',
                  isActive ? 'text-ink' : 'text-ink/40 hover:text-ink/70'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-ink"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
                  {badge !== undefined && badge > 0 && (
                    <motion.span
                      key={badge}
                      initial={{ scale: 0.7 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] font-bold text-bg"
                    >
                      {badge > 9 ? '9+' : badge}
                    </motion.span>
                  )}
                </span>

                <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
