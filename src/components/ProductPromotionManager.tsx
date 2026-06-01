import React, { useState, useEffect } from 'react';
import { Tag, Calendar, Percent } from 'lucide-react';
import { ProductPromotion } from '../types';

interface ProductPromotionManagerProps {
  promotion: ProductPromotion | null | undefined;
  originalPrice: number;
  onChange: (promotion: ProductPromotion | null) => void;
}

export default function ProductPromotionManager({ promotion, originalPrice, onChange }: ProductPromotionManagerProps) {
  const [isActive, setIsActive] = useState(!!promotion);
  const [promoPrice, setPromoPrice] = useState(promotion?.promo_price || 0);
  const [startDate, setStartDate] = useState(promotion?.promo_start_date || '');
  const [endDate, setEndDate] = useState(promotion?.promo_end_date || '');
  const [promoLabel, setPromoLabel] = useState(promotion?.promo_label || '');

  useEffect(() => {
    if (promotion) {
      setIsActive(true);
      setPromoPrice(promotion.promo_price);
      setStartDate(promotion.promo_start_date);
      setEndDate(promotion.promo_end_date);
      setPromoLabel(promotion.promo_label || '');
    }
  }, [promotion]);

  const handleTogglePromotion = (active: boolean) => {
    setIsActive(active);
    if (!active) {
      onChange(null);
    }
  };

  const handleSavePromotion = () => {
    if (!isActive || !promoPrice || !startDate || !endDate) {
      onChange(null);
      return;
    }

    onChange({
      promo_price: promoPrice,
      promo_start_date: startDate,
      promo_end_date: endDate,
      promo_label: promoLabel || calculateDiscountLabel(),
    });
  };

  const calculateDiscountLabel = () => {
    if (!originalPrice || !promoPrice) return '';
    const discount = Math.round(((originalPrice - promoPrice) / originalPrice) * 100);
    return `-${discount}%`;
  };

  const calculateDiscount = () => {
    if (!originalPrice || !promoPrice) return 0;
    return Math.round(((originalPrice - promoPrice) / originalPrice) * 100);
  };

  // Auto-save when values change
  useEffect(() => {
    if (isActive && promoPrice && startDate && endDate) {
      handleSavePromotion();
    }
  }, [promoPrice, startDate, endDate, promoLabel, isActive]);

  const isPromotionActive = () => {
    if (!startDate || !endDate) return false;
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  return (
    <div className="space-y-4 border border-ink/10 p-6 bg-soft-green/5 rounded">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-ink/60" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-ink/70">
            Prix Promotionnel
          </h3>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => handleTogglePromotion(e.target.checked)}
            className="accent-ink w-5 h-5"
          />
          <span className="text-xs font-bold uppercase tracking-widest">
            {isActive ? 'Activé' : 'Désactivé'}
          </span>
        </label>
      </div>

      {isActive && (
        <div className="space-y-4">
          {/* Prix promotionnel */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">
              Prix Promotionnel (€) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max={originalPrice}
                value={promoPrice || ''}
                onChange={(e) => setPromoPrice(parseFloat(e.target.value) || 0)}
                className="w-full border-b border-ink/20 py-3 focus:outline-none focus:border-ink bg-transparent text-lg font-bold"
                placeholder="0.00"
                required
              />
              {promoPrice > 0 && originalPrice > 0 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-xs text-ink/40 line-through">{originalPrice.toFixed(2)}€</span>
                  <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                    {calculateDiscountLabel()}
                  </span>
                </div>
              )}
            </div>
            {promoPrice > 0 && (
              <p className="text-xs text-ink/60 mt-2">
                Économie : <strong>{(originalPrice - promoPrice).toFixed(2)}€</strong> ({calculateDiscount()}%)
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">
                <Calendar className="w-3 h-3 inline mr-1" />
                Date de Début *
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-ink/20 px-3 py-2 focus:outline-none focus:border-ink bg-transparent text-sm rounded"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">
                <Calendar className="w-3 h-3 inline mr-1" />
                Date de Fin *
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full border border-ink/20 px-3 py-2 focus:outline-none focus:border-ink bg-transparent text-sm rounded"
                required
              />
            </div>
          </div>

          {/* Label personnalisé */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">
              <Percent className="w-3 h-3 inline mr-1" />
              Label Promotionnel (Optionnel)
            </label>
            <input
              type="text"
              value={promoLabel}
              onChange={(e) => setPromoLabel(e.target.value)}
              className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent text-sm"
              placeholder={calculateDiscountLabel() || "Ex: Soldes, Black Friday, -30%"}
            />
            <p className="text-xs text-ink/40 mt-1">
              Laissez vide pour utiliser automatiquement le pourcentage de réduction
            </p>
          </div>

          {/* Statut de la promotion */}
          {startDate && endDate && (
            <div className={`p-4 rounded-lg border-2 ${
              isPromotionActive() 
                ? 'bg-green-50 border-green-500' 
                : 'bg-orange-50 border-orange-500'
            }`}>
              <p className="text-sm font-bold mb-1">
                {isPromotionActive() ? '✅ Promotion Active' : '⏳ Promotion Programmée'}
              </p>
              <p className="text-xs text-ink/60">
                Du {new Date(startDate).toLocaleString('fr-FR')} au {new Date(endDate).toLocaleString('fr-FR')}
              </p>
            </div>
          )}

          {/* Aperçu */}
          {promoPrice > 0 && (
            <div className="p-4 bg-soft-green/20 border border-ink/10 rounded">
              <p className="text-xs font-bold uppercase tracking-widest text-ink/70 mb-2">
                Aperçu du prix
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-red-600">{promoPrice.toFixed(2)}€</span>
                <span className="text-xl text-ink/40 line-through">{originalPrice.toFixed(2)}€</span>
                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                  {promoLabel || calculateDiscountLabel()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 p-3 bg-soft-green/20 border border-ink/10 rounded text-xs text-ink/60">
        <p className="font-bold mb-1">💡 Conseils :</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Le prix promotionnel doit être inférieur au prix normal</li>
          <li>La promotion s'active automatiquement aux dates définies</li>
          <li>Le label s'affiche sur la fiche produit et dans le catalogue</li>
          <li>Les promotions expirées sont automatiquement désactivées</li>
        </ul>
      </div>
    </div>
  );
}
