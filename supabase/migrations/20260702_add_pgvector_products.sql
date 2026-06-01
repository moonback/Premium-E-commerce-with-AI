-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : pgvector — embeddings sémantiques des produits
-- Modèle    : gemini-embedding-2 (Google Gemini) — 3072 dimensions
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Activer l'extension pgvector (nécessite Supabase ≥ 1.0 ou pg_vector installé)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Ajouter la colonne embedding sur la table products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS embedding vector(3072);

-- 3. Index HNSW pour la recherche ANN (Approximate Nearest Neighbor)
--    ef_construction=64, m=16 : bon équilibre vitesse/précision pour < 100k produits
CREATE INDEX IF NOT EXISTS products_embedding_hnsw_idx
  ON public.products
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Index partiel pour ne chercher que les produits vectorisés
CREATE INDEX IF NOT EXISTS products_embedding_not_null_idx
  ON public.products (id)
  WHERE embedding IS NOT NULL;

-- 5. Fonction de recherche sémantique
CREATE OR REPLACE FUNCTION public.match_products(
  query_embedding  vector(3072),
  match_threshold  float    DEFAULT 0.5,
  match_count      int      DEFAULT 5,
  filter_in_stock  boolean  DEFAULT true
)
RETURNS TABLE (
  id          text,
  name        text,
  description text,
  price       numeric,
  stock       int,
  categories  text[],
  effects     text[],
  image       text,
  similarity  float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    p.stock,
    p.categories,
    p.effects,
    p.image,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.products p
  WHERE
    p.embedding IS NOT NULL
    AND (NOT filter_in_stock OR p.stock > 0)
    AND 1 - (p.embedding <=> query_embedding) >= match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 6. Permissions
GRANT EXECUTE ON FUNCTION public.match_products TO authenticated, service_role;

-- 7. Colonne updated_at pour tracker la fraîcheur des embeddings
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS embedding_updated_at timestamp with time zone;

COMMENT ON COLUMN public.products.embedding IS
  'Vecteur sémantique 3072 dims (gemini-embedding-2). Mis à jour via /api/products/vectorize.';
COMMENT ON COLUMN public.products.embedding_updated_at IS
  'Timestamp de la dernière vectorisation.';
