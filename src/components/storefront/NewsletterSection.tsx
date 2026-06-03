import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface NewsletterSectionProps {
  prefersReducedMotion: boolean;
}

export default function NewsletterSection({ prefersReducedMotion }: NewsletterSectionProps) {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement newsletter subscription (connect to Supabase subscribers table or Brevo/Mailchimp)
    setEmail('');
    toast.success('Merci pour votre inscription à la newsletter !');
  };

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1920&q=80')" }}
      />
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />
      
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-8 bg-accent/30" />
            <Mail className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Newsletter</span>
            <span className="h-px w-8 bg-accent/30" />
          </div>
          <h2 className="text-3xl md:text-5xl font-light font-serif text-white mb-4">
            Restez <span className="italic text-accent/80">informé</span>
          </h2>
          <p className="text-white/50 mb-10 max-w-xl mx-auto text-sm leading-relaxed">
            Inscrivez-vous à notre newsletter pour recevoir nos dernières nouveautés, offres exclusives et conseils style.
          </p>

          {/* Glassmorphism form card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-2xl max-w-md mx-auto">
            <form onSubmit={handleNewsletterSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email"
                required
                className="w-full px-5 py-3.5 bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-accent/50 transition-colors text-sm rounded-lg"
              />
              <button
                type="submit"
                className="w-full px-6 py-3.5 bg-accent text-white font-semibold text-sm uppercase tracking-[0.15em] hover:bg-accent/90 transition-colors rounded-lg"
              >
                S'inscrire
              </button>
            </form>
            <p className="text-[10px] text-white/30 mt-4">
              En vous inscrivant, vous acceptez de recevoir nos communications marketing.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
