-- Migration: Atomic checkout — create pending order BEFORE Stripe charges the card.
--
-- New tables:
--   checkout_attempts — links checkoutAttemptId → order_id → payment_intent_id
--   stock_reservations — soft hold on stock during payment window
--
-- New functions:
--   create_pending_order_with_items — idempotent order creation with stock reservation
--   consume_stock_reservations — called by webhook on payment_intent.succeeded
--   release_stock_reservations — called by webhook on payment_intent.failed/canceled
--   cleanup_expired_checkout_attempts — cron job to release expired holds
--
-- Non-destructive: all operations are additive. Existing tables are not altered destructively.

-- ── checkout_attempts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.checkout_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  checkout_attempt_id text NOT NULL,
  user_id uuid NOT NULL,
  order_id uuid NULL,
  payment_intent_id text NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'expired')),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at timestamp with time zone NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '30 minutes'),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT checkout_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT checkout_attempts_checkout_attempt_id_key UNIQUE (checkout_attempt_id),
  CONSTRAINT checkout_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS checkout_attempts_user_id_idx ON public.checkout_attempts (user_id);
CREATE INDEX IF NOT EXISTS checkout_attempts_status_expires_idx ON public.checkout_attempts (status, expires_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS checkout_attempts_payment_intent_idx ON public.checkout_attempts (payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;

-- RLS: users see their own attempts; service_role has full access.
ALTER TABLE public.checkout_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.checkout_attempts FROM anon;
REVOKE ALL ON TABLE public.checkout_attempts FROM authenticated;
GRANT SELECT ON TABLE public.checkout_attempts TO authenticated;
GRANT ALL ON TABLE public.checkout_attempts TO service_role;

DROP POLICY IF EXISTS "checkout_attempts_select_own" ON public.checkout_attempts;
CREATE POLICY "checkout_attempts_select_own"
  ON public.checkout_attempts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ── stock_reservations ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  checkout_attempt_id text NOT NULL,
  product_id text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'held'
    CHECK (status IN ('held', 'consumed', 'released')),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at timestamp with time zone NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '30 minutes'),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT stock_reservations_pkey PRIMARY KEY (id),
  CONSTRAINT stock_reservations_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS stock_reservations_checkout_attempt_idx ON public.stock_reservations (checkout_attempt_id);
CREATE INDEX IF NOT EXISTS stock_reservations_product_held_idx ON public.stock_reservations (product_id, status)
  WHERE status = 'held';

ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.stock_reservations FROM anon;
REVOKE ALL ON TABLE public.stock_reservations FROM authenticated;
GRANT SELECT ON TABLE public.stock_reservations TO authenticated;
GRANT ALL ON TABLE public.stock_reservations TO service_role;

DROP POLICY IF EXISTS "stock_reservations_select_own" ON public.stock_reservations;
CREATE POLICY "stock_reservations_select_own"
  ON public.stock_reservations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.checkout_attempts ca
      WHERE ca.checkout_attempt_id = stock_reservations.checkout_attempt_id
        AND ca.user_id = auth.uid()
    )
  );

