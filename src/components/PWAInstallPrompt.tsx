// src/components/PWAInstallPrompt.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

export default function PWAInstallPrompt() {
  const { isInstallable, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà refusé
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Afficher après 10 secondes si installable
    if (isInstallable) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    setIsDismissed(true);
  };

  if (!isInstallable || isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
        >
          <div className="bg-bg border border-ink/10 rounded-2xl shadow-2xl p-6">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1 hover:bg-ink/5 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-accent/10 rounded-xl">
                <Smartphone className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg mb-1">Installer Véridian</h3>
                <p className="text-sm text-ink/70">
                  Accédez rapidement à la boutique depuis votre écran d'accueil.
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4 text-xs text-ink/60">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                <span>Accès rapide sans navigateur</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                <span>Notifications des promotions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                <span>Fonctionne hors ligne</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                fullWidth
              >
                Plus tard
              </Button>
              <Button
                size="sm"
                onClick={handleInstall}
                leftIcon={<Download className="w-4 h-4" />}
                fullWidth
              >
                Installer
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Composant pour afficher le statut de connexion
export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true);
    } else {
      // Masquer après 3 secondes quand on revient en ligne
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            'fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-xs font-bold uppercase tracking-wider',
            isOnline
              ? 'bg-emerald-600 text-white'
              : 'bg-amber-500 text-bg'
          )}
        >
          {isOnline ? '✓ Connexion rétablie' : '⚠ Mode hors ligne'}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
