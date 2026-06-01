-- Migration pour ajouter les badges et promotions aux produits
-- Date: 2026-06-01
-- Description: Ajout des badges (vedette, bestseller, etc.) et système de promotions temporaires

-- ============================================================================
-- 1. Ajouter la colonne badges à la table products
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'badges'
    ) THEN
        ALTER TABLE products ADD COLUMN badges TEXT[] DEFAULT '{}';
        COMMENT ON COLUMN products.badges IS 'Badges du produit: featured, bestseller, top_sales, new, limited';
    END IF;
END $$;

-- ============================================================================
-- 2. Ajouter la colonne promotion à la table products
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'promotion'
    ) THEN
        ALTER TABLE products ADD COLUMN promotion JSONB DEFAULT NULL;
        COMMENT ON COLUMN products.promotion IS 'Promotion temporaire: promo_price, promo_start_date, promo_end_date, promo_label';
    END IF;
END $$;

-- ============================================================================
-- 3. Ajouter la colonne total_sales pour tracker les ventes
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'total_sales'
    ) THEN
        ALTER TABLE products ADD COLUMN total_sales INTEGER DEFAULT 0;
        COMMENT ON COLUMN products.total_sales IS 'Nombre total de ventes du produit';
    END IF;
END $$;

-- ============================================================================
-- 4. Créer des index pour améliorer les performances
-- ============================================================================

-- Index GIN pour rechercher dans les badges
CREATE INDEX IF NOT EXISTS idx_products_badges_gin ON products USING GIN (badges);

-- Index GIN pour rechercher dans les promotions
CREATE INDEX IF NOT EXISTS idx_products_promotion_gin ON products USING GIN (promotion);

-- Index pour les produits en vedette
CREATE INDEX IF NOT EXISTS idx_products_featured ON products ((badges @> ARRAY['featured']::TEXT[]));

-- Index pour les bestsellers
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON products ((badges @> ARRAY['bestseller']::TEXT[]));

-- Index pour les meilleures ventes
CREATE INDEX IF NOT EXISTS idx_products_top_sales ON products (total_sales DESC);

-- ============================================================================
-- 5. Fonctions utilitaires
-- ============================================================================

