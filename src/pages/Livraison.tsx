import React from 'react';
import { motion } from 'motion/react';
import { Truck, Package, RefreshCw, MapPin, Zap, Globe, Shield, Loader, CheckCircle2 } from 'lucide-react';
import SEO from '../components/SEO';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useStoreSettings } from '../hooks/useStoreSettings';
import { useShippingCarriers } from '../hooks/useShippingCarriers';
import { CarrierType } from '../types';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

const CARRIER_TYPE_CONFIG: Record<CarrierType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  home:          { label: 'Domicile',      icon: Truck,  color: 'text-blue-600',    bg: 'bg-blue-50'    },
  relay:         { label: 'Point Relais',  icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  express:       { label: 'Express',       icon: Zap,    color: 'text-amber-600',   bg: 'bg-amber-50'   },
  international: { label: 'International', icon: Globe,  color: 'text-purple-600',  bg: 'bg-purple-50'  },
};

function formatPrice(n: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(n);
}

function delayLabel(min: number, max: number) {
  if (min === max) return `${min} jour${min > 1 ? 's' : ''} ouvré${min > 1 ? 's' : ''}`;
  return `${min} – ${max} jours ouvrés`;
}

export default function Livraison() {
  const reduced = useReducedMotion();
  const anim = (delay = 0) => reduced ? {} : fadeUp(delay);
  const { settings, isLoading: settingsLoading } = useStoreSettings();
  const { carriers, isLoading: carriersLoading } = useShippingCarriers();

  const storeName = settings.store_name || 'Véridian';
  const storeEmail = settings.store_email || 'contact@veridian.fr';
  const retourEmail = `retours@${storeEmail.split('@')[1] || 'veridian.fr'}`;
  const currency = settings.currency || 'EUR';

  const isLoading = settingsLoading || carriersLoading;

  return (
    <>
      <SEO
        title={`Livraison & Retours — ${storeName}`}
        description={`Tout savoir sur les options de livraison, délais, frais et politique de retour de ${storeName}.`}
      />

      {/* ── Hero ── */}
      <section className="bg-ink text-bg py-16 px-4 sm:px-10">
        <div className="max-w-3xl mx-auto">
          <motion.p {...anim(0)} className="text-[9px] uppercase tracking-[0.35em] text-accent mb-3">
            Expédition & Retours
          </motion.p>
          <motion.h1 {...anim(0.1)} className="font-serif text-4xl font-light">
            Livraison <em className="italic text-accent">& Retours</em>
          </motion.h1>
          <motion.p {...anim(0.2)} className="mt-3 text-bg/60 text-sm max-w-xl leading-relaxed">
            Nous expédions vos commandes avec soin depuis notre entrepôt.
            {carriers.some(c => c.free_above != null) && (
              <> Livraison offerte à partir de{' '}
                <strong className="text-bg">
                  {formatPrice(Math.min(...carriers.filter(c => c.free_above != null).map(c => c.free_above!)), currency)}
                </strong>{' '}
                d'achat.
              </>
            )}
          </motion.p>
        </div>
      </section>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader size={24} className="animate-spin text-ink/30" />
        </div>
      ) : (
        <>
          {/* ── Transporteurs ── */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <motion.p {...anim(0)} className="text-[9px] uppercase tracking-[0.35em] text-ink/40 mb-2">
              Nos transporteurs
            </motion.p>
            <motion.h2 {...anim(0.05)} className="font-serif text-2xl font-light mb-10">
              Modes de livraison disponibles
            </motion.h2>

            {carriers.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 border border-dashed border-ink/20 text-ink/40">
                <Package size={28} />
                <p className="text-sm">Aucun mode de livraison configuré pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {carriers.map((carrier, i) => {
                  const cfg = CARRIER_TYPE_CONFIG[carrier.carrier_type] ?? CARRIER_TYPE_CONFIG.home;
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={carrier.id}
                      {...anim(i * 0.08)}
                      className="border border-ink/10 p-6 space-y-4 hover:border-accent/40 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${cfg.bg}`}>
                          <Icon size={18} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-ink text-sm">{carrier.name}</h3>
                            <span className={`text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>
                          {carrier.description && (
                            <p className="text-xs text-ink/50 mt-0.5">{carrier.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5 pt-3 border-t border-ink/10">
                        <div className="flex justify-between text-xs">
                          <span className="text-ink/50">Délai</span>
                          <span className="font-medium text-ink">{delayLabel(carrier.min_days, carrier.max_days)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-ink/50">Tarif</span>
                          <span className="font-medium text-ink">{formatPrice(carrier.base_price, currency)}</span>
                        </div>
                        {carrier.free_above != null && (
                          <div className="flex justify-between text-xs">
                            <span className="text-ink/50">Livraison gratuite</span>
                            <span className="text-accent font-medium">
                              Dès {formatPrice(carrier.free_above, currency)}
                            </span>
                          </div>
                        )}
                        {carrier.available_countries && carrier.available_countries.length > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-ink/50">Pays</span>
                            <span className="text-ink/70">{carrier.available_countries.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Processus ── */}
          <section className="bg-soft-green/30 py-16 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
              <motion.p {...anim(0)} className="text-[9px] uppercase tracking-[0.35em] text-ink/40 mb-2">
                Comment ça marche
              </motion.p>
              <motion.h2 {...anim(0.05)} className="font-serif text-2xl font-light mb-10">
                Votre commande, étape par étape
              </motion.h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { step: '01', title: 'Commande validée', text: 'Vous recevez un email de confirmation avec le récapitulatif de votre commande.' },
                  { step: '02', title: 'Préparation', text: 'Notre équipe prépare votre colis avec soin dans un délai de 24 h ouvrées.' },
                  { step: '03', title: 'Expédition', text: 'Votre colis est remis au transporteur. Un numéro de suivi vous est envoyé par email.' },
                  { step: '04', title: 'Livraison', text: "Votre commande est livrée à l'adresse indiquée ou en point relais selon votre choix." },
                ].map(({ step, title, text }, i) => (
                  <motion.div key={step} {...anim(i * 0.08)} className="space-y-3">
                    <span className="font-serif text-4xl text-accent/30 font-light">{step}</span>
                    <h3 className="text-sm font-medium text-ink">{title}</h3>
                    <p className="text-xs text-ink/60 leading-relaxed">{text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Retours ── */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <motion.p {...anim(0)} className="text-[9px] uppercase tracking-[0.35em] text-ink/40 mb-2">
                  Politique de retour
                </motion.p>
                <motion.h2 {...anim(0.05)} className="font-serif text-2xl font-light mb-6">
                  Retours & Remboursements
                </motion.h2>
                <motion.div {...anim(0.1)} className="space-y-4 text-sm text-ink/70 leading-relaxed">
                  <p>
                    Vous disposez de <strong className="text-ink">14 jours calendaires</strong> à compter
                    de la réception de votre commande pour exercer votre droit de rétractation, sans
                    justification.
                  </p>
                  <p>
                    Les produits doivent être retournés dans leur état d'origine, non utilisés, non
                    descellés et dans leur emballage d'origine. Les frais de retour sont à la charge
                    du Client sauf en cas de produit défectueux ou d'erreur de notre part.
                  </p>
                  <p>
                    Le remboursement est effectué dans un délai de <strong className="text-ink">14 jours</strong>{' '}
                    suivant la réception du retour, par le même moyen de paiement que celui utilisé
                    lors de la commande.
                  </p>
                </motion.div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: RefreshCw,
                    title: 'Comment initier un retour ?',
                    text: `Contactez-nous à ${retourEmail} avec votre numéro de commande. Nous vous enverrons les instructions et une étiquette de retour si applicable.`,
                  },
                  {
                    icon: Package,
                    title: 'Produit endommagé ou incorrect ?',
                    text: 'Prenez une photo du produit et contactez-nous dans les 48 h suivant la réception. Nous procéderons à un renvoi ou un remboursement immédiat.',
                  },
                  {
                    icon: Shield,
                    title: 'Garantie produit',
                    text: 'Tous nos produits bénéficient de la garantie légale de conformité de 2 ans. En cas de défaut, nous prenons en charge les frais de retour.',
                  },
                ].map(({ icon: Icon, title, text }, i) => (
                  <motion.div key={title} {...anim(i * 0.08)} className="flex gap-4 p-5 border border-ink/10">
                    <div className="w-9 h-9 bg-accent/10 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-ink mb-1">{title}</h3>
                      <p className="text-xs text-ink/60 leading-relaxed">{text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="bg-ink text-bg py-14 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <motion.h2 {...anim(0)} className="font-serif text-2xl font-light mb-8 text-center">
                Questions fréquentes
              </motion.h2>
              <div className="space-y-6">
                {[
                  {
                    q: "Puis-je modifier mon adresse de livraison après commande ?",
                    a: `Oui, si la commande n'a pas encore été expédiée. Contactez-nous rapidement à ${storeEmail}.`,
                  },
                  {
                    q: "Livrez-vous dans les DOM-TOM ?",
                    a: "Oui, avec un délai de 7 à 14 jours ouvrés. Des frais supplémentaires peuvent s'appliquer.",
                  },
                  {
                    q: "Mon colis est perdu, que faire ?",
                    a: `Contactez-nous après le délai de livraison estimé à ${storeEmail}. Nous ouvrons une enquête auprès du transporteur et vous proposons un renvoi ou un remboursement.`,
                  },
                  {
                    q: "Puis-je suivre ma commande en temps réel ?",
                    a: "Oui, un lien de suivi vous est envoyé par email dès l'expédition de votre colis.",
                  },
                ].map(({ q, a }, i) => (
                  <motion.div key={i} {...anim(i * 0.06)} className="border-t border-bg/10 pt-5">
                    <p className="text-sm font-medium text-bg mb-2">{q}</p>
                    <p className="text-xs text-bg/60 leading-relaxed">{a}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
