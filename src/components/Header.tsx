import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ShoppingBag, Search, User, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';

export default function Header() {
  const { cart, user, loyaltyPoints, setUser, setAuthModalOpen, setCartOpen, searchQuery, setSearchQuery } = useStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
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
    toast.success("Vous avez été déconnecté");
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-bg/80 backdrop-blur-md border-b border-ink/10 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-4 lg:gap-8">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-ink/60 hover:text-ink p-2 -ml-2"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="text-2xl font-bold tracking-tighter font-serif italic text-ink">
              Boutique
            </Link>
            
            <nav className="hidden md:flex gap-6 text-xs uppercase tracking-widest font-bold opacity-70">
              <Link to="/" className="hover:opacity-100 transition-opacity">Catalogue</Link>
              <Link to="/" className="hover:opacity-100 transition-opacity">Nouveautés</Link>
              <Link to="/" className="hover:opacity-100 transition-opacity">À Propos</Link>
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input 
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-transparent border border-ink/10 rounded-none text-xs focus:bg-ink/5 focus:border-ink/30 focus:ring-0 transition-all outline-none uppercase tracking-widest font-bold placeholder:text-ink/30"
              />
            </div>
            
            {user && (
               <div className="hidden lg:flex flex-col items-end">
                 <span className="text-[10px] uppercase opacity-50 font-bold tracking-tighter">Points Fidélité</span>
                 <span className="text-sm font-semibold text-accent">{loyaltyPoints.toLocaleString()} pts</span>
               </div>
            )}

            <div className="relative header-dropdown">
              <button 
                onClick={() => {
                  if (!user) {
                    setAuthModalOpen(true);
                  } else {
                    setIsDropdownOpen(prev => !prev);
                  }
                }}
                className="text-ink/60 hover:text-ink transition-colors flex items-center gap-2 py-2"
                title={user ? "Mon compte" : "Se connecter"}
              >
                {user ? (
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-ink text-bg rounded">
                    {user.email.split('@')[0]}
                  </span>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>

              {/* User Dropdown */}
              {user && isDropdownOpen && (
                <div className="absolute top-full right-0 pt-2 z-50">
                  <div className="bg-bg border border-ink/10 shadow-xl p-2 w-48 text-xs font-bold uppercase tracking-widest flex flex-col gap-1">
                    <div className="px-3 py-2 opacity-50 mb-1 border-b border-ink/10">{user.email}</div>
                    
                    <Link to="/profile" className="p-3 hover:bg-soft-green transition-colors text-left flex items-center gap-2 text-ink">
                      <User className="w-4 h-4"/> Mon Profil
                    </Link>
                    
                    {user.role === 'admin' && (
                      <Link to="/admin" className="p-3 hover:bg-soft-green transition-colors text-left flex items-center gap-2 text-ink">
                        <LayoutDashboard className="w-4 h-4"/> Dashboard
                      </Link>
                    )}
                    
                    <button onClick={handleLogout} className="p-3 mt-1 text-red-600 hover:bg-red-50 transition-colors text-left flex items-center gap-2 border-t border-ink/10">
                      <LogOut className="w-4 h-4"/> Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
            
              <motion.button data-cart-button="true"
                onClick={() => setCartOpen(true)}
                className="text-ink/60 hover:text-ink transition-colors relative"
              >
              <ShoppingBag className="w-5 h-5" />
                <motion.span
                  key={cart.length}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.4 }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-ink text-bg rounded-full text-[10px] flex items-center justify-center font-bold"
                >
                {cart.length}
              </motion.span>
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-bg border-b border-ink/10 shadow-xl p-4 flex flex-col gap-4">
           <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input 
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-transparent border border-ink/10 rounded-none text-xs focus:bg-ink/5 focus:border-ink/30 focus:ring-0 transition-all outline-none uppercase tracking-widest font-bold placeholder:text-ink/30"
              />
            </div>
            
            <nav className="flex flex-col gap-4 text-sm font-bold uppercase tracking-widest text-ink/70">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Catalogue</Link>
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Mon Compte</Link>
              {user && (
                  <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="text-left text-red-600">Déconnexion</button>
              )}
            </nav>
        </div>
      )}
    </header>
  );
}
