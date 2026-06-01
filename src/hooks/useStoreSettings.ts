import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StoreSettings } from '../types';

/** Valeurs de fallback si la BDD est inaccessible ou vide */
const FALLBACK: Partial<StoreSettings> = {
  store_name: 'Véridian Apothecary & Co.',
  store_email: 'contact@veridian.fr',
  store_phone: '+33 1 23 45 67 89',
  store_address: '12 Rue du Faubourg Saint-Honoré, 75008 Paris',
  store_description: 'Boutique premium de produits artisanaux et durables.',
  shipping_fee: 5.99,
  free_shipping_threshold: 50,
  facebook_url: '',
  instagram_url: '',
  twitter_url: '',
  linkedin_url: '',
};

let _cache: Partial<StoreSettings> | null = null;

/**
 * Charge les paramètres de la boutique depuis `store_settings`.
 * Le résultat est mis en cache en mémoire pour éviter des requêtes répétées
 * lors de la navigation entre les pages légales.
 */
export function useStoreSettings() {
  const [settings, setSettings] = useState<Partial<StoreSettings>>(
    _cache ?? FALLBACK
  );
  const [isLoading, setIsLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) return; // déjà chargé

    let cancelled = false;

    async function load() {
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (!cancelled) {
          if (!error && data) {
            _cache = data;
            setSettings(data);
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

  return { settings, isLoading };
}
