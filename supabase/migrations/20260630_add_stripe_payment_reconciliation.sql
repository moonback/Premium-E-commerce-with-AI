-- Add Stripe PSP reconciliation to the transactional checkout without destroying data.
-- Strategy: additive/non-destructive. The checkout RPC keeps its existing order and
-- stock transaction, and records a payment row only when a verified PSP payment
-- reference is supplied by the application after Stripe confirmation.
-- Rollback plan: deploy a follow-up migration that recreates the previous RPC
-- signature/body and leaves the historical payments rows intact for accounting.

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS raw_provider_status text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS reconciled_at timestamp with time zone;
CREATE INDEX IF NOT EXISTS payments_provider_status_idx ON public.payments(provider, raw_provider_status);

DROP FUNCTION IF EXISTS public.create_order_with_items(jsonb, public.order_status, jsonb);

CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_items jsonb,
  p_status public.order_status DEFAULT 'Nouvelle'::public.order_status,
  p_checkout jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
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
  v_order_number text;
  v_payment_intent_id text;
  v_payment_provider text;
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
  v_payment_intent_id := NULLIF(p_checkout->>'payment_intent_id', '');
  v_payment_provider := COALESCE(NULLIF(p_checkout->>'payment_provider', ''), 'stripe');

  v_order_number := 'VER-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.orders (
    order_number,
    user_id,
    total,
    status,
    subtotal,
    discount_total,
    shipping_total,
    tax_total
  )
  VALUES (
    v_order_number,
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

  IF v_payment_intent_id IS NOT NULL THEN
    INSERT INTO public.payments (
      order_id,
      provider,
      provider_payment_id,
      status,
      raw_provider_status,
      amount,
      currency,
      metadata,
      reconciled_at
    )
    VALUES (
      v_order_id,
      v_payment_provider,
      v_payment_intent_id,
      'paid'::public.payment_status,
      COALESCE(NULLIF(p_checkout->>'payment_status', ''), 'succeeded'),
      v_total,
      upper(COALESCE(NULLIF(p_checkout->>'currency', ''), 'EUR')),
      jsonb_build_object('source', 'checkout_rpc', 'order_number', v_order_number),
      timezone('utc'::text, now())
    )
    ON CONFLICT (provider_payment_id) DO UPDATE
      SET order_id = EXCLUDED.order_id,
          status = EXCLUDED.status,
          raw_provider_status = EXCLUDED.raw_provider_status,
          amount = EXCLUDED.amount,
          currency = EXCLUDED.currency,
          metadata = public.payments.metadata || EXCLUDED.metadata,
          reconciled_at = EXCLUDED.reconciled_at,
          updated_at = timezone('utc'::text, now());
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number
  );
EXCEPTION
  WHEN others THEN
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, public.order_status, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, public.order_status, jsonb) TO authenticated;
