-- Migration pour ajouter les fonctionnalités de prix d'achat et produits en lots
-- Date: 2026-06-01

-- Ajouter les colonnes pour le prix d'achat et les produits en lots
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS is_batch_product BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS batch_size INTEGER,
ADD COLUMN IF NOT EXISTS batch_unit TEXT;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN products.purchase_price IS 'Prix d''achat du produit (optionnel, pour calcul de marge)';
COMMENT ON COLUMN products.is_batch_product IS 'Indique si le produit est vendu en lot';
COMMENT ON COLUMN products.batch_size IS 'Nombre d''unités dans le lot (ex: 6 pour un pack de 6)';
COMMENT ON COLUMN products.batch_unit IS 'Unité du lot (ex: pièces, bouteilles, unités)';

-- Créer une vue pour calculer automatiquement les marges
CREATE OR REPLACE VIEW product_margins AS
SELECT 
  id,
  name,
  price,
  purchase_price,
  CASE 
    WHEN purchase_price IS NOT NULL AND purchase_price > 0 
    THEN ROUND(((price - purchase_price) / price * 100)::numeric, 2)
    ELSE NULL 
  END as margin_percentage,
  CASE 
    WHEN purchase_price IS NOT NULL AND purchase_price > 0 
    THEN ROUND((price - purchase_price)::numeric, 2)
    ELSE NULL 
  END as margin_amount,
  is_batch_product,
  batch_size,
  batch_unit,
  stock,
  CASE 
    WHEN is_batch_product = TRUE AND batch_size IS NOT NULL 
    THEN stock * batch_size
    ELSE stock 
  END as total_units_available
FROM products;

COMMENT ON VIEW product_margins IS 'Vue pour analyser les marges et le stock des produits';

-- Créer un index pour améliorer les performances des requêtes sur les produits en lot
CREATE INDEX IF NOT EXISTS idx_products_batch ON products(is_batch_product) WHERE is_batch_product = TRUE;

-- Créer un index pour les produits avec prix d'achat
CREATE INDEX IF NOT EXISTS idx_products_purchase_price ON products(purchase_price) WHERE purchase_price IS NOT NULL;
