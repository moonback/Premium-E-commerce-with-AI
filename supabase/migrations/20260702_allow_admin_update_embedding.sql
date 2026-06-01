-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : autoriser les admins à mettre à jour les embeddings des produits
-- sans nécessiter la service_role key
-- ─────────────────────────────────────────────────────────────────────────────

-- Politique : les admins peuvent mettre à jour tous les champs produits
-- (y compris embedding et embedding_updated_at)
DROP POLICY IF EXISTS "products_admin_update" ON public.products;

CREATE POLICY "products_admin_update"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Politique : les admins peuvent lire tous les produits (y compris embedding)
DROP POLICY IF EXISTS "products_admin_select" ON public.products;

CREATE POLICY "products_admin_select"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true); -- lecture publique pour tous les utilisateurs connectés

-- S'assurer que RLS est activé sur products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Accorder les permissions nécessaires
GRANT SELECT, UPDATE (embedding, embedding_updated_at) ON public.products TO authenticated;
