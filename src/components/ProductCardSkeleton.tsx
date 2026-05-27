import React from 'react';
import { motion } from 'motion/react';

// Simple skeleton version of ProductCard matching the premium layout
export default function ProductCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group relative flex flex-col justify-between p-6 border border-ink/5 rounded-lg overflow-hidden animate-pulse bg-bg"
    >
      {/* Image placeholder */}
      <div className="relative aspect-[4/5] bg-ink/10 rounded-t-full mb-6"></div>

      {/* Title placeholder */}
      <div className="h-4 bg-ink/10 rounded w-3/4 mb-2"></div>
      {/* Price placeholder */}
      <div className="h-4 bg-ink/10 rounded w-1/4 mb-4"></div>

      {/* Description placeholder */}
      <div className="h-3 bg-ink/10 rounded w-full mb-2"></div>
      <div className="h-3 bg-ink/10 rounded w-5/6 mb-2"></div>

      {/* Badges / tags placeholder */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="h-5 w-12 bg-ink/10 rounded"></div>
        <div className="h-5 w-12 bg-ink/10 rounded"></div>
        <div className="h-5 w-12 bg-ink/10 rounded"></div>
      </div>

      {/* Button placeholder */}
      <div className="w-full h-10 bg-ink/10 rounded"></div>
    </motion.div>
  );
}
