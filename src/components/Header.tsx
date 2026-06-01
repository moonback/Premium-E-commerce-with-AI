// src/components/Header.tsx
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ShoppingBag, Search, User, LogOut, LayoutDashboard, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import MegaMenu from './MegaMenu';
import AdvancedSearchModal from './AdvancedSearchModal';

export default function Header() {
  const { cart, user, loyaltyPoints, setUser, setAuthModalOpen, setCartOpen } = useStore();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.header-dropdown')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    toast.success('Vous avez été déconnecté');
    navigate('/');
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-bg/80 backdrop-blur-md border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-16 md:h-20">

            {/* Left — logo */}
            <div className="flex items-center gap-4 lg:gap-8">
              <Link to="/" className="text-2xl font-bold tracking-tighter font-serif italic text-ink">
                Véridian
              </Link>
            </div>

            {/* Right — search, loyalty, account, cart */}
            <div className="flex items-center gap-3 md:gap-5">

              {/* Search button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Rechercher"
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink/60 hover:text-ink hover:bg-ink/5 rounded-lg transition-colors"
              >
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">Rechercher</span>
                <kbd className="hidden lg:inline-block px-2 py-0.5 text-[10px] font-mono bg-ink/5 rounded">
                  /
                </kbd>
              </button>

              {/* Loyalty points — desktop only */}
              {user && (
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-[10px] uppercase opacity-50 font-bold tracking-tighter">Points</span>
                  <span className="text-sm font-semibold text-accent">{loyaltyPoints.toLocaleString()} pts</span>
                </div>
              )}

              {/* Account dropdown */}
              <div className="relative header-dropdown">
                <button
                  onClick={() => {
                    if (!user) {
                      setAuthModalOpen(true);
                    } else {
                      setIsDropdownOpen(prev => !prev);
                    }
                  }}
                  aria-label={user ? 'Mon compte' : 'Se connecter'}
                  aria-expanded={isDropdownOpen}
                  className="text-ink/60 hover:text-ink transition-colors flex items-center gap-2 py-2"
                >
                  {user ? (
                    <span className="hidden md:inline text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-ink text-bg rounded">
                      {user.email.split('@')[0]}
                    </span>
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </button>

                {user && isDropdownOpen && (
                  <div className="absolute top-full right-0 pt-2 z-50">
                    <div className="bg-bg border border-ink/10 shadow-xl p-2 w-48 text-xs font-bold uppercase tracking-widest flex flex-col gap-1">
                      <div className="px-3 py-2 opacity-50 mb-1 border-b border-ink/10 truncate">{user.email}</div>
                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="p-3 hover:bg-soft-green transition-colors text-left flex items-center gap-2 text-ink"
                      >
                        <User className="w-4 h-4" /> Mon Profil
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="p-3 hover:bg-soft-green transition-colors text-left flex items-center gap-2 text-ink"
                        >
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                        className="p-3 mt-1 text-red-600 hover:bg-red-50 transition-colors text-left flex items-center gap-2 border-t border-ink/10"
                      >
                        <LogOut className="w-4 h-4" /> Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart button */}
              <motion.button
                data-cart-button="true"
                onClick={() => setCartOpen(true)}
                aria-label={`Panier, ${cartCount} article${cartCount !== 1 ? 's' : ''}`}
                className="text-ink/60 hover:text-ink transition-colors relative p-1"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-ink text-bg rounded-full text-[10px] flex items-center justify-center font-bold"
                    aria-hidden="true"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </motion.button>
            </div>
          </div>

          {/* Mega Menu - Desktop only */}
          <div className="hidden lg:block pb-4">
            <MegaMenu />
          </div>
        </div>
      </header>

      {/* Advanced Search Modal */}
      <AdvancedSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
