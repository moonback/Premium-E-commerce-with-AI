-- Secure sensitive commerce, analytics and AI tables referenced by the audit.
-- Non-destructive: creates missing tables, adds missing columns and replaces only
-- policies/grants for these tables. Existing rows are preserved.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'payment_status'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.payment_status AS ENUM (
      'requires_payment',
      'processing',
      'succeeded',
      'failed',
      'refunded',
      'cancelled'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_payment_id text UNIQUE,
  status public.payment_status NOT NULL DEFAULT 'requires_payment'::public.payment_status,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  carrier text,
  tracking_number text,
  tracking_url text,
  status text NOT NULL DEFAULT 'pending',
  estimated_delivery_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  anonymous_id text,
  event_name text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'voice',
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Existing deployments may already have partial versions of these tables.
-- Add all policy/index dependencies idempotently before applying RLS.
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS order_id uuid;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider_payment_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS status public.payment_status NOT NULL DEFAULT 'requires_payment'::public.payment_status;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS order_id uuid;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS carrier text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS tracking_url text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS estimated_delivery_at timestamptz;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS anonymous_id text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_name text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS properties jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'voice';
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.audit_events ADD COLUMN IF NOT EXISTS actor_id uuid;
ALTER TABLE public.audit_events ADD COLUMN IF NOT EXISTS action text;
ALTER TABLE public.audit_events ADD COLUMN IF NOT EXISTS entity_type text;
ALTER TABLE public.audit_events ADD COLUMN IF NOT EXISTS entity_id text;
ALTER TABLE public.audit_events ADD COLUMN IF NOT EXISTS before jsonb;
ALTER TABLE public.audit_events ADD COLUMN IF NOT EXISTS after jsonb;
ALTER TABLE public.audit_events ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS payments_order_idx ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS payments_status_created_at_idx ON public.payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS shipments_order_idx ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS shipments_status_created_at_idx ON public.shipments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS events_name_time_idx ON public.events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS events_user_time_idx ON public.events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_conversations_user_time_idx ON public.ai_conversations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_entity_time_idx ON public.audit_events(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_actor_time_idx ON public.audit_events(actor_id, created_at DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.payments FROM anon;
REVOKE ALL ON TABLE public.shipments FROM anon;
REVOKE ALL ON TABLE public.events FROM anon;
REVOKE ALL ON TABLE public.ai_conversations FROM anon;
REVOKE ALL ON TABLE public.audit_events FROM anon;

REVOKE ALL ON TABLE public.payments FROM authenticated;
REVOKE ALL ON TABLE public.shipments FROM authenticated;
REVOKE ALL ON TABLE public.events FROM authenticated;
REVOKE ALL ON TABLE public.ai_conversations FROM authenticated;
REVOKE ALL ON TABLE public.audit_events FROM authenticated;

-- Grant authenticated users the SQL verbs needed by owner/admin policies;
-- RLS below remains the source of truth for row-level authorization.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shipments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_events TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shipments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_conversations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_events TO service_role;

DROP POLICY IF EXISTS "payments_select_own_or_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
DROP POLICY IF EXISTS "shipments_select_own_or_admin" ON public.shipments;
DROP POLICY IF EXISTS "shipments_admin_all" ON public.shipments;
DROP POLICY IF EXISTS "events_insert_own" ON public.events;
DROP POLICY IF EXISTS "events_select_own_or_admin" ON public.events;
DROP POLICY IF EXISTS "events_admin_all" ON public.events;
DROP POLICY IF EXISTS "ai_conversations_insert_own" ON public.ai_conversations;
DROP POLICY IF EXISTS "ai_conversations_select_own_or_admin" ON public.ai_conversations;
DROP POLICY IF EXISTS "ai_conversations_admin_all" ON public.ai_conversations;
DROP POLICY IF EXISTS "audit_events_admin_read" ON public.audit_events;
DROP POLICY IF EXISTS "audit_events_admin_all" ON public.audit_events;

CREATE POLICY "payments_select_own_or_admin"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.orders
      WHERE orders.id = payments.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "payments_admin_all"
  ON public.payments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "shipments_select_own_or_admin"
  ON public.shipments
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.orders
      WHERE orders.id = shipments.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "shipments_admin_all"
  ON public.shipments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "events_insert_own"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "events_select_own_or_admin"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "events_admin_all"
  ON public.events
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "ai_conversations_insert_own"
  ON public.ai_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_conversations_select_own_or_admin"
  ON public.ai_conversations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "ai_conversations_admin_all"
  ON public.ai_conversations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "audit_events_admin_read"
  ON public.audit_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "audit_events_admin_all"
  ON public.audit_events
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
