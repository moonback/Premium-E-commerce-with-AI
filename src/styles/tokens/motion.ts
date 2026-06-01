/**
 * Motion Tokens - Véridian Design System
 * Animations, transitions et easings standardisés
 */

export const motion = {
  // ─── Durées ───────────────────────────────────────────────────────────
  duration: {
    instant: 100,      // 100ms - Feedback immédiat
    fast: 200,         // 200ms - Micro-interactions
    base: 300,         // 300ms - Transitions standard
    slow: 500,         // 500ms - Animations complexes
    slower: 700,       // 700ms - Animations élaborées
    slowest: 1000,     // 1000ms - Animations dramatiques
  },

  // ─── Easings (Cubic Bezier) ───────────────────────────────────────────
  easing: {
    // Entrées (ease-in)
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
    easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
    easeInCirc: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',

    // Sorties (ease-out)
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    easeOutCirc: 'cubic-bezier(0.075, 0.82, 0.165, 1)',

    // Entrées-sorties (ease-in-out)
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
    easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    easeInOutCirc: 'cubic-bezier(0.785, 0.135, 0.15, 0.86)',

    // Spéciaux
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // ─── Presets d'Animation (Framer Motion) ──────────────────────────────
  presets: {
    // Fade
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
    },
    fadeOut: {
      initial: { opacity: 1 },
      animate: { opacity: 0 },
      exit: { opacity: 1 },
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
    },

    // Slide
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
    },
    slideDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
      transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
    },
    slideLeft: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
      transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
    },
    slideRight: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
      transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
    },

    // Scale
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
    },
    scaleOut: {
      initial: { opacity: 1, scale: 1 },
      animate: { opacity: 0, scale: 0.9 },
      exit: { opacity: 1, scale: 1 },
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
    },

    // Bounce
    bounceIn: {
      initial: { opacity: 0, scale: 0.3 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.3 },
      transition: { 
        duration: 0.5, 
        ease: [0.68, -0.55, 0.265, 1.55],
      },
    },

    // Rotate
    rotateIn: {
      initial: { opacity: 0, rotate: -10 },
      animate: { opacity: 1, rotate: 0 },
      exit: { opacity: 0, rotate: 10 },
      transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
    },

    // Blur
    blurIn: {
      initial: { opacity: 0, filter: 'blur(10px)' },
      animate: { opacity: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, filter: 'blur(10px)' },
      transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
    },
  },

  // ─── Stagger (pour listes) ────────────────────────────────────────────
  stagger: {
    fast: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
    base: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
    slow: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },

  // ─── Spring Physics ───────────────────────────────────────────────────
  spring: {
    // Doux et fluide
    soft: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 20,
    },
    // Standard (équilibré)
    base: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    },
    // Rapide et réactif
    snappy: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
    },
    // Très rapide
    quick: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 35,
    },
    // Bounce prononcé
    bouncy: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 15,
    },
  },

  // ─── Hover Effects ────────────────────────────────────────────────────
  hover: {
    scale: {
      whileHover: { scale: 1.05 },
      transition: { duration: 0.2, ease: [0, 0, 0.2, 1] },
    },
    lift: {
      whileHover: { y: -4, scale: 1.02 },
      transition: { duration: 0.2, ease: [0, 0, 0.2, 1] },
    },
    glow: {
      whileHover: { boxShadow: '0 0 20px rgba(176, 141, 87, 0.3)' },
      transition: { duration: 0.3 },
    },
  },

  // ─── Tap Effects ──────────────────────────────────────────────────────
  tap: {
    scale: {
      whileTap: { scale: 0.95 },
      transition: { duration: 0.1 },
    },
    press: {
      whileTap: { scale: 0.98, y: 2 },
      transition: { duration: 0.1 },
    },
  },
} as const;

// Type helpers
export type Duration = keyof typeof motion.duration;
export type Easing = keyof typeof motion.easing;
export type Preset = keyof typeof motion.presets;
export type SpringType = keyof typeof motion.spring;
