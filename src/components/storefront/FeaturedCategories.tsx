import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { Category } from '../../types';

interface FeaturedCategoriesProps {
  categories: Category[];
  onCategoryClick: (categoryName: string) => void;
  prefersReducedMotion: boolean;
}

const categoryImages = [
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
  'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
];

export default function FeaturedCategories({ 
  categories, 
  onCategoryClick,
  prefersReducedMotion 
}: FeaturedCategoriesProps) {
  if (categories.length === 0) return null;

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-3 block">Explorer</span>
            <h2 className="text-3xl md:text-5xl font-light font-serif text-ink">
              Nos <span className="italic">Univers</span>
            </h2>
          </div>
          <a
            href="#collection"
            className="hidden md:flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink/50 hover:text-ink transition-colors group"
          >
            Tout voir
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat, i) => (
            <motion.a
              key={cat.id}
              href="#collection"
              onClick={(e) => {
                e.preventDefault();
                onCategoryClick(cat.name);
                document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
              }}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`group relative overflow-hidden cursor-pointer ${
                i === 0 ? 'row-span-2 min-h-[300px] md:min-h-[500px]' : 'min-h-[200px] md:min-h-[240px]'
              }`}
            >
              {/* Image */}
              <div className="absolute inset-0">
                <img
                  src={cat.image_url || categoryImages[i] || categoryImages[0]}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent group-hover:from-ink/90 transition-all duration-500" />
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                <h3 className="text-white font-serif text-lg md:text-xl mb-1">{cat.name}</h3>
                <div className="flex items-center gap-2 text-white/60 text-[11px] font-medium uppercase tracking-[0.1em] group-hover:text-white/80 transition-colors">
                  <span>Découvrir</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
