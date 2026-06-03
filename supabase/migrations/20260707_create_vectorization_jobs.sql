-- TASK-P1-007 : Transformer la vectorisation produits en jobs asynchrones

-- 1. Create vectorization_jobs table
CREATE TABLE IF NOT EXISTS public.vectorization_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    only_missing BOOLEAN NOT NULL DEFAULT true,
    total_items INTEGER NOT NULL DEFAULT 0,
    processed_items INTEGER NOT NULL DEFAULT 0,
    failed_items INTEGER NOT NULL DEFAULT 0,
    started_by UUID REFERENCES auth.users(id),
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.vectorization_jobs ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Seulement les admins et staff peuvent voir et gérer les jobs
CREATE POLICY "Vectorization jobs are viewable by admin and staff" 
ON public.vectorization_jobs
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Vectorization jobs can be inserted by admin and staff" 
ON public.vectorization_jobs
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Vectorization jobs can be updated by admin and staff" 
ON public.vectorization_jobs
FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Vectorization jobs can be deleted by admin and staff" 
ON public.vectorization_jobs
FOR DELETE
TO authenticated
USING (public.is_admin());
