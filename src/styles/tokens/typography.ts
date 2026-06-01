/**
 * Typography Tokens - Véridian Design System
 * Hiérarchie typographique complète
 */

export const typography = {
  // ─── Font Families ────────────────────────────────────────────────────
  fontFamily: {
    serif: '"Playfair Display", Georgia, "Times New Roman", serif',
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
  },

  // ─── Display (Hero sections, landing pages) ───────────────────────────
  display: {
    xl: {
      size: '6rem',        // 96px
      lineHeight: '1',
      weight: '300',
      letterSpacing: '-0.02em',
    },
    lg: {
      size: '4.5rem',      // 72px
      lineHeight: '1.1',
      weight: '300',
      letterSpacing: '-0.02em',
    },
    md: {
      size: '3.75rem',     // 60px
      lineHeight: '1.1',
      weight: '400',
      letterSpacing: '-0.01em',
    },
    sm: {
      size: '3rem',        // 48px
      lineHeight: '1.2',
      weight: '400',
      letterSpacing: '-0.01em',
    },
  },

  // ─── Headings (Section titles, card headers) ──────────────────────────
  heading: {
    h1: {
      size: '3rem',        // 48px
      lineHeight: '1.2',
      weight: '700',
      letterSpacing: '-0.01em',
    },
    h2: {
      size: '2.25rem',     // 36px
      lineHeight: '1.3',
      weight: '600',
      letterSpacing: '-0.01em',
    },
    h3: {
      size: '1.875rem',    // 30px
      lineHeight: '1.3',
      weight: '600',
      letterSpacing: '0',
    },
    h4: {
      size: '1.5rem',      // 24px
      lineHeight: '1.4',
      weight: '600',
      letterSpacing: '0',
    },
    h5: {
      size: '1.25rem',     // 20px
      lineHeight: '1.4',
      weight: '600',
      letterSpacing: '0',
    },
    h6: {
      size: '1.125rem',    // 18px
      lineHeight: '1.4',
      weight: '600',
      letterSpacing: '0',
    },
  },

  // ─── Body Text (Paragraphs, descriptions) ─────────────────────────────
  body: {
    xl: {
      size: '1.25rem',     // 20px
      lineHeight: '1.75',
      weight: '400',
      letterSpacing: '0',
    },
    lg: {
      size: '1.125rem',    // 18px
      lineHeight: '1.75',
      weight: '400',
      letterSpacing: '0',
    },
    base: {
      size: '1rem',        // 16px
      lineHeight: '1.5',
      weight: '400',
      letterSpacing: '0',
    },
    sm: {
      size: '0.875rem',    // 14px
      lineHeight: '1.5',
      weight: '400',
      letterSpacing: '0',
    },
    xs: {
      size: '0.75rem',     // 12px
      lineHeight: '1.5',
      weight: '400',
      letterSpacing: '0',
    },
  },

  // ─── Labels (Uppercase, tracked) ──────────────────────────────────────
  label: {
    lg: {
      size: '0.875rem',    // 14px
      lineHeight: '1.25',
      weight: '700',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
    base: {
      size: '0.75rem',     // 12px
      lineHeight: '1.25',
      weight: '700',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
    },
    sm: {
      size: '0.625rem',    // 10px
      lineHeight: '1.25',
      weight: '700',
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
    },
  },

  // ─── Code & Monospace ─────────────────────────────────────────────────
  code: {
    lg: {
      size: '1rem',
      lineHeight: '1.75',
      weight: '400',
    },
    base: {
      size: '0.875rem',
      lineHeight: '1.75',
      weight: '400',
    },
    sm: {
      size: '0.75rem',
      lineHeight: '1.75',
      weight: '400',
    },
  },

  // ─── Font Weights ─────────────────────────────────────────────────────
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // ─── Line Heights ─────────────────────────────────────────────────────
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // ─── Letter Spacing ───────────────────────────────────────────────────
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
    ultra: '0.2em',
    mega: '0.35em',  // Pour labels uppercase
  },
} as const;

// Type helpers
export type FontFamily = keyof typeof typography.fontFamily;
export type DisplaySize = keyof typeof typography.display;
export type HeadingLevel = keyof typeof typography.heading;
export type BodySize = keyof typeof typography.body;
export type LabelSize = keyof typeof typography.label;
