import React, { useState } from 'react';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      // Mock logic if no supabase env defined
      if (email.includes('admin')) {
        useStore.getState().setUser({ id: '1', email, role: 'admin' });
      } else {
        useStore.getState().setUser({ id: '2', email, role: 'customer' });
      }
      toast.success("Connexion locale simulée");
      setAuthModalOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connexion réussie");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Compte créé avec succès");
      }
      setAuthModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Authentication error');
      toast.error(err.message || "Erreur d'authentification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setAuthModalOpen(false)}
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-bg border border-ink/10 shadow-2xl relative p-8"
        >
          <button 
            onClick={() => setAuthModalOpen(false)} 
            className="absolute top-4 right-4 text-ink/40 hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-3xl font-serif text-ink tracking-tight mb-2">
            {isLogin ? 'Connexion' : 'Inscription'}
          </h2>
          <p className="text-ink/60 text-xs uppercase tracking-widest font-bold mb-8">
            Accédez à votre compte Véridian
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input 
                type="email" 
                placeholder="Votre Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-ink/20 px-0 py-3 text-sm focus:outline-none focus:border-ink transition-colors placeholder:text-ink/30 italic"
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder="Mot de passe"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-ink/20 px-0 py-3 text-sm focus:outline-none focus:border-ink transition-colors placeholder:text-ink/30 italic"
              />
            </div>
            
            {error && <p className="text-red-500 text-xs font-bold uppercase tracking-wide">{error}</p>}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-ink text-white font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors flex justify-center items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? 'Se Connecter' : 'Créer un Compte'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-ink/60 hover:text-ink transition-colors italic underline decoration-ink/20 underline-offset-4"
            >
              {isLogin ? 'Nouveau client ? Créer un compte.' : 'Déjà client ? Se connecter.'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
