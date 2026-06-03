// src/components/Header.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { ShoppingBag, Search, User, LogOut, LayoutDashboard, X, Heart, Package, Award, Menu, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import MegaMenu from './MegaMenu';
import AdvancedSearchModal from './AdvancedSearchModal';

export default function Header() {
  const { cart, user, loyaltyPoints, wishlist, categories, setUser, setAuthModalOpen, setCartOpen } = useStore();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);

  // Detect scroll for header style changes
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    toast.success('Vous avez été déconnecté');
    navigate('/');
  };

  const handleMegaMenuOpenChange = useCallback((open: boolean) => {
    setIsMegaMenuOpen(open);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Mobile categories from store
  const mobileCategories = categories.filter(c => c.level === 1);

  return (
    <>
      <header className={`sticky top-0 z-40 w-full transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/98 backdrop-blur-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-b border-ink/5' 
          : 'bg-bg backdrop-blur-md border-b border-ink/10'
      }`}>
        {/* Top promotional banner — marquee style */}
        <div className="bg-gradient-to-r from-ink via-ink/95 to-ink text-white overflow-hidden">
          <div className="relative py-2 px-4">
            <div className="flex items-center justify-center gap-8 text-[10px] md:text-[11px] font-medium uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2 opacity-80">
                <Sparkles className="w-3 h-3 text-accent" />
                Livraison gratuite dès 100€
              </span>
              <span className="hidden md:flex items-center gap-2 opacity-60">•</span>
              <span className="hidden md:flex items-center gap-2 opacity-80">
                Retours gratuits sous 30 jours
              </span>
              <span className="hidden lg:flex items-center gap-2 opacity-60">•</span>
              <span className="hidden lg:flex items-center gap-2 opacity-80">
                Paiement sécurisé SSL
              </span>
            </div>
          </div>
        </div>

        {/* Main header bar — Logo | MegaMenu | Actions */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center h-16 md:h-[72px]">

            {/* Left — Mobile menu button + Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-ink/60 hover:text-ink transition-colors p-2 -ml-2"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link 
                to="/" 
                className="group flex flex-col items-start"
              >
                <span className="text-xl md:text-2xl font-bold tracking-tight font-serif italic text-ink group-hover:text-accent transition-colors duration-300">
                  Véridian
                </span>
                <span className="text-[7px] md:text-[8px] uppercase tracking-[0.25em] text-ink/30 -mt-0.5 font-medium">
                  Maison de Qualité
                </span>
              </Link>
            </div>

            {/* Center — MegaMenu (desktop navigation) */}
            <div className="hidden lg:flex items-center justify-center flex-1 mx-8">
              <MegaMenu onOpenChange={handleMegaMenuOpenChange} />
            </div>

            {/* Right — Search, loyalty, account, wishlist, cart */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 ml-auto">

              {/* Search button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Rechercher"
                className="group flex items-center gap-2 px-3 py-2 text-ink/50 hover:text-ink transition-all duration-200 rounded-full hover:bg-ink/5"
              >
                <Search className="w-[18px] h-[18px]" />
                <span className="hidden xl:inline text-[11px] font-medium uppercase tracking-[0.1em]">Rechercher</span>
                <kbd className="hidden 2xl:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-ink/5 text-ink/40 rounded border border-ink/10">
                  /
                </kbd>
              </button>

              {/* Loyalty points — desktop only */}
              {user && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-accent/8 rounded-full border border-accent/15"
                >
                  <Award className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[11px] font-semibold text-accent tabular-nums">{loyaltyPoints.toLocaleString()}</span>
                  <span className="text-[9px] text-accent/60 uppercase tracking-wider">pts</span>
                </motion.div>
              )}

              {/* Wishlist button - desktop only */}
              {user && (
                <Link
                  to="/profile"
                  aria-label={`Liste de souhaits, ${wishlist.length} article${wishlist.length !== 1 ? 's' : ''}`}
                  className="hidden md:flex items-center justify-center w-9 h-9 text-ink/40 hover:text-accent transition-all duration-200 relative rounded-full hover:bg-ink/5"
                >
                  <Heart className="w-[18px] h-[18px]" />
                  {wishlist.length > 0 && (
                    <motion.span
                      key={wishlist.length}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-accent text-white rounded-full text-[9px] flex items-center justify-center font-bold"
                      aria-hidden="true"
                    >
                      {wishlist.length > 9 ? '9+' : wishlist.length}
                    </motion.span>
                  )}
                </Link>
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
                  className="group flex items-center gap-2 p-2 text-ink/40 hover:text-ink transition-all duration-200 rounded-full hover:bg-ink/5"
                >
                  {user ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-white font-bold text-[11px] ring-2 ring-accent/20">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <User className="w-[18px] h-[18px]" />
                  )}
                </button>

                <AnimatePresence>
                  {user && isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute top-full right-0 pt-2 z-50"
                    >
                      <div className="bg-white border border-ink/10 shadow-2xl rounded-xl p-1.5 w-56">
                        <div className="px-3 py-3 mb-1">
                          <p className="text-[10px] text-ink/40 uppercase tracking-[0.15em] font-medium">Connecté</p>
                          <p className="text-sm font-semibold text-ink truncate mt-0.5">{user.email}</p>
                          {user.role === 'admin' && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 bg-accent/10 text-accent text-[9px] font-bold uppercase tracking-wider rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="border-t border-ink/5 pt-1">
                          <Link
                            to="/profile"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-ink/5 rounded-lg transition-colors text-ink group text-sm"
                          >
                            <User className="w-4 h-4 text-ink/40 group-hover:text-accent transition-colors" />
                            <span className="font-medium">Mon Profil</span>
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-ink/5 rounded-lg transition-colors text-ink group text-sm"
                          >
                            <Package className="w-4 h-4 text-ink/40 group-hover:text-accent transition-colors" />
                            <span className="font-medium">Mes Commandes</span>
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-ink/5 rounded-lg transition-colors text-ink group text-sm"
                          >
                            <Heart className="w-4 h-4 text-ink/40 group-hover:text-accent transition-colors" />
                            <span className="font-medium">Mes Favoris</span>
                          </Link>
                          {user.role === 'admin' && (
                            <Link
                              to="/admin"
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/10 rounded-lg transition-colors text-accent group text-sm mt-1 border-t border-ink/5 pt-2.5"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              <span className="font-medium">Dashboard Admin</span>
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-ink/5 pt-1 mt-1">
                          <button
                            onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors group text-sm"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="font-medium">Déconnexion</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart button */}
              <motion.button
                data-cart-button="true"
                onClick={() => setCartOpen(true)}
                aria-label={`Panier, ${cartCount} article${cartCount !== 1 ? 's' : ''}`}
                className="group relative flex items-center justify-center w-9 h-9 text-ink/40 hover:text-ink transition-all duration-200 rounded-full hover:bg-ink/5"
              >
                <ShoppingBag className="w-[18px] h-[18px]" />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-ink text-white rounded-full text-[9px] flex items-center justify-center font-bold"
                    aria-hidden="true"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Mega Menu Overlay — dims the page when mega menu is open */}
      <AnimatePresence>
        {isMegaMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mega-menu-overlay"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 lg:hidden"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 w-[320px] max-w-[85vw] bg-white shadow-2xl z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                {/* Close button */}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="absolute top-4 right-4 p-2 text-ink/40 hover:text-ink transition-colors rounded-full hover:bg-ink/5"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Logo */}
                <Link 
                  to="/" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block mb-8"
                >
                  <span className="text-2xl font-bold tracking-tight font-serif italic text-ink">
                    Véridian
                  </span>
                  <span className="block text-[8px] uppercase tracking-[0.25em] text-ink/30 mt-0.5 font-medium">
                    Maison de Qualité
                  </span>
                </Link>

                {/* User info card */}
                {user && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-accent/8 to-accent/3 rounded-xl border border-accent/15">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-white font-bold text-sm">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{user.email.split('@')[0]}</p>
                        <p className="text-[11px] text-ink/50 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-accent/15">
                      <Award className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[11px] text-ink/50 font-medium">Points de fidélité</span>
                      <span className="text-sm font-bold text-accent ml-auto tabular-nums">{loyaltyPoints.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Navigation — Categories with accordion */}
                <nav className="space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink/30 px-3 mb-2">Catégories</p>
                  
                  {mobileCategories.map(cat => (
                    <div key={cat.id}>
                      <button
                        onClick={() => setMobileAccordion(mobileAccordion === cat.name ? null : cat.name)}
                        className="w-full flex items-center justify-between px-3 py-3 text-sm font-semibold text-ink hover:bg-ink/5 rounded-lg transition-colors"
                      >
                        <span>{cat.name}</span>
                        <ChevronDown className={`w-4 h-4 text-ink/30 transition-transform duration-200 ${mobileAccordion === cat.name ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {mobileAccordion === cat.name && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-4 pb-2 space-y-0.5">
                              <Link
                                to={`/?category=${encodeURIComponent(cat.name)}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-ink/60 hover:text-ink hover:bg-ink/5 rounded-lg transition-colors"
                              >
                                <ChevronRight className="w-3 h-3" />
                                <span>Voir tout {cat.name}</span>
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  {/* Links section */}
                  <div className="my-4 border-t border-ink/5" />
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink/30 px-3 mb-2">Compte</p>

                  {user && (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-ink hover:bg-ink/5 rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4 text-ink/40" />
                        Mon Profil
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-ink hover:bg-ink/5 rounded-lg transition-colors"
                      >
                        <Package className="w-4 h-4 text-ink/40" />
                        Mes Commandes
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-ink hover:bg-ink/5 rounded-lg transition-colors"
                      >
                        <Heart className="w-4 h-4 text-ink/40" />
                        Mes Favoris
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard Admin
                        </Link>
                      )}
                      <div className="my-3 border-t border-ink/5" />
                      <button
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </>
                  )}

                  {!user && (
                    <>
                      <button
                        onClick={() => {
                          setAuthModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 bg-ink text-white text-sm font-semibold uppercase tracking-[0.1em] hover:bg-ink/90 rounded-lg transition-colors"
                      >
                        Se connecter
                      </button>
                    </>
                  )}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Advanced Search Modal */}
      <AdvancedSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
