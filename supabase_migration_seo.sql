-- Migration pour ajouter les champs SEO aux produits et catégories
-- Date: 2026-06-01
-- Description: Ajout des métadonnées SEO pour améliorer le référencement

-- ============================================================================
-- 1. Ajouter la colonne SEO à la table products
-- ============================================================================

-- Vérifier si la colonne existe déjà, sinon l'ajouter
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'seo'
    ) THEN
        ALTER TABLE products ADD COLUMN seo JSONB DEFAULT NULL;
        COMMENT ON COLUMN products.seo IS 'Métadonnées SEO: meta_title, meta_description, meta_keywords, og_title, og_description, og_image, canonical_url';
    END IF;
END $$;

-- ============================================================================
-- 2. Ajouter la colonne SEO à la table categories
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'seo'
    ) THEN
        ALTER TABLE categories ADD COLUMN seo JSONB DEFAULT NULL;
        COMMENT ON COLUMN categories.seo IS 'Métadonnées SEO: meta_title, meta_description, meta_keywords, og_title, og_description, og_image, canonical_url';
    END IF;
END $$;

-- ============================================================================
-- 3. Créer des index pour améliorer les performances de recherche
-- ============================================================================

-- Index GIN pour rechercher dans les données SEO des produits
CREATE INDEX IF NOT EXISTS idx_products_seo_gin ON products USING GIN (seo);

-- Index GIN pour rechercher dans les données SEO des catégories
CREATE INDEX IF NOT EXISTS idx_categories_seo_gin ON categories USING GIN (seo);

-- ============================================================================
-- 4. Exemples de données SEO (optionnel - à adapter selon vos besoins)
-- ============================================================================

-- Exemple pour un produit
-- UPDATE products 
-- SET seo = '{
--   "meta_title": "Nom du Produit - Boutique Premium",
--   "meta_description": "Découvrez notre produit exceptionnel avec livraison rapide",
--   "meta_keywords": "produit, qualité, premium",
--   "og_title": "Nom du Produit",
--   "og_description": "Description pour les réseaux sociaux",
--   "og_image": "https://example.com/image.jpg",
--   "canonical_url": "https://example.com/produit"
-- }'::jsonb
-- WHERE id = 'votre_produit_id';

-- Exemple pour une catégorie
-- UPDATE categories 
-- SET seo = '{
--   "meta_title": "Catégorie - Boutique Premium",
--   "meta_description": "Explorez notre sélection de produits dans cette catégorie",
--   "meta_keywords": "catégorie, produits, boutique",
--   "og_title": "Catégorie",
--   "og_description": "Description pour les réseaux sociaux",
--   "og_image": "https://example.com/category-image.jpg",
--   "canonical_url": "https://example.com/categorie"
-- }'::jsonb
-- WHERE id = 'votre_categorie_id';

-- ============================================================================
-- 5. Fonctions utilitaires pour gérer les données SEO
-- ============================================================================

-- Fonction pour extraire le meta_title d'un produit
CREATE OR REPLACE FUNCTION get_product_meta_title(product_id TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT seo->>'meta_title'
        FROM products
        WHERE id = product_id
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour extraire le meta_title d'une catégorie
CREATE OR REPLACE FUNCTION get_category_meta_title(category_id TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT seo->>'meta_title'
        FROM categories
        WHERE id = category_id
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. Vue pour lister tous les produits avec leurs données SEO
-- ============================================================================

CREATE OR REPLACE VIEW products_with_seo AS
SELECT 
    id,
    name,
    description,
    price,
    seo->>'meta_title' as meta_title,
    seo->>'meta_description' as meta_description,
    seo->>'meta_keywords' as meta_keywords,
    seo->>'og_title' as og_title,
    seo->>'og_description' as og_description,
    seo->>'og_image' as og_image,
    seo->>'canonical_url' as canonical_url
FROM products
WHERE seo IS NOT NULL;

-- ============================================================================
-- 7. Vue pour lister toutes les catégories avec leurs données SEO
-- ============================================================================

CREATE OR REPLACE VIEW categories_with_seo AS
SELECT 
    id,
    name,
    level,
    parent_id,
    seo->>'meta_title' as meta_title,
    seo->>'meta_description' as meta_description,
    seo->>'meta_keywords' as meta_keywords,
    seo->>'og_title' as og_title,
    seo->>'og_description' as og_description,
    seo->>'og_image' as og_image,
    seo->>'canonical_url' as canonical_url
FROM categories
WHERE seo IS NOT NULL;

-- ============================================================================
-- 8. Politique RLS (Row Level Security) - À adapter selon vos besoins
-- ============================================================================

-- Les données SEO sont publiques en lecture
-- CREATE POLICY "SEO data is publicly readable" ON products
--     FOR SELECT USING (true);

-- CREATE POLICY "SEO data is publicly readable" ON categories
--     FOR SELECT USING (true);

-- Seuls les admins peuvent modifier les données SEO
-- CREATE POLICY "Only admins can update SEO" ON products
--     FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- CREATE POLICY "Only admins can update SEO" ON categories
--     FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

-- Vérification
SELECT 
    'products' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'seo'
UNION ALL
SELECT 
    'categories' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'categories' AND column_name = 'seo';

-- Afficher un message de succès
DO $$ 
BEGIN
    RAISE NOTICE 'Migration SEO terminée avec succès !';
    RAISE NOTICE 'Les colonnes SEO ont été ajoutées aux tables products et categories';
    RAISE NOTICE 'Les index et vues ont été créés';
END $$;
