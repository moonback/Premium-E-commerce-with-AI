-- Migration: Create Mega Menu Tables
-- Date: 2026-06-01
-- Description: Tables pour gérer le mega menu personnalisable

-- Table principale des items du mega menu
CREATE TABLE IF NOT EXISTS mega_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  category_id TEXT, -- Référence à une catégorie (optionnel)
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des colonnes du mega menu
CREATE TABLE IF NOT EXISTS mega_menu_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES mega_menu_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  highlight BOOLEAN DEFAULT false, -- Pour les colonnes promotions/highlights
  background_color TEXT, -- Couleur de fond (hex ou tailwind class)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des liens dans les colonnes
CREATE TABLE IF NOT EXISTS mega_menu_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES mega_menu_columns(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('category', 'product', 'page', 'external')),
  url TEXT, -- Pour external et page
  category_id TEXT, -- Pour category
  product_id TEXT, -- Pour product
  icon TEXT, -- Nom de l'icône Lucide
  description TEXT,
  image_url TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_mega_menu_items_order ON mega_menu_items("order");
CREATE INDEX IF NOT EXISTS idx_mega_menu_items_active ON mega_menu_items(is_active);
CREATE INDEX IF NOT EXISTS idx_mega_menu_columns_menu_item ON mega_menu_columns(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_mega_menu_columns_order ON mega_menu_columns("order");
CREATE INDEX IF NOT EXISTS idx_mega_menu_links_column ON mega_menu_links(column_id);
CREATE INDEX IF NOT EXISTS idx_mega_menu_links_order ON mega_menu_links("order");

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_mega_menu_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mega_menu_items_updated_at
  BEFORE UPDATE ON mega_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_mega_menu_updated_at();

CREATE TRIGGER update_mega_menu_columns_updated_at
  BEFORE UPDATE ON mega_menu_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_mega_menu_updated_at();

CREATE TRIGGER update_mega_menu_links_updated_at
  BEFORE UPDATE ON mega_menu_links
  FOR EACH ROW
  EXECUTE FUNCTION update_mega_menu_updated_at();

-- RLS Policies
ALTER TABLE mega_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mega_menu_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE mega_menu_links ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "Public can read active mega menu items"
  ON mega_menu_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read mega menu columns"
  ON mega_menu_columns FOR SELECT
  USING (true);

CREATE POLICY "Public can read mega menu links"
  ON mega_menu_links FOR SELECT
  USING (true);

-- Admin peut tout faire
CREATE POLICY "Admin can manage mega menu items"
  ON mega_menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage mega menu columns"
  ON mega_menu_columns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage mega menu links"
  ON mega_menu_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Données de seed (exemple)
INSERT INTO mega_menu_items (label, category_id, is_active, "order") VALUES
  ('Vêtements', 'cat_vetements', true, 1),
  ('Accessoires', 'cat_accessoires', true, 2),
  ('Maison', 'cat_maison', true, 3)
ON CONFLICT DO NOTHING;

-- Exemple de colonnes pour "Vêtements"
DO $$
DECLARE
  v_menu_item_id UUID;
  v_column_id UUID;
BEGIN
  -- Récupérer l'ID du menu "Vêtements"
  SELECT id INTO v_menu_item_id FROM mega_menu_items WHERE label = 'Vêtements' LIMIT 1;
  
  IF v_menu_item_id IS NOT NULL THEN
    -- Colonne 1: Catégories
    INSERT INTO mega_menu_columns (menu_item_id, title, "order", highlight)
    VALUES (v_menu_item_id, 'Catégories', 1, false)
    RETURNING id INTO v_column_id;
    
    INSERT INTO mega_menu_links (column_id, label, type, category_id, "order") VALUES
      (v_column_id, 'T-Shirts', 'category', 'cat_tshirts', 1),
      (v_column_id, 'Chemises', 'category', 'cat_chemises', 2),
      (v_column_id, 'Pantalons', 'category', 'cat_pantalons', 3),
      (v_column_id, 'Vestes', 'category', 'cat_vestes', 4);
    
    -- Colonne 2: Produits vedettes
    INSERT INTO mega_menu_columns (menu_item_id, title, "order", highlight)
    VALUES (v_menu_item_id, 'Produits vedettes', 2, false)
    RETURNING id INTO v_column_id;
    
    INSERT INTO mega_menu_links (column_id, label, type, product_id, description, "order") VALUES
      (v_column_id, 'T-Shirt Minimaliste', 'product', 'prod_1', 'Un t-shirt en coton bio', 1);
    
    -- Colonne 3: Promotions (highlight)
    INSERT INTO mega_menu_columns (menu_item_id, title, "order", highlight, background_color)
    VALUES (v_menu_item_id, 'Promotions', 3, true, 'from-accent/10 to-accent/5')
    RETURNING id INTO v_column_id;
    
    INSERT INTO mega_menu_links (column_id, label, type, url, icon, description, "order") VALUES
      (v_column_id, 'Nouveautés', 'page', '/?filter=new', 'Sparkles', 'Découvrez les derniers produits', 1),
      (v_column_id, 'Tendances', 'page', '/?sort=popular', 'TrendingUp', 'Les produits les plus populaires', 2),
      (v_column_id, 'Soldes', 'page', '/?filter=promo', 'Tag', 'Profitez des offres spéciales', 3);
  END IF;
END $$;

COMMENT ON TABLE mega_menu_items IS 'Items principaux du mega menu (ex: Vêtements, Accessoires)';
COMMENT ON TABLE mega_menu_columns IS 'Colonnes dans chaque item du mega menu';
COMMENT ON TABLE mega_menu_links IS 'Liens dans chaque colonne du mega menu';
