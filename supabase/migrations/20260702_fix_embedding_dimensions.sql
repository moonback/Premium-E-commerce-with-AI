-- ─────────────────────────────────────────────────────────────────────────────
-- Migration corrective : passer embedding à vector(1536)
-- Modèle : gemini-embedding-2 avec outputDimensionality=1536
-- Raison : pgvector limite l'index HNSW à 2000 dimensions max
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Supprimer les index existants
DROP INDEX IF EXISTS products_embedding_hnsw_idx;
DROP INDEX IF EXISTS products_embedding_not_null_idx;

-- 2. Supprimer l'ancienne fonction (signature incompatible)
DROP FUNCTION IF EXISTS public.match_products(vector, float, int, boolean);

-- 3. Vider les embeddings existants (dimensions incompatibles)
UPDATE public.products SET embedding = NULL, embedding_updated_at = NULL;

-- 4. Modifier la colonne en vector(1536)
ALTER TABLE public.products
  ALTER COLUMN embedding TYPE vector(1536)
  USING NULL;

-- 5. Recréer l'index HNSW (1536 < 2000 : OK)
CREATE INDEX products_embedding_hnsw_idx
  ON public.products
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX products_embedding_not_null_idx
  ON public.products (id)
  WHERE embedding IS NOT NULL;

-- 6. Recréer match_products avec vector(1536)
CREATE OR REPLACE FUNCTION public.match_products(
  query_embedding  vector(1536),
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

GRANT EXECUTE ON FUNCTION public.match_products TO authenticated, service_role;

-- Vérification finale
SELECT
  column_name,
  udt_name
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'embedding';
