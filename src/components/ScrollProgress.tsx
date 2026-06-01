// src/components/ScrollProgress.tsx
import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { layers } from '../styles/tokens/layers';

export interface ScrollProgressProps {
  color?: string;
  height?: number;
  showPercentage?: boolean;
}

export default function ScrollProgress({
  color = 'var(--color-accent)',
  height = 3,
  showPercentage = false,
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      setPercentage(Math.round(latest * 100));
    });
  }, [scrollYProgress]);

  return (
    <>
      {/* Barre de progression */}
      <motion.div
        className="fixed top-0 left-0 right-0 origin-left"
        style={{
          scaleX,
          height: `${height}px`,
          backgroundColor: color,
          zIndex: layers.sticky,
        }}
      />

      {/* Pourcentage optionnel */}
      {showPercentage && percentage > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 right-6 px-3 py-1.5 bg-accent text-bg rounded-full text-xs font-bold shadow-lg"
          style={{ zIndex: layers.sticky }}
        >
          {percentage}%
        </motion.div>
      )}
    </>
  );
}
