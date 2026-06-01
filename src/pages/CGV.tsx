import React from 'react';
import { motion } from 'motion/react';
import { Loader } from 'lucide-react';
import SEO from '../components/SEO';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useStoreSettings } from '../hooks/useStoreSettings';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

function Section({ title, children, delay = 0, reduced }: {
  title: string;
  children: React.ReactNode;
  delay?: number;
  reduced: boolean;
}) {
  return (
    <motion.section
      {...(reduced ? {} : fadeUp(delay))}
      className="border-t border-ink/10 pt-8 pb-2"
    >
      <h2 className="font-serif text-xl font-light mb-4 text-ink">{title}</h2>
      <div className="text-sm text-ink/70 leading-relaxed space-y-3">{children}</div>
    </motion.section>
  );
}

/** Formate un montant selon la devise de la boutique */
function formatPrice(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
}

export default function CGV() {
  const reduced = useReducedMotion();
  const { settings, isLoading } = useStoreSettings();

  const storeName = settings.store_name || 'Véridian Apothecary & Co.';
  const storeEmail = settings.store_email || 'contact@veridian.fr';
  const storeAddress = settings.store_address || '12 Rue du Faubourg Saint-Honoré, 75008 Paris, France';
  const currency = settings.currency || 'EUR';
  const shippingFee = settings.shipping_fee ?? 5.99;
  const freeThreshold = settings.free_shipping_threshold ?? 50;

  return (
    <>
      <SEO
        title={`Conditions Générales de Vente — ${storeName}`}
        description={`Conditions générales de vente applicables à toutes les commandes passées sur le site ${storeName}.`}
      />

      {/* Hero */}
      <section className="bg-ink text-bg py-16 px-4 sm:px-10">
        <div className="max-w-3xl mx-auto">
          <motion.p {...(reduced ? {} : fadeUp(0))} className="text-[9px] uppercase tracking-[0.35em] text-accent mb-3">
            Conditions contractuelles
          </motion.p>
          <motion.h1 {...(reduced ? {} : fadeUp(0.1))} className="font-serif text-4xl font-light">
            Conditions Générales{' '}
            <em className="italic text-accent">de Vente</em>
          </motion.h1>
          <motion.p {...(reduced ? {} : fadeUp(0.2))} className="mt-3 text-bg/50 text-xs">
            Version en vigueur au 1er juin 2026 — applicables à toute commande passée sur notre site
          </motion.p>
        </div>
      </section>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader size={24} className="animate-spin text-ink/30" />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-0">

          <Section title="1. Objet et champ d'application" delay={0} reduced={reduced}>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles
              entre <strong>{storeName} SAS</strong> (ci-après « le Vendeur ») et toute personne
              physique ou morale effectuant un achat sur notre site (ci-après « le Client »).
            </p>
            <p>
              Toute commande implique l'acceptation pleine et entière des présentes CGV. Le Vendeur
              se réserve le droit de les modifier à tout moment ; les CGV applicables sont celles en
              vigueur à la date de la commande.
            </p>
            <p>
              <strong>Coordonnées du Vendeur :</strong><br />
              {storeName} SAS — {storeAddress}<br />
              Email :{' '}
              <a href={`mailto:${storeEmail}`} className="text-accent underline underline-offset-2">{storeEmail}</a>
              {settings.store_phone && <><br />Tél. : {settings.store_phone}</>}
            </p>
          </Section>

          <Section title="2. Produits" delay={0.05} reduced={reduced}>
            <p>
              Les produits proposés à la vente sont ceux figurant sur le site au moment de la
              consultation par le Client. Les photographies et descriptions sont fournies à titre
              indicatif et ne sont pas contractuelles.
            </p>
            <p>
              Le Vendeur se réserve le droit de retirer tout produit du catalogue à tout moment et
              de modifier les caractéristiques des produits sans préavis.
            </p>
          </Section>

          <Section title="3. Prix" delay={0.1} reduced={reduced}>
            <p>
              Les prix sont indiqués en <strong>{currency}</strong> toutes taxes comprises (TTC),
              hors frais de livraison. Le taux de TVA applicable est celui en vigueur au jour de la
              commande{settings.tax_rate ? ` (actuellement ${settings.tax_rate} %)` : ''}.
            </p>
            <p>
              Le Vendeur se réserve le droit de modifier ses prix à tout moment. Les produits seront
              facturés sur la base des tarifs en vigueur au moment de la validation de la commande.
            </p>
          </Section>

          <Section title="4. Commande" delay={0.15} reduced={reduced}>
            <p>
              La commande est validée après confirmation du paiement. Un email de confirmation est
              envoyé au Client récapitulant les produits commandés, les prix, les frais de livraison
              et l'adresse de livraison.
            </p>
            <p>
              Le Vendeur se réserve le droit d'annuler ou de refuser toute commande d'un Client avec
              lequel il existerait un litige relatif au paiement d'une commande antérieure.
            </p>
          </Section>

          <Section title="5. Paiement" delay={0.2} reduced={reduced}>
            <p>
              Le paiement s'effectue en ligne par carte bancaire (Visa, Mastercard, American Express)
              {settings.enable_paypal ? ' ou via PayPal' : ''}. Le paiement est sécurisé par
              chiffrement SSL.
            </p>
            <p>
              Le débit est effectué au moment de la validation de la commande. En cas de refus de
              paiement, la commande est automatiquement annulée.
            </p>
          </Section>

          <Section title="6. Livraison" delay={0.25} reduced={reduced}>
            <p>
              Les frais de livraison standard s'élèvent à{' '}
              <strong>{formatPrice(shippingFee, currency)}</strong>.
              {freeThreshold > 0 && (
                <> La livraison est offerte pour toute commande supérieure à{' '}
                <strong>{formatPrice(freeThreshold, currency)}</strong>.</>
              )}
            </p>
            <p>
              Les modalités complètes sont détaillées dans notre{' '}
              <a href="/livraison" className="text-accent underline underline-offset-2">
                politique de livraison
              </a>
              . Les délais indiqués sont des estimations et ne constituent pas un engagement ferme.
            </p>
            <p>
              Le risque de perte ou d'endommagement des produits est transféré au Client au moment
              de la livraison physique des produits.
            </p>
          </Section>

          <Section title="7. Droit de rétractation" delay={0.3} reduced={reduced}>
            <p>
              Conformément à l'article L.221-18 du Code de la consommation, le Client dispose d'un
              délai de <strong>14 jours calendaires</strong> à compter de la réception des produits
              pour exercer son droit de rétractation, sans avoir à justifier de motifs ni à payer de
              pénalités.
            </p>
            <p>
              Pour exercer ce droit, le Client doit notifier sa décision par email à{' '}
              <a href={`mailto:retours@${storeEmail.split('@')[1] || 'veridian.fr'}`} className="text-accent underline underline-offset-2 font-medium">
                retours@{storeEmail.split('@')[1] || 'veridian.fr'}
              </a>{' '}
              ou via le formulaire de contact. Les produits doivent être retournés dans leur état
              d'origine, non utilisés et dans leur emballage d'origine.
            </p>
            <p>
              <strong>Exceptions :</strong> Le droit de rétractation ne s'applique pas aux produits
              descellés après livraison qui ne peuvent être renvoyés pour des raisons d'hygiène ou
              de protection de la santé.
            </p>
          </Section>

          <Section title="8. Garanties" delay={0.35} reduced={reduced}>
            <p>
              Tous les produits bénéficient de la garantie légale de conformité (articles L.217-4 et
              suivants du Code de la consommation) et de la garantie contre les vices cachés
              (articles 1641 et suivants du Code civil).
            </p>
          </Section>

          <Section title="9. Responsabilité" delay={0.4} reduced={reduced}>
            <p>
              La responsabilité du Vendeur ne pourra être engagée en cas de mauvaise utilisation des
              produits par le Client, de force majeure, ou de fait imprévisible et insurmontable d'un
              tiers au contrat.
            </p>
          </Section>

          <Section title="10. Données personnelles" delay={0.45} reduced={reduced}>
            <p>
              Les données collectées lors de la commande sont nécessaires au traitement de celle-ci
              et sont traitées conformément à notre{' '}
              <a href="/mentions-legales" className="text-accent underline underline-offset-2">
                politique de confidentialité
              </a>{' '}
              et au RGPD. Elles ne sont jamais cédées à des tiers à des fins commerciales.
            </p>
          </Section>

          <Section title="11. Droit applicable et litiges" delay={0.5} reduced={reduced}>
            <p>
              Les présentes CGV sont soumises au droit français. En cas de litige, le Client peut
              recourir à la médiation de la consommation via la plateforme européenne de règlement
              en ligne des litiges :{' '}
              <a href="https://ec.europa.eu/consumers/odr" className="text-accent underline underline-offset-2">
                ec.europa.eu/consumers/odr
              </a>.
            </p>
            <p>
              À défaut de résolution amiable, les tribunaux compétents seront ceux du ressort du
              siège social du Vendeur.
            </p>
          </Section>

        </div>
      )}
    </>
  );
}
