import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import ProductCard from '../ProductCard';
import type { Product } from '../../types';

interface FeaturedProductsProps {
  products: Product[];
  prefersReducedMotion: boolean;
}

export default function FeaturedProducts({ products, prefersReducedMotion }: FeaturedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section id="featured" className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-8 bg-accent/30" />
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Sélection</span>
            <span className="h-px w-8 bg-accent/30" />
          </div>
          <h2 className="text-3xl md:text-5xl font-light font-serif text-ink mb-4">
            Produits <span className="italic">Vedettes</span>
          </h2>
          <p className="text-ink/50 max-w-lg mx-auto text-sm leading-relaxed">
            Nos articles les plus appréciés, sélectionnés pour leur qualité exceptionnelle et leur design intemporel
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
