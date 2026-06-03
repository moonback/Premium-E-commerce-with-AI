import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

interface HeroSectionProps {
  productsCount: number;
  categoriesCount: number;
}

export default function HeroSection({ productsCount, categoriesCount }: HeroSectionProps) {
  return (
    <section className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[20s]"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&q=80')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/30 to-ink/70" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Subtle top label */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <span className="h-px w-12 bg-white/30" />
            <span className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.35em] text-white/60">
              Maison de Qualité — Depuis 2024
            </span>
            <span className="h-px w-12 bg-white/30" />
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light font-serif text-white mb-6 leading-[0.95]"
          >
            L'Art de la
            <br />
            <span className="italic text-accent/90">Sélection</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-base md:text-lg text-white/60 max-w-xl mx-auto mb-10 font-light leading-relaxed"
          >
            Des produits d'exception, sélectionnés avec soin pour les esprits exigeants. 
            L'alliance parfaite entre esthétique et qualité.
          </motion.p>

          {/* Double CTA */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#collection"
              className="group px-8 py-4 bg-white text-ink font-semibold text-sm uppercase tracking-[0.15em] hover:bg-white/90 transition-all duration-300 flex items-center gap-2"
            >
              Explorer la collection
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#featured"
              className="group px-8 py-4 border border-white/30 text-white font-semibold text-sm uppercase tracking-[0.15em] hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
            >
              Nos vedettes
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </motion.div>

          {/* Product count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="mt-14 flex items-center justify-center gap-8 text-white/40"
          >
            <div className="text-center">
              <span className="block text-2xl font-serif italic text-white/70">{productsCount}+</span>
              <span className="text-[9px] uppercase tracking-[0.2em]">Produits</span>
            </div>
            <span className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <span className="block text-2xl font-serif italic text-white/70">{categoriesCount}</span>
              <span className="text-[9px] uppercase tracking-[0.2em]">Catégories</span>
            </div>
            <span className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <span className="block text-2xl font-serif italic text-white/70">4.9</span>
              <span className="text-[9px] uppercase tracking-[0.2em]">Note client</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg to-transparent" />
    </section>
  );
}
