/**
 * Color Tokens - Véridian Design System
 * Palette de couleurs étendue et sémantique
 */

export const colors = {
  // ─── Primary Palette (Ink) ────────────────────────────────────────────
  primary: {
    50: '#F9F7F5',
    100: '#F0EDE8',
    200: '#E1DBD1',
    300: '#C8BDB0',
    400: '#A89A88',
    500: '#1C2B21', // ink - DEFAULT
    600: '#162218',
    700: '#111A14',
    800: '#0C1210',
    900: '#070B09',
    DEFAULT: '#1C2B21',
  },

  // ─── Background Palette ───────────────────────────────────────────────
  background: {
    50: '#FFFFFF',
    100: '#FDFCFB',
    200: '#F9F7F2', // bg - DEFAULT
    300: '#F5F2EC',
    400: '#F0EDE5',
    500: '#EBE7DE',
    DEFAULT: '#F9F7F2',
  },

  // ─── Accent Palette (Gold/Earth) ──────────────────────────────────────
  accent: {
    50: '#FAF8F3',
    100: '#F5F0E7',
    200: '#E8DCCA',
    300: '#D4C0A0',
    400: '#C2A77B',
    500: '#B08D57', // accent - DEFAULT
    600: '#8B6F3F',
    700: '#6B5530',
    800: '#4D3D23',
    900: '#332918',
    DEFAULT: '#B08D57',
  },

  // ─── Soft Green Palette ───────────────────────────────────────────────
  green: {
    50: '#F7FAF7',
    100: '#F0F5F0',
    200: '#E8EDE8', // soft-green - DEFAULT
    300: '#D8E3D8',
    400: '#C2D4C2',
    500: '#A8C3A8',
    600: '#7FA87F',
    700: '#5C8A5C',
    800: '#3F6B3F',
    900: '#2A4A2A',
    DEFAULT: '#E8EDE8',
  },

  // ─── Semantic Colors ──────────────────────────────────────────────────
  success: {
    light: '#D1FAE5',
    DEFAULT: '#10B981',
    dark: '#065F46',
    contrast: '#FFFFFF',
  },

  error: {
    light: '#FEE2E2',
    DEFAULT: '#EF4444',
    dark: '#991B1B',
    contrast: '#FFFFFF',
  },

  warning: {
    light: '#FEF3C7',
    DEFAULT: '#F59E0B',
    dark: '#92400E',
    contrast: '#1C2B21',
  },

  info: {
    light: '#DBEAFE',
    DEFAULT: '#3B82F6',
    dark: '#1E40AF',
    contrast: '#FFFFFF',
  },

  // ─── Neutral Grays ────────────────────────────────────────────────────
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },

  // ─── Opacity Variants (pour Tailwind) ─────────────────────────────────
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

  // ─── Special Effects ──────────────────────────────────────────────────
  glass: {
    light: 'rgba(255, 255, 255, 0.4)',
    DEFAULT: 'rgba(255, 255, 255, 0.2)',
    dark: 'rgba(28, 43, 33, 0.1)',
  },

  overlay: {
    light: 'rgba(28, 43, 33, 0.3)',
    DEFAULT: 'rgba(28, 43, 33, 0.5)',
    dark: 'rgba(28, 43, 33, 0.7)',
  },
} as const;

// Type helper pour TypeScript
export type ColorToken = keyof typeof colors;
