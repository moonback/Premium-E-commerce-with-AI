-- Rollback for 20260526_tenant_config_and_rls.sql

-- 1) Revert Orders tenancy hardening policies
DROP POLICY IF EXISTS "orders_update_tenant_isolation" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_tenant_isolation" ON public.orders;
DROP POLICY IF EXISTS "orders_select_tenant_isolation" ON public.orders;

-- 2) Recreate permissive policies for orders
CREATE POLICY "Enable read access for all users" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.orders FOR UPDATE USING (true);

-- 3) Drop index and column from orders
DROP INDEX IF EXISTS orders_tenant_id_idx;
ALTER TABLE public.orders DROP COLUMN IF EXISTS tenant_id;

-- 4) Revert Tenant config table and policies
DROP POLICY IF EXISTS "tenant_config_read_active" ON public.tenant_config;
ALTER TABLE public.tenant_config DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS tenant_config_host_idx;
DROP INDEX IF EXISTS tenant_config_tenant_id_idx;
DROP TABLE IF EXISTS public.tenant_config CASCADE;
