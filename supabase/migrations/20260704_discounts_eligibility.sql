-- Migration: Add product/category eligibility to discounts and update order creation.
-- Date: 2026-07-04

-- ── 1. Add eligibility columns to discounts table ────────────────────────────
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS eligible_products text[];
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS eligible_categories text[];

-- ── 2. Standardize increment_discount_usage function ─────────────────────────
CREATE OR REPLACE FUNCTION public.increment_discount_usage(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discounts
  SET current_uses = current_uses + 1,
      updated_at = timezone('utc'::text, now())
  WHERE code = UPPER(p_code);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_discount_usage(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_discount_usage(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_discount_usage(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_discount_usage(text) TO service_role;

-- ── 3. Update create_pending_order_with_items RPC ────────────────────────────
-- Idempotent order creation that now stores discount_code
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
  v_discount_code text;
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
  v_discount_code := NULLIF(p_checkout->>'discount_code', '');
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
    payment_status,
    discount_code
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
    'requires_payment'::public.payment_status,
    v_discount_code
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

REVOKE ALL ON FUNCTION public.create_pending_order_with_items(text, uuid, jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_pending_order_with_items(text, uuid, jsonb, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_pending_order_with_items(text, uuid, jsonb, jsonb) TO service_role;

NOTIFY pgrst, 'reload schema';
