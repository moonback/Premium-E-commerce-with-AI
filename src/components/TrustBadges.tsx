import React from 'react';
import { Shield, Truck, RotateCcw, Headphones, Award, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface TrustBadge {
  icon: React.ElementType;
  title: string;
  description: string;
}

const badges: TrustBadge[] = [
  {
    icon: Shield,
    title: 'Paiement Sécurisé',
    description: 'SSL & PCI DSS certifié',
  },
  {
    icon: Truck,
    title: 'Livraison Gratuite',
    description: 'Dès 100€ d\'achat',
  },
  {
    icon: RotateCcw,
    title: 'Retours Gratuits',
    description: 'Sous 30 jours',
  },
  {
    icon: Headphones,
    title: 'Support 7j/7',
    description: 'Réponse en 24h',
  },
];

export default function TrustBadges() {
  return (
    <div className="bg-white border-y border-ink/10 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                <badge.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink mb-1">
                {badge.title}
              </h3>
              <p className="text-xs text-ink/60">{badge.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Composant pour afficher les badges de sécurité
export function SecurityBadges() {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
        <Lock className="w-4 h-4 text-green-600" />
        <span className="text-xs font-bold text-green-700">SSL Sécurisé</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
        <Shield className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-bold text-blue-700">PCI DSS</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
        <Award className="w-4 h-4 text-purple-600" />
        <span className="text-xs font-bold text-purple-700">Certifié</span>
      </div>
    </div>
  );
}

// Composant pour la garantie satisfaction
export function SatisfactionGuarantee() {
  return (
    <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-xl p-6 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
        <Award className="w-8 h-8 text-accent" />
      </div>
      <h3 className="text-lg font-bold uppercase tracking-wider text-ink mb-2">
        Garantie Satisfaction 100%
      </h3>
      <p className="text-sm text-ink/70 mb-4">
        Si vous n'êtes pas satisfait, nous vous remboursons intégralement sous 30 jours
      </p>
      <div className="flex items-center justify-center gap-2 text-xs text-accent font-bold">
        <Shield className="w-4 h-4" />
        <span>Sans condition</span>
      </div>
    </div>
  );
}