-- Fonction pour vérifier si une promotion est active
CREATE OR REPLACE FUNCTION is_promotion_active(promo JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    IF promo IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN NOW() >= (promo->>'promo_start_date')::TIMESTAMP 
       AND NOW() <= (promo->>'promo_end_date')::TIMESTAMP;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour obtenir le prix effectif d'un produit
CREATE OR REPLACE FUNCTION get_effective_price(product_id TEXT)
RETURNS NUMERIC AS $$
DECLARE
    product_record RECORD;
BEGIN
    SELECT price, promotion INTO product_record
    FROM products
    WHERE id = product_id;
    
    IF product_record.promotion IS NOT NULL 
       AND is_promotion_active(product_record.promotion) THEN
        RETURN (product_record.promotion->>'promo_price')::NUMERIC;
    END IF;
    
    RETURN product_record.price;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour incrémenter les ventes d'un produit
CREATE OR REPLACE FUNCTION increment_product_sales(product_id TEXT, quantity INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET total_sales = COALESCE(total_sales, 0) + quantity
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. Vues utiles
-- ============================================================================

-- Vue des produits en promotion active
CREATE OR REPLACE VIEW products_on_promotion AS
SELECT 
    id,
    name,
    price,
    (promotion->>'promo_price')::NUMERIC as promo_price,
    (promotion->>'promo_start_date')::TIMESTAMP as promo_start_date,
    (promotion->>'promo_end_date')::TIMESTAMP as promo_end_date,
    promotion->>'promo_label' as promo_label,
    ROUND(((price - (promotion->>'promo_price')::NUMERIC) / price * 100)::NUMERIC, 0) as discount_percentage
FROM products
WHERE promotion IS NOT NULL
  AND is_promotion_active(promotion);

-- Vue des produits en vedette
CREATE OR REPLACE VIEW featured_products AS
SELECT *
FROM products
WHERE badges @> ARRAY['featured']::TEXT[]
ORDER BY created_at DESC;

-- Vue des bestsellers
CREATE OR REPLACE VIEW bestseller_products AS
SELECT *
FROM products
WHERE badges @> ARRAY['bestseller']::TEXT[]
ORDER BY total_sales DESC;

-- Vue des meilleures ventes (top 20)
CREATE OR REPLACE VIEW top_selling_products AS
SELECT 
    id,
    name,
    price,
    total_sales,
    stock,
    badges
FROM products
WHERE total_sales > 0
ORDER BY total_sales DESC
LIMIT 20;

-- Vue des nouveaux produits
CREATE OR REPLACE VIEW new_products AS
SELECT *
FROM products
WHERE badges @> ARRAY['new']::TEXT[]
   OR created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- ============================================================================
-- 7. Trigger pour nettoyer les promotions expirées (optionnel)
-- ============================================================================

-- Fonction pour nettoyer les promotions expirées
CREATE OR REPLACE FUNCTION clean_expired_promotions()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.promotion IS NOT NULL 
       AND NOT is_promotion_active(NEW.promotion) 
       AND (NEW.promotion->>'promo_end_date')::TIMESTAMP < NOW() THEN
        NEW.promotion = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger qui s'exécute avant chaque UPDATE
DROP TRIGGER IF EXISTS trigger_clean_expired_promotions ON products;
CREATE TRIGGER trigger_clean_expired_promotions
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION clean_expired_promotions();

-- ============================================================================
-- 8. Exemples de données (optionnel)
-- ============================================================================

-- Exemple: Ajouter des badges à un produit
-- UPDATE products 
-- SET badges = ARRAY['featured', 'bestseller']::TEXT[]
-- WHERE id = 'votre_produit_id';

-- Exemple: Ajouter une promotion
-- UPDATE products 
-- SET promotion = '{
--   "promo_price": 19.99,
--   "promo_start_date": "2026-06-01T00:00:00",
--   "promo_end_date": "2026-06-30T23:59:59",
--   "promo_label": "-30%"
-- }'::jsonb
-- WHERE id = 'votre_produit_id';

-- Exemple: Incrémenter les ventes
-- SELECT increment_product_sales('votre_produit_id', 5);

-- ============================================================================
-- 9. Requêtes utiles pour l'administration
-- ============================================================================

-- Lister tous les produits avec promotions actives
-- SELECT * FROM products_on_promotion;

-- Lister tous les produits en vedette
-- SELECT * FROM featured_products;

-- Lister les 20 meilleures ventes
-- SELECT * FROM top_selling_products;

-- Compter les produits par badge
-- SELECT 
--     unnest(badges) as badge,
--     COUNT(*) as count
-- FROM products
-- WHERE badges IS NOT NULL AND array_length(badges, 1) > 0
-- GROUP BY badge
-- ORDER BY count DESC;

-- Trouver les promotions qui expirent dans les 7 prochains jours
-- SELECT 
--     id,
--     name,
--     (promotion->>'promo_end_date')::TIMESTAMP as expires_at
-- FROM products
-- WHERE promotion IS NOT NULL
--   AND is_promotion_active(promotion)
--   AND (promotion->>'promo_end_date')::TIMESTAMP <= NOW() + INTERVAL '7 days'
-- ORDER BY expires_at;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

-- Vérification
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'products' 
  AND column_name IN ('badges', 'promotion', 'total_sales')
ORDER BY column_name;

-- Afficher un message de succès
DO $$ 
BEGIN
    RAISE NOTICE 'Migration Badges & Promotions terminée avec succès !';
    RAISE NOTICE 'Les colonnes badges, promotion et total_sales ont été ajoutées';
    RAISE NOTICE 'Les index, fonctions et vues ont été créés';
    RAISE NOTICE 'Le trigger de nettoyage des promotions expirées est actif';
END $$;
