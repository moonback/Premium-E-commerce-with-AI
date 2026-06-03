import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

interface SavoirFaireSectionProps {
  prefersReducedMotion: boolean;
}

export default function SavoirFaireSection({ prefersReducedMotion }: SavoirFaireSectionProps) {
  return (
    <section className="py-20 md:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Image */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, x: -30 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"
                alt="Notre savoir-faire"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating accent card */}
            <div className="absolute -bottom-6 -right-6 md:bottom-8 md:-right-8 bg-white p-6 shadow-2xl max-w-[200px]">
              <p className="text-3xl font-serif italic text-accent mb-1">
                <AnimatedCounter target={98} suffix="%" />
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50">Clients satisfaits</p>
            </div>
          </motion.div>

          {/* Right — Content */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, x: 30 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-4 block">Notre histoire</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light font-serif text-ink mb-6 leading-tight">
              Le goût de <br className="hidden md:block" />
              l'<span className="italic">excellence</span>
            </h2>
            <p className="text-ink/60 mb-8 leading-relaxed">
              Depuis notre création, nous avons à cœur de sélectionner les meilleurs produits
              pour nos clients. Chaque article est choisi avec soin pour garantir une qualité
              exceptionnelle et un design intemporel qui traverse les tendances.
            </p>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-6 mb-8 pt-8 border-t border-ink/10">
              <div>
                <p className="text-2xl md:text-3xl font-serif italic text-ink">
                  <AnimatedCounter target={5000} suffix="+" />
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink/40 mt-1">Clients</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-serif italic text-ink">
                  <AnimatedCounter target={150} suffix="+" />
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink/40 mt-1">Produits</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-serif italic text-ink">
                  <AnimatedCounter target={12} />
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink/40 mt-1">Pays</p>
              </div>
            </div>

            <a
              href="#collection"
              className="group inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink border-b-2 border-ink pb-1 hover:text-accent hover:border-accent transition-colors"
            >
              Découvrir notre collection
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
