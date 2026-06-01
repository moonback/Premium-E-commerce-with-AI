-- =====================================================
-- SHIPPING CARRIERS TABLE
-- Gestion des transporteurs et modes de livraison
-- =====================================================

CREATE TABLE IF NOT EXISTS shipping_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identité du transporteur
  name TEXT NOT NULL,                          -- "La Poste – Colissimo", "Mondial Relay"
  slug TEXT NOT NULL UNIQUE,                   -- "colissimo", "mondial-relay"
  logo_url TEXT,                               -- URL du logo (optionnel)
  carrier_type TEXT NOT NULL DEFAULT 'home',   -- 'home' | 'relay' | 'express' | 'international'
  description TEXT,

  -- Tarification
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0, -- Frais de base
  free_above DECIMAL(10,2),                    -- Livraison gratuite au-dessus de ce montant (NULL = jamais gratuit)
  extra_kg_price DECIMAL(10,2) DEFAULT 0,      -- Supplément par kg supplémentaire

  -- Délais
  min_days INTEGER NOT NULL DEFAULT 1,         -- Délai minimum (jours ouvrés)
  max_days INTEGER NOT NULL DEFAULT 5,         -- Délai maximum (jours ouvrés)

  -- Disponibilité
  is_active BOOLEAN NOT NULL DEFAULT true,
  available_countries TEXT[] DEFAULT ARRAY['FR'], -- Codes ISO pays
  max_weight_kg DECIMAL(6,2) DEFAULT 30,       -- Poids max en kg

  -- Tracking
  tracking_url_template TEXT,                  -- Ex: "https://www.laposte.fr/outils/suivre-vos-envois?code={tracking_number}"

  -- Ordre d'affichage
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_shipping_carriers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_shipping_carriers_updated_at ON shipping_carriers;
CREATE TRIGGER trigger_update_shipping_carriers_updated_at
  BEFORE UPDATE ON shipping_carriers
  FOR EACH ROW
  EXECUTE FUNCTION update_shipping_carriers_updated_at();

-- ── Données initiales ──────────────────────────────────────────────────────

INSERT INTO shipping_carriers (name, slug, carrier_type, description, base_price, free_above, min_days, max_days, display_order, tracking_url_template) VALUES
(
  'La Poste – Colissimo',
  'colissimo',
  'home',
  'Livraison à domicile ou en bureau de poste. Suivi en temps réel inclus.',
  4.90,
  60.00,
  2, 4,
  1,
  'https://www.laposte.fr/outils/suivre-vos-envois?code={tracking_number}'
),
(
  'Mondial Relay',
  'mondial-relay',
  'relay',
  'Retrait en point relais parmi plus de 15 000 points en France.',
  3.90,
  50.00,
  3, 5,
  2,
  'https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition={tracking_number}'
),
(
  'Colissimo Express',
  'colissimo-express',
  'express',
  'Livraison express J+1 avant 13 h. Idéal pour les commandes urgentes.',
  9.90,
  120.00,
  1, 1,
  3,
  'https://www.laposte.fr/outils/suivre-vos-envois?code={tracking_number}'
),
(
  'Livraison Internationale',
  'international',
  'international',
  'Expédition vers plus de 30 pays. Délais variables selon la destination.',
  14.90,
  200.00,
  5, 10,
  4,
  NULL
)
ON CONFLICT (slug) DO NOTHING;

-- ── RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE shipping_carriers ENABLE ROW LEVEL SECURITY;

-- Lecture publique (pour le checkout et la page livraison)
CREATE POLICY "Public can read active carriers"
  ON shipping_carriers FOR SELECT
  USING (is_active = true);

-- Admins voient tout
CREATE POLICY "Admins can read all carriers"
  ON shipping_carriers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert carriers"
  ON shipping_carriers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update carriers"
  ON shipping_carriers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete carriers"
  ON shipping_carriers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE shipping_carriers IS 'Transporteurs et modes de livraison configurables';
