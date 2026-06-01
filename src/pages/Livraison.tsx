import React from 'react';
import { motion } from 'motion/react';
import { Truck, Package, RefreshCw, MapPin, Clock, Shield, Loader } from 'lucide-react';
import SEO from '../components/SEO';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useStoreSettings } from '../hooks/useStoreSettings';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

function formatPrice(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
}

export default function Livraison() {
  const reduced = useReducedMotion();
  const anim = (delay = 0) => reduced ? {} : fadeUp(delay);
  const { settings, isLoading } = useStoreSettings();

  const currency = settings.currency || 'EUR';
  const shippingFee = settings.shipping_fee ?? 5.99;
  const freeThreshold = settings.free_shipping_threshold ?? 50;
  const storeName = settings.store_name || 'Véridian';
  const storeEmail = settings.store_email || 'contact@veridian.fr';
  const retourEmail = `retours@${storeEmail.split('@')[1] || 'veridian.fr'}`;

  const shippingOptions = [
    {
      name: 'Livraison Standard',
      delay: '3 – 5 jours ouvrés',
      price: formatPrice(shippingFee, currency),
      free: freeThreshold > 0 ? `Offerte dès ${formatPrice(freeThreshold, currency)}` : 'Toujours offerte',
      icon: Truck,
      description: 'Livraison à domicile ou en point relais via Colissimo / Mondial Relay.',
    },
    {
      name: 'Livraison Express',
      delay: '1 – 2 jours ouvrés',
      price: formatPrice(shippingFee * 2, currency),
      free: freeThreshold > 0 ? `Offerte dès ${formatPrice(freeThreshold * 2, currency)}` : 'Toujours offerte',
      icon: Clock,
      description: 'Expédition prioritaire, suivi en temps réel, livraison avant 13 h.',
    },
    {
      name: 'Livraison Internationale',
      delay: '5 – 10 jours ouvrés',
      price: `À partir de ${formatPrice(shippingFee * 2.5, currency)}`,
      free: `Offerte dès ${formatPrice(freeThreshold * 4, currency)}`,
      icon: MapPin,
      description: 'Disponible dans plus de 30 pays. Délais variables selon la destination.',
    },
  ];

  return (
    <>
      <SEO
        title={`Livraison & Retours — ${storeName}`}
        description={`Tout savoir sur les options de livraison, délais, frais et politique de retour de ${storeName}.`}
      />

      {/* Hero */}
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
            {freeThreshold > 0 && (
              <> Livraison offerte à partir de <strong className="text-bg">{formatPrice(freeThreshold, currency)}</strong> d'achat en France métropolitaine.</>
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
          {/* Options de livraison */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <motion.p {...anim(0)} className="text-[9px] uppercase tracking-[0.35em] text-ink/40 mb-2">
              Nos options
            </motion.p>
            <motion.h2 {...anim(0.05)} className="font-serif text-2xl font-light mb-10">
              Modes de livraison
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {shippingOptions.map(({ name, delay, price, free, icon: Icon, description }, i) => (
                <motion.div
                  key={name}
                  {...anim(i * 0.1)}
                  className="border border-ink/10 p-6 space-y-4 hover:border-accent/40 transition-colors"
                >
                  <div className="w-10 h-10 bg-accent/10 flex items-center justify-center">
                    <Icon size={18} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-ink text-sm">{name}</h3>
                    <p className="text-xs text-ink/50 mt-0.5">{description}</p>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-ink/10">
                    <div className="flex justify-between text-xs">
                      <span className="text-ink/50">Délai</span>
                      <span className="font-medium text-ink">{delay}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-ink/50">Tarif</span>
                      <span className="font-medium text-ink">{price}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-ink/50">Gratuit</span>
                      <span className="text-accent font-medium">{free}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Processus */}
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

          {/* Retours */}
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
                  <motion.div
                    key={title}
                    {...anim(i * 0.08)}
                    className="flex gap-4 p-5 border border-ink/10"
                  >
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

          {/* FAQ */}
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
