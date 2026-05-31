-- Harden profile roles and profile/order RLS after the complete audit.
-- This migration is intentionally non-destructive: it only adds enum values,
-- replaces unsafe policies, and removes client/email-derived admin assignment.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'user_role'
      AND n.nspname = 'public'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'staff';
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'kiosk';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    role,
    address,
    phone,
    address_line1,
    address_line2,
    city,
    postal_code,
    country
  )
  VALUES (
    new.id,
    new.email,
    'customer'::public.user_role,
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Do not block signup if profile creation fails; operations remain locked by RLS.
    RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.profiles FROM authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT INSERT (id, email, role, address, phone, address_line1, address_line2, city, postal_code, country)
  ON TABLE public.profiles TO authenticated;
GRANT UPDATE (address, phone, address_line1, address_line2, city, postal_code, country)
  ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self_customer" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;

CREATE POLICY "profiles_select_self_or_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_self_customer"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'customer');

CREATE POLICY "profiles_update_self"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.orders;
DROP POLICY IF EXISTS "Users can read their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;

CREATE POLICY "orders_select_own_or_admin"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "orders_insert_own"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_admin"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "order_items_select_own_or_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_own_order" ON public.order_items;
DROP POLICY IF EXISTS "order_items_admin_all" ON public.order_items;

CREATE POLICY "order_items_select_own_or_admin"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "order_items_insert_own_order"
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_admin_all"
  ON public.order_items
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Add non-destructive commerce totals needed by the hardened checkout RPC.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_total numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_total numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_total numeric(10,2) NOT NULL DEFAULT 0;

-- Replace the checkout RPC with server-side product validation, stock reservation and totals.
DROP FUNCTION IF EXISTS public.create_order_with_items(jsonb, public.order_status);

CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_items jsonb,
  p_status public.order_status DEFAULT 'Nouvelle'::public.order_status,
  p_checkout jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_product_id text;
  v_quantity integer;
  v_unit_price numeric(10,2);
  v_stock integer;
  v_line_total numeric(10,2);
  v_subtotal numeric(10,2) := 0;
  v_discount_total numeric(10,2) := 0;
  v_shipping_total numeric(10,2) := 0;
  v_tax_total numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order items are required';
  END IF;

  v_discount_total := GREATEST(COALESCE((p_checkout->>'discount_total')::numeric, 0), 0);
  v_shipping_total := GREATEST(COALESCE((p_checkout->>'shipping_total')::numeric, 0), 0);
  v_tax_total := GREATEST(COALESCE((p_checkout->>'tax_total')::numeric, 0), 0);

  INSERT INTO public.orders (
    user_id,
    total,
    status,
    subtotal,
    discount_total,
    shipping_total,
    tax_total
  )
  VALUES (
    auth.uid(),
    0,
    p_status,
    0,
    v_discount_total,
    v_shipping_total,
    v_tax_total
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := v_item->>'product_id';
    v_quantity := COALESCE((v_item->>'quantity')::integer, 0);

    IF v_product_id IS NULL OR v_product_id = '' THEN
      RAISE EXCEPTION 'Product id is required';
    END IF;

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than zero';
    END IF;

    SELECT price, stock
      INTO v_unit_price, v_stock
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'Product % not found', v_product_id;
    END IF;

    IF v_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
    END IF;

    UPDATE public.products
    SET stock = stock - v_quantity
    WHERE id = v_product_id;

    v_line_total := v_unit_price * v_quantity;

    INSERT INTO public.order_items (order_id, product_id, quantity, price_at_time)
    VALUES (v_order_id, v_product_id, v_quantity, v_unit_price);

    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  v_total := GREATEST(v_subtotal - v_discount_total + v_shipping_total + v_tax_total, 0);

  UPDATE public.orders
  SET
    subtotal = v_subtotal,
    discount_total = v_discount_total,
    shipping_total = v_shipping_total,
    tax_total = v_tax_total,
    total = v_total
  WHERE id = v_order_id;

  RETURN v_order_id;
EXCEPTION
  WHEN others THEN
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, public.order_status, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, public.order_status, jsonb) TO authenticated;
