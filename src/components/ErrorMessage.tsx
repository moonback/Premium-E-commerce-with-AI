import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

export type ErrorType = 'error' | 'warning' | 'info' | 'success';

export interface ErrorAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface ErrorMessageProps {
  type?: ErrorType;
  title: string;
  message: string;
  actions?: ErrorAction[];
  onClose?: () => void;
  className?: string;
}

const iconMap = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const colorMap = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    message: 'text-red-700',
  },
  warning: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: 'text-orange-600',
    title: 'text-orange-900',
    message: 'text-orange-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    message: 'text-blue-700',
  },
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
    title: 'text-emerald-900',
    message: 'text-emerald-700',
  },
};

export default function ErrorMessage({
  type = 'error',
  title,
  message,
  actions = [],
  onClose,
  className = '',
}: ErrorMessageProps) {
  const Icon = iconMap[type];
  const colors = colorMap[type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`relative rounded-xl border-2 ${colors.bg} ${colors.border} p-4 shadow-lg ${className}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colors.icon}`} aria-hidden="true" />
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${colors.title}`}>
              {title}
            </h3>
            <p className={`text-sm leading-relaxed ${colors.message}`}>
              {message}
            </p>

            {actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${
                      action.variant === 'primary'
                        ? `bg-${type === 'error' ? 'red' : type === 'warning' ? 'orange' : type === 'info' ? 'blue' : 'emerald'}-600 text-white hover:bg-${type === 'error' ? 'red' : type === 'warning' ? 'orange' : type === 'info' ? 'blue' : 'emerald'}-700`
                        : 'bg-white border-2 border-current text-current hover:bg-current hover:text-white'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className={`flex-shrink-0 p-1 rounded-lg transition-colors ${colors.icon} hover:bg-white/50`}
              aria-label="Fermer le message"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook pour gérer les erreurs contextuelles
export function useErrorMessage() {
  const [error, setError] = React.useState<{
    type: ErrorType;
    title: string;
    message: string;
    actions?: ErrorAction[];
  } | null>(null);

  const showError = React.useCallback((
    title: string,
    message: string,
    actions?: ErrorAction[],
    type: ErrorType = 'error'
  ) => {
    setError({ type, title, message, actions });
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, showError, clearError };
}

// Exemples d'utilisation prédéfinis
export const ErrorMessages = {
  // Erreurs panier
  insufficientStock: (available: number) => ({
    type: 'error' as ErrorType,
    title: 'Stock insuffisant',
    message: `Seulement ${available} article${available > 1 ? 's' : ''} disponible${available > 1 ? 's' : ''}. Voulez-vous ajuster la quantité ?`,
    actions: [
      { label: 'Ajuster', onClick: () => {}, variant: 'primary' as const },
      { label: 'Annuler', onClick: () => {}, variant: 'secondary' as const },
    ],
  }),

  // Erreurs paiement
  paymentDeclined: () => ({
    type: 'error' as ErrorType,
    title: 'Paiement refusé',
    message: 'Votre carte a été refusée. Vérifiez le solde, la date d\'expiration et le code CVV, ou essayez une autre carte.',
    actions: [
      { label: 'Réessayer', onClick: () => {}, variant: 'primary' as const },
      { label: 'Autre carte', onClick: () => {}, variant: 'secondary' as const },
    ],
  }),

  // Erreurs réseau
  networkError: () => ({
    type: 'error' as ErrorType,
    title: 'Erreur de connexion',
    message: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.',
    actions: [
      { label: 'Réessayer', onClick: () => {}, variant: 'primary' as const },
    ],
  }),

  // Succès
  orderSuccess: (orderNumber: string) => ({
    type: 'success' as ErrorType,
    title: 'Commande validée !',
    message: `Votre commande n°${orderNumber} a été confirmée. Vous recevrez un email de confirmation sous peu.`,
    actions: [
      { label: 'Voir ma commande', onClick: () => {}, variant: 'primary' as const },
    ],
  }),

  // Avertissements
  stockLimited: (stock: number) => ({
    type: 'warning' as ErrorType,
    title: 'Stock limité',
    message: `Plus que ${stock} article${stock > 1 ? 's' : ''} en stock. Commandez vite avant rupture !`,
  }),

  // Info
  deliveryDelay: () => ({
    type: 'info' as ErrorType,
    title: 'Délai de livraison',
    message: 'En raison d\'une forte demande, la livraison peut prendre 1-2 jours supplémentaires.',
  }),
};
