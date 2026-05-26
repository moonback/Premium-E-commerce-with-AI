-- --------------------------------------------------------------
-- Add the columns that exist in the TypeScript `Product` type
-- --------------------------------------------------------------

-- 1️⃣  Array of category strings (already referenced in the seed data)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS categories text[] DEFAULT ARRAY[]::text[];

-- 2️⃣  Free‑form list of effects (e.g., “Coton bio”, “Durable”)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS effects text[] DEFAULT ARRAY[]::text[];

-- 3️⃣  Specs – a JSONB column that can store an array of
--      { title: string, content: string } objects
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS specs jsonb DEFAULT '[]'::jsonb;

-- --------------------------------------------------------------
-- Optional: useful indexes for the new columns
-- --------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_categories ON public.products USING gin (categories);
CREATE INDEX IF NOT EXISTS idx_products_effects   ON public.products USING gin (effects);
-- For JSONB you can add a GIN index if you plan to query inside specs
CREATE INDEX IF NOT EXISTS idx_products_specs ON public.products USING gin (specs);