-- ── create_pending_order_with_items ───────────────────────────────────────────
-- Called by the server BEFORE creating the Stripe PaymentIntent.
-- IDEMPOTENT: if a checkout_attempt already has an order, returns the existing one.
-- Uses service_role — the server passes p_user_id explicitly.
CREATE OR REPLACE FUNCTION public.create_pending_order_with_items(
  p_checkout_attempt_id text,
  p_user_id uuid,
  p_items jsonb,
  p_checkout jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_attempt record;
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product_id text;
  v_quantity integer;
  v_unit_price numeric(10,2);
  v_current_stock integer;
  v_reserved_stock integer;
  v_available_stock integer;
  v_line_total numeric(10,2);
  v_subtotal numeric(10,2) := 0;
  v_discount_total numeric(10,2) := 0;
  v_shipping_total numeric(10,2) := 0;
  v_tax_total numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
  v_expires_at timestamp with time zone;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  IF p_checkout_attempt_id IS NULL OR p_checkout_attempt_id = '' THEN
    RAISE EXCEPTION 'Checkout attempt ID is required';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order items are required';
  END IF;

  -- ── Idempotency check ──────────────────────────────────────────────────────
  SELECT ca.order_id, o.order_number
    INTO v_existing_attempt
  FROM public.checkout_attempts ca
  LEFT JOIN public.orders o ON o.id = ca.order_id
  WHERE ca.checkout_attempt_id = p_checkout_attempt_id
    AND ca.user_id = p_user_id
    AND ca.status = 'pending'
    AND ca.expires_at > now();

  IF FOUND AND v_existing_attempt.order_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'order_id', v_existing_attempt.order_id,
      'order_number', v_existing_attempt.order_number,
      'idempotent', true
    );
  END IF;

  -- ── Expiration window ──────────────────────────────────────────────────────
  v_expires_at := timezone('utc'::text, now()) + interval '30 minutes';

  -- ── Parse checkout totals ──────────────────────────────────────────────────
  v_discount_total := GREATEST(COALESCE((p_checkout->>'discount_total')::numeric, 0), 0);
  v_shipping_total := GREATEST(COALESCE((p_checkout->>'shipping_total')::numeric, 0), 0);
  v_tax_total := GREATEST(COALESCE((p_checkout->>'tax_total')::numeric, 0), 0);

  -- ── Generate order number ──────────────────────────────────────────────────
  v_order_number := 'VER-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  -- ── Create pending order ───────────────────────────────────────────────────
  INSERT INTO public.orders (
    order_number,
    user_id,
    total,
    status,
    subtotal,
    discount_total,
    shipping_total,
    tax_total,
    payment_status
  )
  VALUES (
    v_order_number,
    p_user_id,
    0,
    'pending'::public.order_status,
    0,
    v_discount_total,
    v_shipping_total,
    v_tax_total,
    'requires_payment'::public.payment_status
  )
  RETURNING id INTO v_order_id;

  -- ── Process items: validate stock, create order_items, reserve stock ────────
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

    -- Lock the product row for the duration of the transaction
    SELECT price, stock
      INTO v_unit_price, v_current_stock
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'Product % not found', v_product_id;
    END IF;

    -- Calculate available stock = current stock - active reservations
    SELECT COALESCE(SUM(sr.quantity), 0)
      INTO v_reserved_stock
    FROM public.stock_reservations sr
    WHERE sr.product_id = v_product_id
      AND sr.status = 'held'
      AND sr.expires_at > now();

    v_available_stock := v_current_stock - v_reserved_stock;

    IF v_available_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product % (available: %, requested: %)',
        v_product_id, v_available_stock, v_quantity;
    END IF;

    v_line_total := v_unit_price * v_quantity;

    -- Insert order item (price locked at time of order creation)
    INSERT INTO public.order_items (order_id, product_id, quantity, price_at_time)
    VALUES (v_order_id, v_product_id, v_quantity, v_unit_price);

    -- Reserve stock (soft hold — real decrement happens on payment success)
    INSERT INTO public.stock_reservations (checkout_attempt_id, product_id, quantity, expires_at)
    VALUES (p_checkout_attempt_id, v_product_id, v_quantity, v_expires_at);

    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  -- ── Finalize order totals ──────────────────────────────────────────────────
  v_total := GREATEST(v_subtotal - v_discount_total + v_shipping_total + v_tax_total, 0);

  UPDATE public.orders
  SET
    subtotal = v_subtotal,
    total = v_total
  WHERE id = v_order_id;

  -- ── Record checkout attempt ────────────────────────────────────────────────
  INSERT INTO public.checkout_attempts (checkout_attempt_id, user_id, order_id, status, expires_at)
  VALUES (p_checkout_attempt_id, p_user_id, v_order_id, 'pending', v_expires_at)
  ON CONFLICT (checkout_attempt_id) DO UPDATE
    SET order_id = EXCLUDED.order_id,
        status = EXCLUDED.status,
        expires_at = EXCLUDED.expires_at,
        updated_at = timezone('utc'::text, now());

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'idempotent', false
  );

EXCEPTION
  WHEN others THEN
    RAISE;
END;
$$;

