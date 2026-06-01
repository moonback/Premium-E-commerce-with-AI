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

export default function MentionsLegales() {
  const reduced = useReducedMotion();
  const { settings, isLoading } = useStoreSettings();

  const storeName = settings.store_name || 'Véridian Apothecary & Co.';
  const storeEmail = settings.store_email || 'contact@veridian.fr';
  const storeAddress = settings.store_address || '12 Rue du Faubourg Saint-Honoré, 75008 Paris, France';

  return (
    <>
      <SEO
        title={`Mentions Légales — ${storeName}`}
        description={`Mentions légales de ${storeName} : éditeur, hébergeur, propriété intellectuelle et données personnelles.`}
      />

      {/* Hero */}
      <section className="bg-ink text-bg py-16 px-4 sm:px-10">
        <div className="max-w-3xl mx-auto">
          <motion.p {...(reduced ? {} : fadeUp(0))} className="text-[9px] uppercase tracking-[0.35em] text-accent mb-3">
            Informations légales
          </motion.p>
          <motion.h1 {...(reduced ? {} : fadeUp(0.1))} className="font-serif text-4xl font-light">
            Mentions <em className="italic text-accent">Légales</em>
          </motion.h1>
          <motion.p {...(reduced ? {} : fadeUp(0.2))} className="mt-3 text-bg/50 text-xs">
            Dernière mise à jour : 1er juin 2026
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

          <Section title="1. Éditeur du site" delay={0} reduced={reduced}>
            <p>
              Le présent site est édité par la société <strong>{storeName} SAS</strong>,
              société par actions simplifiée au capital de [MONTANT] €, immatriculée au Registre du
              Commerce et des Sociétés de Paris sous le numéro [RCS PARIS XXX XXX XXX].
            </p>
            <p>
              <strong>Siège social :</strong> {storeAddress}<br />
              <strong>Numéro de TVA intracommunautaire :</strong> FR XX XXX XXX XXX<br />
              <strong>Email :</strong>{' '}
              <a href={`mailto:${storeEmail}`} className="text-accent underline underline-offset-2">{storeEmail}</a><br />
              {settings.store_phone && (
                <><strong>Téléphone :</strong> {settings.store_phone}<br /></>
              )}
            </p>
            <p>
              <strong>Directeur de la publication :</strong> [Prénom Nom], en qualité de Président.
            </p>
          </Section>

          <Section title="2. Hébergement" delay={0.05} reduced={reduced}>
            <p>
              Le site est hébergé par <strong>Vercel Inc.</strong>, 340 Pine Street, Suite 701,
              San Francisco, CA 94104, États-Unis —{' '}
              <a href="https://vercel.com" className="text-accent underline underline-offset-2">vercel.com</a>.
            </p>
            <p>
              La base de données est gérée par <strong>Supabase Inc.</strong>, 970 Toa Payoh North,
              #07-04, Singapour 318992 —{' '}
              <a href="https://supabase.com" className="text-accent underline underline-offset-2">supabase.com</a>.
            </p>
          </Section>

          <Section title="3. Propriété intellectuelle" delay={0.1} reduced={reduced}>
            <p>
              L'ensemble des éléments constituant ce site (textes, images, graphismes, logo, icônes,
              sons, logiciels, etc.) est la propriété exclusive de {storeName} ou de ses partenaires.
              Toute reproduction, représentation, modification, publication ou adaptation de tout ou
              partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite
              sans l'autorisation écrite préalable de {storeName}.
            </p>
          </Section>

          <Section title="4. Données personnelles" delay={0.15} reduced={reduced}>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679)
              et à la loi Informatique et Libertés du 6 janvier 1978 modifiée, vous disposez d'un
              droit d'accès, de rectification, d'effacement, de portabilité et d'opposition
              concernant vos données personnelles.
            </p>
            <p>
              Pour exercer ces droits, contactez notre Délégué à la Protection des Données (DPO) :{' '}
              <a href={`mailto:dpo@${storeEmail.split('@')[1] || 'veridian.fr'}`} className="text-accent underline underline-offset-2 font-medium">
                dpo@{storeEmail.split('@')[1] || 'veridian.fr'}
              </a>.
            </p>
            <p>
              Vous pouvez également introduire une réclamation auprès de la CNIL :{' '}
              <a href="https://www.cnil.fr" className="text-accent underline underline-offset-2">www.cnil.fr</a>.
            </p>
          </Section>

          <Section title="5. Cookies" delay={0.2} reduced={reduced}>
            <p>
              Ce site utilise des cookies techniques nécessaires à son fonctionnement, ainsi que des
              cookies analytiques (mesure d'audience anonymisée). Aucun cookie publicitaire tiers
              n'est déposé sans votre consentement explicite.
            </p>
            <p>
              Vous pouvez paramétrer ou refuser les cookies via les réglages de votre navigateur ou
              via notre bandeau de consentement.
            </p>
          </Section>

          <Section title="6. Limitation de responsabilité" delay={0.25} reduced={reduced}>
            <p>
              {storeName} s'efforce d'assurer l'exactitude et la mise à jour des informations
              diffusées sur ce site. Toutefois, elle ne peut garantir l'exactitude, la précision ou
              l'exhaustivité des informations mises à disposition. En conséquence, {storeName} décline
              toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des
              informations disponibles sur ce site.
            </p>
          </Section>

          <Section title="7. Droit applicable" delay={0.3} reduced={reduced}>
            <p>
              Les présentes mentions légales sont soumises au droit français. En cas de litige,
              les tribunaux français seront seuls compétents.
            </p>
          </Section>

        </div>
      )}
    </>
  );
}
