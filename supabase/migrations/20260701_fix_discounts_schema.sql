-- Fix discounts table schema
-- This migration ensures the discounts table has the correct structure

-- Drop the table if it exists with wrong structure and recreate
DROP TABLE IF EXISTS public.discounts CASCADE;

CREATE TABLE public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value numeric(10,2) NOT NULL CHECK (value > 0),
  min_order_amount numeric(10,2),
  max_uses integer,
  current_uses integer NOT NULL DEFAULT 0,
  valid_from timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  valid_until timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create indexes
CREATE INDEX discounts_code_idx ON public.discounts(code);
CREATE INDEX discounts_active_idx ON public.discounts(is_active);
CREATE INDEX discounts_valid_idx ON public.discounts(valid_from, valid_until);

-- Enable RLS
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "discounts_admin_all"
  ON public.discounts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Authenticated users can read active discounts (for validation)
CREATE POLICY "discounts_read_active"
  ON public.discounts
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND valid_from <= timezone('utc'::text, now())
    AND (valid_until IS NULL OR valid_until >= timezone('utc'::text, now()))
  );

-- Function to validate and apply discount
DROP FUNCTION IF EXISTS public.validate_discount_code(text, numeric);
CREATE FUNCTION public.validate_discount_code(
  p_code text,
  p_order_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_discount public.discounts;
  v_discount_amount numeric;
BEGIN
  -- Find active discount
  SELECT * INTO v_discount
  FROM public.discounts
  WHERE code = UPPER(p_code)
    AND is_active = true
    AND valid_from <= timezone('utc'::text, now())
    AND (valid_until IS NULL OR valid_until >= timezone('utc'::text, now()))
    AND (max_uses IS NULL OR current_uses < max_uses)
    AND (min_order_amount IS NULL OR p_order_amount >= min_order_amount);

  -- If not found, return error
  IF v_discount IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Code promo invalide ou expiré'
    );
  END IF;

  -- Calculate discount amount
  IF v_discount.type = 'percentage' THEN
    v_discount_amount := p_order_amount * (v_discount.value / 100);
  ELSE
    v_discount_amount := v_discount.value;
  END IF;

  -- Ensure discount doesn't exceed order amount
  v_discount_amount := LEAST(v_discount_amount, p_order_amount);

  -- Return discount info
  RETURN jsonb_build_object(
    'valid', true,
    'discount_id', v_discount.id,
    'code', v_discount.code,
    'type', v_discount.type,
    'value', v_discount.value,
    'discount_amount', v_discount_amount
  );
END;
$$;

-- Function to increment discount usage
DROP FUNCTION IF EXISTS public.increment_discount_usage(uuid);
CREATE FUNCTION public.increment_discount_usage(p_discount_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discounts
  SET current_uses = current_uses + 1,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_discount_id;
END;
$$;

-- Grant execute permissions
REVOKE ALL ON FUNCTION public.validate_discount_code(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_discount_code(text, numeric) TO authenticated;

REVOKE ALL ON FUNCTION public.increment_discount_usage(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_discount_usage(uuid) TO authenticated;

-- Add discount tracking to orders table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'discount_code'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN discount_code text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN discount_amount numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_discounts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_discounts_updated_at ON public.discounts;
CREATE TRIGGER update_discounts_updated_at
  BEFORE UPDATE ON public.discounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_discounts_updated_at();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
