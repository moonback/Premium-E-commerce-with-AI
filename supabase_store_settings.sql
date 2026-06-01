-- =====================================================
-- STORE SETTINGS TABLE
-- Gestion des paramètres de la boutique
-- =====================================================

-- Table pour les paramètres de la boutique
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations boutique
  store_name TEXT NOT NULL DEFAULT 'Veridian Boutique',
  store_email TEXT NOT NULL DEFAULT 'contact@veridian.com',
  store_phone TEXT DEFAULT '+33 1 23 45 67 89',
  store_address TEXT,
  store_description TEXT,
  store_logo_url TEXT,
  
  -- Paramètres commerce
  currency TEXT NOT NULL DEFAULT 'EUR',
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 5.99,
  free_shipping_threshold DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  
  -- Paramètres de notification
  enable_notifications BOOLEAN DEFAULT true,
  enable_email_notifications BOOLEAN DEFAULT true,
  enable_sms_notifications BOOLEAN DEFAULT false,
  notification_email TEXT,
  
  -- Paramètres analytics
  enable_analytics BOOLEAN DEFAULT true,
  google_analytics_id TEXT,
  facebook_pixel_id TEXT,
  
  -- Paramètres SEO
  default_meta_title TEXT,
  default_meta_description TEXT,
  default_meta_keywords TEXT,
  
  -- Paramètres sociaux
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  
  -- Paramètres de maintenance
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT DEFAULT 'Site en maintenance. Nous revenons bientôt !',
  
  -- Paramètres de catalogue
  auto_publish_products BOOLEAN DEFAULT false,
  require_product_approval BOOLEAN DEFAULT true,
  enable_product_reviews BOOLEAN DEFAULT true,
  enable_wishlist BOOLEAN DEFAULT true,
  
  -- Paramètres de paiement
  enable_stripe BOOLEAN DEFAULT true,
  stripe_public_key TEXT,
  enable_paypal BOOLEAN DEFAULT false,
  paypal_client_id TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_store_settings_updated_at ON store_settings(updated_at DESC);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_store_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_store_settings_updated_at ON store_settings;
CREATE TRIGGER trigger_update_store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_store_settings_updated_at();

-- Insérer les paramètres par défaut (une seule ligne)
INSERT INTO store_settings (
  store_name,
  store_email,
  store_phone,
  store_description,
  currency,
  tax_rate,
  shipping_fee,
  free_shipping_threshold,
  low_stock_threshold,
  enable_notifications,
  enable_analytics,
  maintenance_mode
) VALUES (
  'Veridian Boutique',
  'contact@veridian.com',
  '+33 1 23 45 67 89',
  'Boutique premium de produits artisanaux et durables',
  'EUR',
  20.00,
  5.99,
  50.00,
  10,
  true,
  true,
  false
) ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les paramètres (pour afficher les infos de la boutique)
CREATE POLICY "Anyone can read store settings"
  ON store_settings
  FOR SELECT
  USING (true);

-- Seuls les admins peuvent modifier les paramètres
CREATE POLICY "Only admins can update store settings"
  ON store_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seuls les admins peuvent insérer des paramètres
CREATE POLICY "Only admins can insert store settings"
  ON store_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE store_settings IS 'Paramètres globaux de la boutique';
