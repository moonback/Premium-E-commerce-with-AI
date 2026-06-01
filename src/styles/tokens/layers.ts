/**
 * Z-Index Layers - Véridian Design System
 * Gestion centralisée des couches d'empilement
 */

export const layers = {
  // ─── Base Layers ──────────────────────────────────────────────────────
  base: 0,              // Contenu normal
  raised: 1,            // Légèrement élevé
  
  // ─── Interactive Elements ─────────────────────────────────────────────
  dropdown: 10,         // Menus déroulants
  sticky: 20,           // Headers/footers sticky
  fixed: 30,            // Éléments fixed
  
  // ─── Overlays ─────────────────────────────────────────────────────────
  overlay: 40,          // Backdrop/overlay
  drawer: 50,           // Side drawers
  modal: 60,            // Modals/dialogs
  popover: 70,          // Popovers/menus contextuels
  
  // ─── Notifications ────────────────────────────────────────────────────
  toast: 80,            // Toast notifications
  tooltip: 90,          // Tooltips
  
  // ─── Special ──────────────────────────────────────────────────────────
  skipLink: 100,        // Skip links (accessibilité)
  debug: 9999,          // Debug overlays (dev only)
} as const;

// Type helper
export type Layer = keyof typeof layers;

// Helper function pour obtenir une valeur de z-index
export const getLayer = (layer: Layer): number => layers[layer];

// Helper pour créer des sous-couches
export const subLayer = (layer: Layer, offset: number = 1): number => 
  layers[layer] + offset;
