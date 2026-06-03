import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShippingCarrier } from '../types';
import { SHIPPING_CARRIER_COLUMNS } from '../lib/columns';

/** Fallback si la BDD est inaccessible */
const FALLBACK: ShippingCarrier[] = [
  {
    id: 'fallback-colissimo',
    name: 'La Poste – Colissimo',
    slug: 'colissimo',
    carrier_type: 'home',
    description: 'Livraison à domicile ou en bureau de poste.',
    base_price: 4.90,
    free_above: 60,
    extra_kg_price: 0,
    min_days: 2,
    max_days: 4,
    is_active: true,
    available_countries: ['FR'],
    max_weight_kg: 30,
    tracking_url_template: 'https://www.laposte.fr/outils/suivre-vos-envois?code={tracking_number}',
    display_order: 1,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-mondial-relay',
    name: 'Mondial Relay',
    slug: 'mondial-relay',
    carrier_type: 'relay',
    description: 'Retrait en point relais parmi plus de 15 000 points en France.',
    base_price: 3.90,
    free_above: 50,
    extra_kg_price: 0,
    min_days: 3,
    max_days: 5,
    is_active: true,
    available_countries: ['FR'],
    max_weight_kg: 30,
    tracking_url_template: 'https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition={tracking_number}',
    display_order: 2,
    created_at: '',
    updated_at: '',
  },
];

let _cache: ShippingCarrier[] | null = null;

/**
 * Charge les transporteurs actifs depuis `shipping_carriers`.
 * Résultat mis en cache mémoire pour éviter des requêtes répétées.
 */
export function useShippingCarriers(cartTotal?: number) {
  const [carriers, setCarriers] = useState<ShippingCarrier[]>(_cache ?? FALLBACK);
  const [isLoading, setIsLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) return;
    let cancelled = false;

    async function load() {
      if (!supabase) { setIsLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from('shipping_carriers')
          .select(SHIPPING_CARRIER_COLUMNS)
          .eq('is_active', true)
          .order('display_order', { ascending: true }) as any;

        if (!cancelled) {
          if (!error && data && data.length > 0) {
            _cache = data;
            setCarriers(data);
          }
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  /**
   * Calcule le prix effectif d'un transporteur pour un montant de panier donné.
   * Retourne 0 si la livraison est gratuite.
   */
  const getEffectivePrice = (carrier: ShippingCarrier, total?: number): number => {
    const t = total ?? cartTotal ?? 0;
    if (carrier.free_above != null && t >= carrier.free_above) return 0;
    return carrier.base_price;
  };

  return { carriers, isLoading, getEffectivePrice };
}
