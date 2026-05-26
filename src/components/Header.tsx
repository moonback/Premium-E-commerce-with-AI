import React from 'react';
import { useStore } from '../store';
import { ShoppingBag, Search, User, LogOut, LayoutDashboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Header() {
  const { cart, user, setUser, setAuthModalOpen, setCartOpen, searchQuery, setSearchQuery } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-bg/80 backdrop-blur-md border-b border-ink/10 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold tracking-tighter font-serif italic text-ink">
              Véridian
            </Link>
            
            <nav className="hidden md:flex gap-6 text-xs uppercase tracking-widest font-bold opacity-70">
              <Link to="/" className="hover:opacity-100 transition-opacity">Menu</Link>
              <Link to="/" className="hover:opacity-100 transition-opacity">Saveurs</Link>
              <Link to="/" className="hover:opacity-100 transition-opacity">Héritage</Link>
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input 
                type="text"
                placeholder="Rechercher (ex: praliné)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-soft-green border border-ink/10 rounded-none text-xs focus:bg-white focus:border-ink/30 focus:ring-0 transition-all outline-none uppercase tracking-widest font-bold placeholder:text-ink/30"
              />
            </div>
            
            {user && (
               <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] uppercase opacity-50 font-bold tracking-tighter">Points Fidélité</span>
                <span className="text-sm font-semibold text-accent">1,450 pts</span>
              </div>
            )}

            <div className="relative group">
              <button 
                onClick={() => !user && setAuthModalOpen(true)}
                className="text-ink/60 hover:text-ink transition-colors flex items-center gap-2 py-2"
                title={user ? "Mon compte" : "Se connecter"}
              >
                {user ? (
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-ink text-white rounded">
                    {user.email.split('@')[0]}
                  </span>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>

              {/* User Dropdown */}
              {user && (
                <div className="absolute top-full right-0 pt-2 hidden group-hover:block z-50">
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
            
            <button 
              onClick={() => setCartOpen(true)}
              className="text-ink/60 hover:text-ink transition-colors relative"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-ink text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {cart.length}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
