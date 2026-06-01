import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, ShoppingBag, MapPin, Clock } from 'lucide-react';

interface RecentActivity {
  type: 'view' | 'purchase';
  productName: string;
  location: string;
  timeAgo: string;
}

// Données mockées pour la démo
const mockActivities: RecentActivity[] = [
  { type: 'purchase', productName: 'T-Shirt Minimaliste', location: 'Paris', timeAgo: 'il y a 2 min' },
  { type: 'view', productName: 'Sacoche en Cuir', location: 'Lyon', timeAgo: 'il y a 5 min' },
  { type: 'purchase', productName: 'Tasse en Céramique', location: 'Marseille', timeAgo: 'il y a 8 min' },
  { type: 'view', productName: 'Gourde Isotherme', location: 'Toulouse', timeAgo: 'il y a 12 min' },
  { type: 'purchase', productName: 'T-Shirt Minimaliste', location: 'Nice', timeAgo: 'il y a 15 min' },
];

export function RecentActivityNotification() {
  const [currentActivity, setCurrentActivity] = useState<RecentActivity | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let activityIndex = 0;

    const showActivity = () => {
      setCurrentActivity(mockActivities[activityIndex]);
      setIsVisible(true);

      setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      activityIndex = (activityIndex + 1) % mockActivities.length;
    };

    // Première notification après 3 secondes
    const initialTimeout = setTimeout(showActivity, 3000);

    // Notifications suivantes toutes les 15 secondes
    const interval = setInterval(showActivity, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  if (!currentActivity) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="fixed bottom-24 left-4 z-30 max-w-sm"
        >
          <div className="bg-white border border-ink/10 rounded-xl shadow-2xl p-4 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              currentActivity.type === 'purchase' 
                ? 'bg-green-100' 
                : 'bg-blue-100'
            }`}>
              {currentActivity.type === 'purchase' ? (
                <ShoppingBag className="w-5 h-5 text-green-600" />
              ) : (
                <Eye className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink mb-1">
                {currentActivity.type === 'purchase' 
                  ? 'Vente récente' 
                  : 'Produit consulté'}
              </p>
              <p className="text-xs text-ink/70 truncate mb-2">
                {currentActivity.productName}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-ink/50">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {currentActivity.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {currentActivity.timeAgo}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-ink/40 hover:text-ink transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compteur de personnes regardant le produit
interface ViewingCountProps {
  productId: string;
  min?: number;
  max?: number;
}

export function ViewingCount({ productId, min = 3, max = 12 }: ViewingCountProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Générer un nombre aléatoire basé sur l'ID du produit pour la cohérence
    const hash = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomCount = min + (hash % (max - min + 1));
    setCount(randomCount);

    // Varier légèrement le nombre toutes les 30 secondes
    const interval = setInterval(() => {
      setCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newCount = prev + change;
        return Math.max(min, Math.min(max, newCount));
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [productId, min, max]);

  if (count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-full"
    >
      <div className="flex -space-x-1">
        {[...Array(Math.min(3, count))].map((_, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white flex items-center justify-center"
          >
            <Eye className="w-3 h-3 text-white" />
          </div>
        ))}
      </div>
      <span className="text-xs font-bold text-orange-700">
        {count} {count === 1 ? 'personne regarde' : 'personnes regardent'} ce produit
      </span>
    </motion.div>
  );
}

// Badge de stock limité
interface LimitedStockProps {
  stock: number;
  threshold?: number;
}

export function LimitedStockBadge({ stock, threshold = 10 }: LimitedStockProps) {
  if (stock > threshold) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg"
    >
      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      <span className="text-xs font-bold text-red-700">
        Plus que {stock} en stock !
      </span>
    </motion.div>
  );
}

// Compte à rebours pour promotion
interface CountdownTimerProps {
  endDate: Date;
  label?: string;
}

export function CountdownTimer({ endDate, label = 'Offre limitée' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl p-4">
      <p className="text-xs font-bold uppercase tracking-wider mb-2 text-center">
        {label}
      </p>
      <div className="flex items-center justify-center gap-2">
        <div className="text-center">
          <div className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-80">Heures</div>
        </div>
        <div className="text-2xl font-bold">:</div>
        <div className="text-center">
          <div className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-80">Min</div>
        </div>
        <div className="text-2xl font-bold">:</div>
        <div className="text-center">
          <div className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-80">Sec</div>
        </div>
      </div>
    </div>
  );
}
