-- TASK-P1-003 & TASK-P1-004: Security fix and production indexes
-- Generated as part of the Veridian 2026 Audit

-- 1. Security Fix: Products table DELETE was unrestricted (inherited from backup.sql)
REVOKE DELETE ON TABLE public.products FROM anon;
REVOKE DELETE ON TABLE public.products FROM authenticated;
GRANT DELETE ON TABLE public.products TO authenticated;

DROP POLICY IF EXISTS "products_admin_delete" ON public.products;
CREATE POLICY "products_admin_delete"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- 2. Production Indexes

-- Index partiel `products(stock) where stock > 0`
CREATE INDEX IF NOT EXISTS products_in_stock_idx ON public.products (stock) WHERE stock > 0;

-- Index GIN sur `products.categories`
CREATE INDEX IF NOT EXISTS products_categories_gin_idx ON public.products USING GIN (categories);

-- Index `orders(created_at desc)` (pour le dashboard admin)
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);

-- Index reviews publiées par produit/date
-- Remplace l'ancien index sans tri par date
DROP INDEX IF EXISTS idx_product_reviews_published;
CREATE INDEX IF NOT EXISTS idx_product_reviews_published_time ON public.product_reviews (product_id, created_at DESC) WHERE is_published = true;