-- Only service_role can call this (server-side only)
REVOKE ALL ON FUNCTION public.create_pending_order_with_items(text, uuid, jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_pending_order_with_items(text, uuid, jsonb, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_pending_order_with_items(text, uuid, jsonb, jsonb) TO service_role;

-- ── consume_stock_reservations ────────────────────────────────────────────────
-- Called by webhook handler when payment_intent.succeeded.
-- Decrements real stock and marks reservations as consumed.
CREATE OR REPLACE FUNCTION public.consume_stock_reservations(
  p_checkout_attempt_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation record;
  v_consumed_count integer := 0;
BEGIN
  IF p_checkout_attempt_id IS NULL OR p_checkout_attempt_id = '' THEN
    RAISE EXCEPTION 'Checkout attempt ID is required';
  END IF;

  FOR v_reservation IN
    SELECT sr.id, sr.product_id, sr.quantity
    FROM public.stock_reservations sr
    WHERE sr.checkout_attempt_id = p_checkout_attempt_id
      AND sr.status = 'held'
    FOR UPDATE
  LOOP
    -- Decrement actual stock
    UPDATE public.products
    SET stock = stock - v_reservation.quantity
    WHERE id = v_reservation.product_id;

    -- Mark reservation as consumed
    UPDATE public.stock_reservations
    SET status = 'consumed', updated_at = timezone('utc'::text, now())
    WHERE id = v_reservation.id;

    v_consumed_count := v_consumed_count + 1;
  END LOOP;

  -- Update checkout attempt status
  UPDATE public.checkout_attempts
  SET status = 'paid', updated_at = timezone('utc'::text, now())
  WHERE checkout_attempt_id = p_checkout_attempt_id
    AND status = 'pending';

  RETURN jsonb_build_object('consumed', v_consumed_count);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_stock_reservations(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_stock_reservations(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consume_stock_reservations(text) TO service_role;

-- ── release_stock_reservations ────────────────────────────────────────────────
-- Called by webhook handler when payment_intent.payment_failed or canceled.
-- Releases held stock without decrementing.
CREATE OR REPLACE FUNCTION public.release_stock_reservations(
  p_checkout_attempt_id text,
  p_new_status text DEFAULT 'failed'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_released_count integer := 0;
BEGIN
  IF p_checkout_attempt_id IS NULL OR p_checkout_attempt_id = '' THEN
    RAISE EXCEPTION 'Checkout attempt ID is required';
  END IF;

  UPDATE public.stock_reservations
  SET status = 'released', updated_at = timezone('utc'::text, now())
  WHERE checkout_attempt_id = p_checkout_attempt_id
    AND status = 'held';

  GET DIAGNOSTICS v_released_count = ROW_COUNT;

  -- Update checkout attempt status
  UPDATE public.checkout_attempts
  SET status = p_new_status, updated_at = timezone('utc'::text, now())
  WHERE checkout_attempt_id = p_checkout_attempt_id
    AND status = 'pending';

  RETURN jsonb_build_object('released', v_released_count);
END;
$$;

REVOKE ALL ON FUNCTION public.release_stock_reservations(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_stock_reservations(text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.release_stock_reservations(text, text) TO service_role;

-- ── cleanup_expired_checkout_attempts ─────────────────────────────────────────
-- Should be called periodically (e.g. pg_cron every 5 minutes).
-- Releases expired stock reservations and marks expired checkout attempts.
CREATE OR REPLACE FUNCTION public.cleanup_expired_checkout_attempts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_attempts integer := 0;
  v_released_reservations integer := 0;
  v_attempt record;
BEGIN
  -- Find all expired pending checkout attempts
  FOR v_attempt IN
    SELECT ca.checkout_attempt_id, ca.order_id
    FROM public.checkout_attempts ca
    WHERE ca.status = 'pending'
      AND ca.expires_at <= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Release held stock reservations for this attempt
    UPDATE public.stock_reservations
    SET status = 'released', updated_at = timezone('utc'::text, now())
    WHERE checkout_attempt_id = v_attempt.checkout_attempt_id
      AND status = 'held';

    v_released_reservations := v_released_reservations + FOUND::integer;

    -- Mark the checkout attempt as expired
    UPDATE public.checkout_attempts
    SET status = 'expired', updated_at = timezone('utc'::text, now())
    WHERE checkout_attempt_id = v_attempt.checkout_attempt_id;

    -- Mark the order payment_status as expired
    IF v_attempt.order_id IS NOT NULL THEN
      UPDATE public.orders
      SET payment_status = 'failed'::public.payment_status
      WHERE id = v_attempt.order_id
        AND payment_status = 'requires_payment'::public.payment_status;
    END IF;

    v_expired_attempts := v_expired_attempts + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'expired_attempts', v_expired_attempts,
    'released_reservations', v_released_reservations
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_checkout_attempts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_expired_checkout_attempts() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_checkout_attempts() TO service_role;
