import React from 'react';
import { motion } from 'motion/react';
import { Leaf, Award, Sparkles } from 'lucide-react';

interface BrandValuesSectionProps {
  prefersReducedMotion: boolean;
}

const values = [
  {
    icon: Leaf,
    title: 'Durabilité',
    desc: 'Nous nous engageons pour un commerce responsable et des produits durables qui respectent l\'environnement.',
  },
  {
    icon: Award,
    title: 'Excellence',
    desc: 'Chaque produit est sélectionné avec soin pour garantir une qualité exceptionnelle et une satisfaction totale.',
  },
  {
    icon: Sparkles,
    title: 'Innovation',
    desc: 'Nous utilisons les dernières technologies pour vous offrir une expérience d\'achat unique et personnalisée.',
  },
];

export default function BrandValuesSection({ prefersReducedMotion }: BrandValuesSectionProps) {
  return (
    <section className="bg-bg py-20 md:py-28 border-t border-ink/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-3 block">Nos valeurs</span>
          <h2 className="text-3xl md:text-5xl font-light font-serif text-ink mb-4">
            Nos <span className="italic">Engagements</span>
          </h2>
          <p className="text-ink/50 max-w-lg mx-auto text-sm">
            Des valeurs qui guident chacune de nos actions
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {values.map((value, i) => (
            <motion.div
              key={i}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/8 mb-6 group-hover:bg-accent/15 transition-colors duration-300">
                <value.icon className="w-7 h-7 text-accent" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-3 text-ink">{value.title}</h3>
              <p className="text-ink/50 text-sm leading-relaxed max-w-xs mx-auto">{value.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
