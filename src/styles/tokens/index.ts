/**
 * Design Tokens - Véridian Design System
 * Point d'entrée centralisé pour tous les tokens
 */

export { colors, type ColorToken } from './colors';
export { 
  typography, 
  type FontFamily, 
  type DisplaySize, 
  type HeadingLevel, 
  type BodySize, 
  type LabelSize 
} from './typography';
export { 
  motion, 
  type Duration, 
  type Easing, 
  type Preset, 
  type SpringType 
} from './motion';
export { layers, getLayer, subLayer, type Layer } from './layers';

// Réexporter les tokens legacy pour compatibilité
export { tokens } from '../tokens';
