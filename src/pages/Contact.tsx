import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Loader } from 'lucide-react';
import SEO from '../components/SEO';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useStoreSettings } from '../hooks/useStoreSettings';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function Contact() {
  const prefersReducedMotion = useReducedMotion();
  const anim = (delay = 0) => prefersReducedMotion ? {} : fadeUp(delay);
  const { settings, isLoading } = useStoreSettings();

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: connecter à un service d'envoi (Supabase Edge Function, Resend, etc.)
    setSent(true);
  };

  const infoCards = [
    {
      icon: Mail,
      label: 'Email',
      value: settings.store_email || '—',
      sub: 'Réponse sous 24 h ouvrées',
    },
    {
      icon: Phone,
      label: 'Téléphone',
      value: settings.store_phone || '—',
      sub: 'Du lundi au vendredi',
    },
    {
      icon: MapPin,
      label: 'Adresse',
      value: settings.store_address || '—',
      sub: 'France',
    },
    {
      icon: Clock,
      label: 'Horaires',
      value: 'Lun – Ven : 9 h – 18 h',
      sub: 'Fermé les jours fériés',
    },
  ];

  return (
    <>
      <SEO
        title={`Contact — ${settings.store_name || 'Véridian'}`}
        description={`Contactez ${settings.store_name || 'notre équipe'} pour toute question sur vos commandes, nos produits ou un partenariat.`}
      />

      {/* ── Hero ── */}
      <section className="bg-ink text-bg py-20 px-4 sm:px-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.p {...anim(0)} className="text-[9px] uppercase tracking-[0.35em] text-accent mb-4">
            Nous sommes à votre écoute
          </motion.p>
          <motion.h1 {...anim(0.1)} className="font-serif text-4xl sm:text-5xl font-light leading-tight">
            Contactez{' '}
            <em className="italic text-accent">notre équipe</em>
          </motion.h1>
          <motion.p {...anim(0.2)} className="mt-4 text-bg/60 text-sm max-w-xl mx-auto leading-relaxed">
            {settings.store_description
              ? `${settings.store_description} — Nous vous répondons sous 24 h ouvrées.`
              : 'Une question sur votre commande, un conseil produit ou une demande de partenariat ? Nous vous répondons sous 24 h ouvrées.'}
          </motion.p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-5 gap-12">

        {/* Info cards */}
        <div className="lg:col-span-2 space-y-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 border border-ink/10 bg-soft-green/20 animate-pulse" />
              ))
            : infoCards.map(({ icon: Icon, label, value, sub }, i) => (
                <motion.div
                  key={label}
                  {...anim(i * 0.08)}
                  className="flex gap-4 p-5 border border-ink/10 bg-soft-green/30"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-accent/10 shrink-0">
                    <Icon size={18} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.25em] text-ink/40 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-ink">{value}</p>
                    <p className="text-xs text-ink/50 mt-0.5">{sub}</p>
                  </div>
                </motion.div>
              ))}
        </div>

        {/* Form */}
        <motion.div {...anim(0.15)} className="lg:col-span-3">
          {sent ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 gap-4">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                <MessageSquare size={24} className="text-accent" />
              </div>
              <h2 className="font-serif text-2xl font-light">Message envoyé</h2>
              <p className="text-sm text-ink/60 max-w-xs">
                Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.
              </p>
              <button
                onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                className="mt-4 text-[10px] uppercase tracking-[0.25em] text-accent border border-accent/40 px-6 py-2 hover:bg-accent/5 transition-colors"
              >
                Nouveau message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.25em] text-ink/50 mb-1.5" htmlFor="name">
                    Nom complet *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border border-ink/20 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-accent transition-colors"
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.25em] text-ink/50 mb-1.5" htmlFor="email">
                    Adresse email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border border-ink/20 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-accent transition-colors"
                    placeholder="jean@exemple.fr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-[0.25em] text-ink/50 mb-1.5" htmlFor="subject">
                  Sujet *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full border border-ink/20 bg-bg px-4 py-3 text-sm text-ink focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="">Sélectionnez un sujet</option>
                  <option value="commande">Suivi de commande</option>
                  <option value="produit">Question produit</option>
                  <option value="retour">Retour / Remboursement</option>
                  <option value="partenariat">Partenariat</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-[0.25em] text-ink/50 mb-1.5" htmlFor="message">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  className="w-full border border-ink/20 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-accent transition-colors resize-none"
                  placeholder="Décrivez votre demande en détail..."
                />
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 bg-ink text-bg px-8 py-3 text-[10px] uppercase tracking-[0.25em] hover:bg-accent transition-colors"
              >
                <Send size={13} />
                Envoyer le message
              </button>
            </form>
          )}
        </motion.div>
      </section>
    </>
  );
}
