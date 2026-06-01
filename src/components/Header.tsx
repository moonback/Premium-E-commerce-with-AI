// src/components/Header.tsx
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ShoppingBag, Search, User, LogOut, LayoutDashboard, X, Heart, Package, Award, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import MegaMenu from './MegaMenu';
import AdvancedSearchModal from './AdvancedSearchModal';

export default function Header() {
  const { cart, user, loyaltyPoints, wishlist, setUser, setAuthModalOpen, setCartOpen } = useStore();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Detect scroll for header style changes
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
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
      <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-ink/10' 
          : 'bg-bg/80 backdrop-blur-md border-b border-ink/10'
      }`}>
        {/* Top banner - Optional promotional bar */}
        <div className="bg-ink text-white text-center py-2 px-4">
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">
            <Award className="w-3 h-3 inline mr-2" />
            Livraison gratuite dès 100€ d'achat
            <span className="hidden md:inline"> • Retours gratuits sous 30 jours</span>
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-16 md:h-20">

            {/* Left — Mobile menu + logo */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-ink/60 hover:text-ink transition-colors p-2"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link 
                to="/" 
                className="group flex flex-col items-start"
              >
                <span className="text-2xl md:text-3xl font-bold tracking-tighter font-serif italic text-ink group-hover:text-accent transition-colors">
                  Véridian
                </span>
                <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-ink/40 -mt-1">
                  Maison de Qualité
                </span>
              </Link>
            </div>

            {/* Center — Desktop navigation links */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link 
                to="/" 
                className="text-xs font-bold uppercase tracking-widest text-ink/60 hover:text-ink transition-colors relative group py-2"
              >
                Nouveautés
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                to="/" 
                className="text-xs font-bold uppercase tracking-widest text-ink/60 hover:text-ink transition-colors relative group py-2"
              >
                Collections
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                to="/" 
                className="text-xs font-bold uppercase tracking-widest text-ink/60 hover:text-ink transition-colors relative group py-2"
              >
                Promotions
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></span>
              </Link>
            </nav>

            {/* Right — search, loyalty, account, wishlist, cart */}
            <div className="flex items-center gap-2 md:gap-4">

              {/* Search button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Rechercher"
                className="group flex items-center gap-2 px-3 md:px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink/60 hover:text-ink hover:bg-ink/5 rounded-full transition-all"
              >
                <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">Rechercher</span>
                <kbd className="hidden xl:inline-block px-2 py-0.5 text-[10px] font-mono bg-ink/10 rounded">
                  /
                </kbd>
              </button>

              {/* Loyalty points — desktop only */}
              {user && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-accent/10 to-accent/5 rounded-full border border-accent/20"
                >
                  <Award className="w-4 h-4 text-accent" />
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase opacity-60 font-bold tracking-wider leading-none">Points</span>
                    <span className="text-sm font-bold text-accent leading-none">{loyaltyPoints.toLocaleString()}</span>
                  </div>
                </motion.div>
              )}

              {/* Wishlist button - desktop only */}
              {user && (
                <Link
                  to="/profile"
                  aria-label={`Liste de souhaits, ${wishlist.length} article${wishlist.length !== 1 ? 's' : ''}`}
                  className="hidden md:block text-ink/60 hover:text-accent transition-colors relative p-2 group"
                >
                  <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {wishlist.length > 0 && (
                    <motion.span
                      key={wishlist.length}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-accent text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow-lg"
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
                  className="group text-ink/60 hover:text-ink transition-colors flex items-center gap-2 p-2 hover:bg-ink/5 rounded-full"
                >
                  {user ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-white font-bold text-xs">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden xl:inline text-xs font-bold uppercase tracking-wider">
                        {user.email.split('@')[0]}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">
                        Connexion
                      </span>
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {user && isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 pt-2 z-50"
                    >
                      <div className="bg-white border border-ink/10 shadow-2xl rounded-xl p-2 w-56 text-xs font-bold uppercase tracking-widest">
                        <div className="px-4 py-3 mb-2 border-b border-ink/10">
                          <p className="text-ink/50 text-[10px] mb-1">Connecté en tant que</p>
                          <p className="text-ink truncate text-xs">{user.email}</p>
                          {user.role === 'admin' && (
                            <span className="inline-block mt-2 px-2 py-1 bg-accent/10 text-accent text-[9px] rounded-full">
                              Administrateur
                            </span>
                          )}
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 p-3 hover:bg-ink/5 rounded-lg transition-colors text-ink group"
                        >
                          <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>Mon Profil</span>
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 p-3 hover:bg-ink/5 rounded-lg transition-colors text-ink group"
                        >
                          <Package className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>Mes Commandes</span>
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 p-3 hover:bg-ink/5 rounded-lg transition-colors text-ink group"
                        >
                          <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>Mes Favoris</span>
                        </Link>
                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 p-3 hover:bg-accent/10 rounded-lg transition-colors text-accent group mt-2 border-t border-ink/10 pt-3"
                          >
                            <LayoutDashboard className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span>Dashboard Admin</span>
                          </Link>
                        )}
                        <button
                          onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 p-3 mt-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border-t border-ink/10 group"
                        >
                          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>Déconnexion</span>
                        </button>
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
                className="group relative text-ink/60 hover:text-ink transition-colors p-2 hover:bg-ink/5 rounded-full"
              >
                <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-accent text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow-lg"
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
              className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 lg:hidden"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                {/* Close button */}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="absolute top-4 right-4 p-2 text-ink/60 hover:text-ink transition-colors"
                  aria-label="Fermer le menu"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Logo */}
                <Link 
                  to="/" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block mb-8"
                >
                  <span className="text-3xl font-bold tracking-tighter font-serif italic text-ink">
                    Véridian
                  </span>
                  <span className="block text-[9px] uppercase tracking-[0.2em] text-ink/40 mt-1">
                    Maison de Qualité
                  </span>
                </Link>

                {/* User info */}
                {user && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl border border-accent/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-white font-bold text-lg">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ink">{user.email.split('@')[0]}</p>
                        <p className="text-xs text-ink/60">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-accent/20">
                      <Award className="w-4 h-4 text-accent" />
                      <span className="text-xs text-ink/60">Points de fidélité:</span>
                      <span className="text-sm font-bold text-accent ml-auto">{loyaltyPoints.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <nav className="space-y-2">
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-bold uppercase tracking-widest text-ink hover:bg-ink/5 rounded-lg transition-colors"
                  >
                    Nouveautés
                  </Link>
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-bold uppercase tracking-widest text-ink hover:bg-ink/5 rounded-lg transition-colors"
                  >
                    Collections
                  </Link>
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-bold uppercase tracking-widest text-ink hover:bg-ink/5 rounded-lg transition-colors"
                  >
                    Promotions
                  </Link>

                  {user && (
                    <>
                      <div className="my-4 border-t border-ink/10"></div>
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-ink hover:bg-ink/5 rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Mon Profil
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-ink hover:bg-ink/5 rounded-lg transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        Mes Commandes
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-ink hover:bg-ink/5 rounded-lg transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        Mes Favoris
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-accent hover:bg-accent/10 rounded-lg transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard Admin
                        </Link>
                      )}
                      <button
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 mt-2 text-sm font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </>
                  )}

                  {!user && (
                    <>
                      <div className="my-4 border-t border-ink/10"></div>
                      <button
                        onClick={() => {
                          setAuthModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 bg-ink text-white text-sm font-bold uppercase tracking-widest hover:bg-ink/90 rounded-lg transition-colors"
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
