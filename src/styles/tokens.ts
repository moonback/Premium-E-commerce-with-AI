/**
 * Design Tokens - Véridian Editorial Aesthetic
 * Centralizes all design values for consistency
 */

export const tokens = {
  // Colors
  colors: {
    // Base
    bg: '#F9F7F2',        // Coquille d'œuf
    ink: '#1C2B21',       // Encre
    softGreen: '#E8EDE8', // Vert doux
    accent: '#B08D57',    // Doré/Terre
    
    // Semantic
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    
    // Opacity variants (for Tailwind)
    inkOpacity: {
      5: 'rgba(28, 43, 33, 0.05)',
      10: 'rgba(28, 43, 33, 0.1)',
      20: 'rgba(28, 43, 33, 0.2)',
      30: 'rgba(28, 43, 33, 0.3)',
      40: 'rgba(28, 43, 33, 0.4)',
      50: 'rgba(28, 43, 33, 0.5)',
      60: 'rgba(28, 43, 33, 0.6)',
      70: 'rgba(28, 43, 33, 0.7)',
      80: 'rgba(28, 43, 33, 0.8)',
      90: 'rgba(28, 43, 33, 0.9)',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      serif: '"Playfair Display", Georgia, serif',
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
      '7xl': '4.5rem',    // 72px
      '8xl': '6rem',      // 96px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.35em',  // For uppercase labels
    },
  },

  // Spacing (based on 4px grid)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
  },

  // Border Radius
  radius: {
    none: '0',
    sm: '0.25rem',    // 4px
    base: '0.5rem',   // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(28, 43, 33, 0.05)',
    base: '0 1px 3px 0 rgba(28, 43, 33, 0.1), 0 1px 2px -1px rgba(28, 43, 33, 0.1)',
    md: '0 4px 6px -1px rgba(28, 43, 33, 0.1), 0 2px 4px -2px rgba(28, 43, 33, 0.1)',
    lg: '0 10px 15px -3px rgba(28, 43, 33, 0.1), 0 4px 6px -4px rgba(28, 43, 33, 0.1)',
    xl: '0 20px 25px -5px rgba(28, 43, 33, 0.1), 0 8px 10px -6px rgba(28, 43, 33, 0.1)',
    '2xl': '0 25px 50px -12px rgba(28, 43, 33, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(28, 43, 33, 0.05)',
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
  },

  // Motion/Animation
  motion: {
    duration: {
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },

  // Breakpoints (for reference, Tailwind handles these)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// Type exports for TypeScript
export type ColorToken = keyof typeof tokens.colors;
export type SpacingToken = keyof typeof tokens.spacing;
export type RadiusToken = keyof typeof tokens.radius;
export type ShadowToken = keyof typeof tokens.shadows;
export type ZIndexToken = keyof typeof tokens.zIndex;
