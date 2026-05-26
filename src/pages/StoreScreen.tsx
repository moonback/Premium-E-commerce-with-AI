import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';

export default function StoreScreen() {
  const { products } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 8000); // Rotate every 8 seconds
    return () => clearInterval(timer);
  }, [products]);

  const currentProduct = products[currentIndex];

  return (
    <div className="min-h-screen bg-ink text-bg overflow-hidden flex flex-col font-sans relative">
      <div className="absolute top-10 left-10 flex items-center gap-4 z-20">
        <span className="font-bold text-3xl tracking-tighter font-serif italic text-white">Véridian</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentProduct.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={currentProduct.image} 
            alt="" 
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="flex-1 flex items-center px-24 z-10">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentProduct.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <div className="inline-block px-4 py-1.5 border border-white/20 text-white text-xs font-bold tracking-widest uppercase mb-6">
              Featured Product
            </div>
            <h1 className="text-7xl lg:text-8xl font-serif mb-8 leading-none">
              {currentProduct.name}
            </h1>
            <p className="text-3xl text-white/70 font-light max-w-2xl leading-relaxed mb-10 italic">
              {currentProduct.description}
            </p>
            
            <div className="flex flex-wrap gap-4 mb-16">
              {currentProduct.effects.map(effect => (
                <span key={effect} className="px-5 py-2.5 rounded-full border border-white/20 text-white text-sm uppercase tracking-widest font-bold backdrop-blur-sm">
                  {effect}
                </span>
              ))}
            </div>

            <div className="font-serif text-5xl font-semibold">
              {currentProduct.price.toFixed(2)}€
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-8 right-8 z-20 flex gap-2">
        {products.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-1000 ${i === currentIndex ? 'w-12 bg-white' : 'w-4 bg-white/30'}`} 
          />
        ))}
      </div>
    </div>
  );
}
