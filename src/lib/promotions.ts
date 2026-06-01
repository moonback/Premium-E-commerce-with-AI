import { Product, ProductPromotion } from '../types';

/**
 * Vérifie si une promotion est actuellement active
 */
export function isPromotionActive(promotion: ProductPromotion | null | undefined): boolean {
  if (!promotion) return false;
  
  const now = new Date();
  const start = new Date(promotion.promo_start_date);
  const end = new Date(promotion.promo_end_date);
  
  return now >= start && now <= end;
}

/**
 * Retourne le prix effectif d'un produit (prix promo si actif, sinon prix normal)
 */
export function getEffectivePrice(product: Product): number {
  if (product.promotion && isPromotionActive(product.promotion)) {
    return product.promotion.promo_price;
  }
  return product.price;
}

/**
 * Calcule le pourcentage de réduction
 */
export function getDiscountPercentage(originalPrice: number, promoPrice: number): number {
  if (originalPrice <= 0 || promoPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - promoPrice) / originalPrice) * 100);
}

/**
 * Retourne le label de promotion à afficher
 */
export function getPromotionLabel(product: Product): string | null {
  if (!product.promotion || !isPromotionActive(product.promotion)) return null;
  
  if (product.promotion.promo_label) {
    return product.promotion.promo_label;
  }
  
  const discount = getDiscountPercentage(product.price, product.promotion.promo_price);
  return discount > 0 ? `-${discount}%` : null;
}

/**
 * Calcule le montant économisé
 */
export function getSavingsAmount(product: Product): number {
  if (!product.promotion || !isPromotionActive(product.promotion)) return 0;
  return product.price - product.promotion.promo_price;
}

/**
 * Vérifie si la promotion expire bientôt (dans les 24h)
 */
export function isPromotionEndingSoon(promotion: ProductPromotion | null | undefined): boolean {
  if (!promotion || !isPromotionActive(promotion)) return false;
  
  const now = new Date();
  const end = new Date(promotion.promo_end_date);
  const hoursRemaining = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return hoursRemaining <= 24 && hoursRemaining > 0;
}

/**
 * Retourne le temps restant avant la fin de la promotion
 */
export function getPromotionTimeRemaining(promotion: ProductPromotion | null | undefined): string | null {
  if (!promotion || !isPromotionActive(promotion)) return null;
  
  const now = new Date();
  const end = new Date(promotion.promo_end_date);
  const diff = end.getTime() - now.getTime();
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}j ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else {
    return `${minutes}min`;
  }
}
