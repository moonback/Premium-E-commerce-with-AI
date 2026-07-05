// src/components/Header.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { ShoppingBag, Search, User, LogOut, LayoutDashboard, X, Heart, Package, Award, Menu, ChevronDown, ChevronRight, Sparkles, Globe, TrendingUp, Star, Gift, Home } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import MegaMenu from './MegaMenu';
import AdvancedSearchModal from './AdvancedSearchModal';

export default function Header() {
  const { cart, user, loyaltyPoints, wishlist, categories, setUser, setAuthModalOpen, setCartOpen, searchQuery, setSearchQuery } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState('');

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
  const mobileCategories = categories.filter(c => c.level === 1);

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      setSearchQuery(localSearchQuery);
      if (location.pathname !== '/') {
        navigate('/?search=' + encodeURIComponent(localSearchQuery));
      }
    }
  };

  // Sync local search with global search
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  return (
    <>
      <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled ? 'shadow-lg' : ''
      }`}>
        {/* Top banner - Promotional bar */}
        <div className="bg-[#232f3e] border-b border-white/5">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center md:justify-between py-2 text-white/90 text-xs">
              <div className="flex items-center gap-6">
                <Link to="/" className="hidden md:flex items-center gap-2 hover:text-white transition-colors">
                  <Gift className="w-3.5 h-3.5 text-[#ff9900]" />
                  <span>Offres spéciales</span>
                </Link>
                <Link to="/" className="hidden lg:flex items-center gap-2 hover:text-white transition-colors">
                  <TrendingUp className="w-3.5 h-3.5 text-[#ff9900]" />
                  <span>Meilleures ventes</span>
                </Link>
                <Link to="/" className="hidden xl:flex items-center gap-2 hover:text-white transition-colors">
                  <Star className="w-3.5 h-3.5 text-[#ff9900]" />
                  <span>Nouveautés</span>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#ff9900]" />
                <span className="font-medium">Livraison gratuite dès 100€</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main header - Amazon style */}
        <div className="bg-[#131921]">
          <div className="max-w-[1500px] mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 h-14 md:h-16">

              {/* Mobile: Menu + Logo (compact) */}
              <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden text-white hover:bg-white/10 transition-colors p-1.5 rounded"
                  aria-label="Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <Link to="/" className="group flex items-center">
                  <div className="flex flex-col">
                    <span className="text-white text-base sm:text-xl md:text-2xl font-bold tracking-tight leading-none">
                      Véridian
                    </span>
                    
                  </div>
                </Link>
              </div>

              {/* Mobile: Search bar (expandable) */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="md:hidden flex-1 flex items-center gap-2 px-3 py-2 bg-white rounded-md text-ink/50 hover:bg-white/95 transition-colors border border-gray-200"
                aria-label="Rechercher"
              >
                <Search className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">Rechercher...</span>
              </button>

              {/* Desktop: Search bar */}
              <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-3xl">
                <div className="flex w-full bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <select className="px-3 py-2 bg-gray-100 text-ink text-xs font-medium border-r border-gray-300 focus:outline-none cursor-pointer hover:bg-gray-200 transition-colors">
                    <option>Toutes catégories</option>
                    {categories.filter(c => c.level === 1).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    placeholder="Rechercher des produits, marques..."
                    className="flex-1 px-4 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-6 bg-[#ff9900] hover:bg-[#fa8900] transition-colors flex items-center justify-center"
                    aria-label="Rechercher"
                  >
                    <Search className="w-5 h-5 text-[#131921]" />
                  </button>
                </div>
              </form>

              {/* Right actions - Compact on mobile */}
              <div className="flex items-center gap-1 flex-shrink-0">

                {/* Language - Desktop only */}
                <button className="hidden lg:flex items-center gap-1 px-2 py-2 text-white hover:bg-white/10 rounded border border-transparent hover:border-white/20 transition-colors">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">FR</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

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
                    aria-expanded={isDropdownOpen}
                    className="hidden md:flex flex-col items-start px-3 py-2 text-white hover:bg-white/10 rounded border border-transparent hover:border-white/20 transition-colors"
                  >
                    <span className="text-[10px] text-white/70">Bonjour, {user ? user.email.split('@')[0] : 'Identifiez-vous'}</span>
                    <span className="text-sm font-bold flex items-center gap-1">
                      Mon Compte
                      <ChevronDown className="w-3 h-3" />
                    </span>
                  </button>

                  {/* Mobile: Simple account icon */}
                  <button
                    onClick={() => {
                      if (!user) {
                        setAuthModalOpen(true);
                      } else {
                        navigate('/profile');
                      }
                    }}
                    className="md:hidden p-2 text-white hover:bg-white/10 rounded transition-colors"
                    aria-label="Compte"
                  >
                    <User className="w-5 h-5" />
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
                        <div className="bg-white border border-gray-200 shadow-2xl rounded-lg p-2 w-72">
                          <div className="px-3 py-3 mb-2 border-b border-gray-100">
                            <p className="text-[10px] text-ink/40 uppercase tracking-[0.15em] font-medium">Connecté</p>
                            <p className="text-sm font-semibold text-ink truncate mt-0.5">{user.email}</p>
                            {user.role === 'admin' && (
                              <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#ff9900]/10 text-[#ff9900] text-[9px] font-bold uppercase rounded-full">
                                Admin
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <Link
                              to="/profile"
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-ink group text-sm"
                            >
                              <User className="w-4 h-4 text-ink/40 group-hover:text-[#ff9900] transition-colors" />
                              <span className="font-medium">Mon Compte</span>
                            </Link>
                            <Link
                              to="/profile"
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-ink group text-sm"
                            >
                              <Package className="w-4 h-4 text-ink/40 group-hover:text-[#ff9900] transition-colors" />
                              <span className="font-medium">Mes Commandes</span>
                            </Link>
                            <Link
                              to="/profile"
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-ink group text-sm"
                            >
                              <Heart className="w-4 h-4 text-ink/40 group-hover:text-[#ff9900] transition-colors" />
                              <div>
                                <span className="font-medium">Mes Favoris</span>
                                {wishlist.length > 0 && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-[#ff9900] text-white text-[10px] font-bold rounded-full">
                                    {wishlist.length}
                                  </span>
                                )}
                              </div>
                            </Link>
                            <Link
                              to="/profile"
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-ink group text-sm"
                            >
                              <Award className="w-4 h-4 text-ink/40 group-hover:text-[#ff9900] transition-colors" />
                              <div className="flex items-center justify-between flex-1">
                                <span className="font-medium">Points Fidélité</span>
                                <span className="text-[#ff9900] font-bold text-sm">{loyaltyPoints}</span>
                              </div>
                            </Link>
                            {user.role === 'admin' && (
                              <>
                                <div className="border-t border-gray-100 my-2" />
                                <Link
                                  to="/admin"
                                  onClick={() => setIsDropdownOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#ff9900]/10 rounded-lg transition-colors text-[#ff9900] group text-sm font-medium"
                                >
                                  <LayoutDashboard className="w-4 h-4" />
                                  <span>Dashboard Admin</span>
                                </Link>
                              </>
                            )}
                          </div>
                          
                          <div className="border-t border-gray-100 pt-2 mt-2">
                            <button
                              onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors group text-sm font-medium"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Déconnexion</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Returns & Orders - Desktop only */}
                <Link
                  to="/profile"
                  className="hidden lg:flex flex-col items-start px-3 py-2 text-white hover:bg-white/10 rounded border border-transparent hover:border-white/20 transition-colors"
                >
                  <span className="text-[10px] text-white/70">Retours</span>
                  <span className="text-sm font-bold">& Commandes</span>
                </Link>

                {/* Wishlist - Mobile icon only */}
                {user && (
                  <Link
                    to="/profile"
                    className="lg:hidden relative p-2 text-white hover:bg-white/10 rounded transition-colors"
                    aria-label="Favoris"
                  >
                    <Heart className="w-5 h-5" />
                    {wishlist.length > 0 && (
                      <motion.span
                        key={wishlist.length}
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-[#ff9900] text-[#131921] rounded-full text-[9px] flex items-center justify-center font-bold"
                      >
                        {wishlist.length > 9 ? '9+' : wishlist.length}
                      </motion.span>
                    )}
                  </Link>
                )}

                {/* Cart - Compact on mobile */}
                <motion.button
                  onClick={() => setCartOpen(true)}
                  className="relative flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 text-white hover:bg-white/10 rounded border border-transparent hover:border-white/20 transition-colors"
                  aria-label={`Panier (${cartCount})`}
                >
                  <div className="relative">
                    <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                    {cartCount > 0 && (
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0.5 }}
                        animate={{ scale: [1, 1.2, 1] }}
                        className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#ff9900] text-[#131921] rounded-full text-[10px] flex items-center justify-center font-bold"
                      >
                        {cartCount > 99 ? '99+' : cartCount}
                      </motion.span>
                    )}
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-[10px] text-white/70 leading-none">Panier</span>
                    <span className="text-sm font-bold leading-none">{cartCount}</span>
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation bar - Categories */}
        <div className="bg-[#232f3e] border-t border-white/5 hidden md:block">
          <div className="max-w-[1500px] mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 md:gap-6 h-10 overflow-x-auto scrollbar-hide">
              <div className="flex-shrink-0">
                <MegaMenu onOpenChange={handleMegaMenuOpenChange} />
              </div>
              <div className="flex items-center gap-4 md:gap-6">
                {categories.filter(c => c.level === 1).slice(0, 8).map(cat => (
                  <Link
                    key={cat.id}
                    to={`/?category=${encodeURIComponent(cat.name)}`}
                    className="text-white/90 hover:text-white text-xs md:text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
              <Link
                to="/"
                className="text-[#ff9900] hover:text-[#fa8900] text-xs md:text-sm font-bold whitespace-nowrap transition-colors ml-auto flex-shrink-0"
              >
                🔥 Offres du jour
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile bottom navigation - Always visible on mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-bottom">
          <div className="grid grid-cols-5 h-16">
            <Link
              to="/"
              className="flex flex-col items-center justify-center gap-1 text-ink/60 hover:text-[#ff9900] transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium">Accueil</span>
            </Link>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex flex-col items-center justify-center gap-1 text-ink/60 hover:text-[#ff9900] transition-colors"
            >
              <Search className="w-5 h-5" />
              <span className="text-[10px] font-medium">Recherche</span>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-1 text-ink/60 hover:text-[#ff9900] transition-colors"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium">Menu</span>
            </button>
            {user ? (
              <Link
                to="/profile"
                className="flex flex-col items-center justify-center gap-1 text-ink/60 hover:text-[#ff9900] transition-colors relative"
              >
                <Heart className="w-5 h-5" />
                <span className="text-[10px] font-medium">Favoris</span>
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-6 min-w-[16px] h-[16px] px-1 bg-[#ff9900] text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                    {wishlist.length}
                  </span>
                )}
              </Link>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex flex-col items-center justify-center gap-1 text-ink/60 hover:text-[#ff9900] transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="text-[10px] font-medium">Compte</span>
              </button>
            )}
            <button
              onClick={() => setCartOpen(true)}
              className="flex flex-col items-center justify-center gap-1 text-ink/60 hover:text-[#ff9900] transition-colors relative"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[10px] font-medium">Panier</span>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  className="absolute top-1 right-4 min-w-[18px] h-[18px] px-1 bg-[#ff9900] text-white rounded-full text-[10px] flex items-center justify-center font-bold"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mega Menu Overlay */}
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 w-[85vw] max-w-[360px] bg-white shadow-2xl z-50 lg:hidden overflow-y-auto"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-[#232f3e] to-[#131921] p-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-white font-bold text-base block">
                      {user ? user.email.split('@')[0] : 'Connexion'}
                    </span>
                    {user && (
                      <span className="text-white/60 text-xs">
                        {user.email}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                {/* Points de fidélité card */}
                {user && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-[#ff9900] to-[#fa8900] rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/90 text-xs font-medium mb-1">Points de fidélité</p>
                        <p className="text-white text-2xl font-bold">{loyaltyPoints}</p>
                      </div>
                      <Award className="w-10 h-10 text-white/30" />
                    </div>
                  </div>
                )}

                {/* Quick actions */}
                {!user && (
                  <button
                    onClick={() => {
                      setAuthModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full mb-6 px-6 py-3 bg-[#ff9900] hover:bg-[#fa8900] text-white text-sm font-bold rounded-xl transition-colors shadow-md"
                  >
                    Se connecter
                  </button>
                )}

                <nav className="space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink/30 px-2 mb-3">Navigation</p>
                  
                  {/* Categories with better styling */}
                  {mobileCategories.map(cat => (
                    <div key={cat.id}>
                      <button
                        onClick={() => setMobileAccordion(mobileAccordion === cat.name ? null : cat.name)}
                        className="w-full flex items-center justify-between px-3 py-3 text-sm font-semibold text-ink hover:bg-gradient-to-r hover:from-[#ff9900]/5 hover:to-transparent rounded-xl transition-all"
                      >
                        <span>{cat.name}</span>
                        <ChevronDown className={`w-4 h-4 text-[#ff9900] transition-transform duration-200 ${mobileAccordion === cat.name ? 'rotate-180' : ''}`} />
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
                            <div className="pl-4 pb-2 space-y-1">
                              <Link
                                to={`/?category=${encodeURIComponent(cat.name)}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-ink/60 hover:text-[#ff9900] hover:bg-[#ff9900]/5 rounded-lg transition-all"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                                <span>Voir tout</span>
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  <div className="my-4 border-t border-gray-200" />
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink/30 px-2 mb-3">Mon compte</p>

                  {user && (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-ink hover:bg-gradient-to-r hover:from-[#ff9900]/5 hover:to-transparent rounded-xl transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#ff9900]/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-[#ff9900]" />
                        </div>
                        <span>Mon Profil</span>
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-ink hover:bg-gradient-to-r hover:from-[#ff9900]/5 hover:to-transparent rounded-xl transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#ff9900]/10 flex items-center justify-center">
                          <Package className="w-4 h-4 text-[#ff9900]" />
                        </div>
                        <span>Mes Commandes</span>
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-ink hover:bg-gradient-to-r hover:from-[#ff9900]/5 hover:to-transparent rounded-xl transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#ff9900]/10 flex items-center justify-center relative">
                          <Heart className="w-4 h-4 text-[#ff9900]" />
                          {wishlist.length > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-[#ff9900] text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                              {wishlist.length}
                            </span>
                          )}
                        </div>
                        <span>Mes Favoris</span>
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-[#ff9900] hover:bg-[#ff9900]/10 rounded-xl transition-all"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#ff9900]/20 flex items-center justify-center">
                            <LayoutDashboard className="w-4 h-4" />
                          </div>
                          <span className="font-bold">Dashboard Admin</span>
                        </Link>
                      )}
                      <div className="my-3 border-t border-gray-200" />
                      <button
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span>Déconnexion</span>
                      </button>
                    </>
                  )}

                  {!user && (
                    <div className="text-center py-8 text-ink/50 text-sm">
                      Connectez-vous pour accéder à votre compte
                    </div>
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
