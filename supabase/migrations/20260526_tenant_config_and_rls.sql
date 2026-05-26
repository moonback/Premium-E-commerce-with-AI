-- Multi-tenant foundation: tenant configuration + tenant-aware orders security

-- 1) Tenant configuration table (dynamic white-label source)
CREATE TABLE IF NOT EXISTS public.tenant_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL UNIQUE,
  host text NOT NULL UNIQUE,
  config jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS tenant_config_tenant_id_idx ON public.tenant_config (tenant_id);
CREATE INDEX IF NOT EXISTS tenant_config_host_idx ON public.tenant_config (host);

ALTER TABLE public.tenant_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_config_read_active" ON public.tenant_config;
CREATE POLICY "tenant_config_read_active"
ON public.tenant_config
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- 2) Orders tenancy hardening
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'default';

CREATE INDEX IF NOT EXISTS orders_tenant_id_idx ON public.orders (tenant_id);

-- Restrictive RLS policy model based on tenant_id claim.
-- Requires JWT claim `tenant_id` in auth token for strict isolation.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.orders;

DROP POLICY IF EXISTS "orders_select_tenant_isolation" ON public.orders;
CREATE POLICY "orders_select_tenant_isolation"
ON public.orders
FOR SELECT
TO authenticated
USING (tenant_id = coalesce((auth.jwt() ->> 'tenant_id'), 'default'));

DROP POLICY IF EXISTS "orders_insert_tenant_isolation" ON public.orders;
CREATE POLICY "orders_insert_tenant_isolation"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = coalesce((auth.jwt() ->> 'tenant_id'), 'default'));

DROP POLICY IF EXISTS "orders_update_tenant_isolation" ON public.orders;
CREATE POLICY "orders_update_tenant_isolation"
ON public.orders
FOR UPDATE
TO authenticated
USING (tenant_id = coalesce((auth.jwt() ->> 'tenant_id'), 'default'))
WITH CHECK (tenant_id = coalesce((auth.jwt() ->> 'tenant_id'), 'default'));
