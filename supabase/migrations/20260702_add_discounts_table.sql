-- Migration: Add discounts table for promo codes
-- Date: 2026-07-02
-- Description: Create discounts table with RLS policies for admin management

-- Create discounts table
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on code for fast lookup
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(is_active, valid_from, valid_until);

-- Enable RLS
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active discounts (for validation)
CREATE POLICY discounts_read_active ON discounts
  FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- Policy: Only admins can insert/update/delete discounts
CREATE POLICY discounts_admin_all ON discounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add discount_code and discount_amount to orders table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_code') THEN
    ALTER TABLE orders ADD COLUMN discount_code TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
    ALTER TABLE orders ADD COLUMN discount_amount NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Create function to validate and apply discount
CREATE OR REPLACE FUNCTION validate_discount_code(
  p_code TEXT,
  p_order_total NUMERIC
)
RETURNS TABLE (
  valid BOOLEAN,
  discount_amount NUMERIC,
  message TEXT
) AS $$
DECLARE
  v_discount discounts%ROWTYPE;
  v_calculated_discount NUMERIC;
BEGIN
  -- Find the discount
  SELECT * INTO v_discount
  FROM discounts
  WHERE code = p_code
  AND is_active = true
  AND (valid_from IS NULL OR valid_from <= NOW())
  AND (valid_until IS NULL OR valid_until > NOW());

  -- Check if discount exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 'Code promo invalide ou expiré'::TEXT;
    RETURN;
  END IF;

  -- Check minimum order amount
  IF p_order_total < v_discount.min_order_amount THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 
      format('Montant minimum de commande: %s€', v_discount.min_order_amount)::TEXT;
    RETURN;
  END IF;

  -- Check max uses
  IF v_discount.max_uses IS NOT NULL AND v_discount.current_uses >= v_discount.max_uses THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 'Ce code promo a atteint sa limite d''utilisation'::TEXT;
    RETURN;
  END IF;

  -- Calculate discount
  IF v_discount.discount_type = 'percentage' THEN
    v_calculated_discount := ROUND((p_order_total * v_discount.discount_value / 100)::NUMERIC, 2);
  ELSE
    v_calculated_discount := v_discount.discount_value;
  END IF;

  -- Ensure discount doesn't exceed order total
  v_calculated_discount := LEAST(v_calculated_discount, p_order_total);

  RETURN QUERY SELECT true, v_calculated_discount, 'Code promo appliqué avec succès'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment discount usage
CREATE OR REPLACE FUNCTION increment_discount_usage(p_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE discounts
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample discount codes for testing
INSERT INTO discounts (code, description, discount_type, discount_value, min_order_amount, max_uses, is_active)
VALUES 
  ('WELCOME10', 'Réduction de bienvenue 10%', 'percentage', 10, 0, NULL, true),
  ('PREMIUM20', 'Réduction premium 20%', 'percentage', 20, 100, 100, true),
  ('SAVE5', 'Économisez 5€', 'fixed', 5, 30, NULL, true)
ON CONFLICT (code) DO NOTHING;

-- Add comment
COMMENT ON TABLE discounts IS 'Discount codes and promotions for orders';
COMMENT ON FUNCTION validate_discount_code IS 'Validates a discount code and calculates the discount amount';
COMMENT ON FUNCTION increment_discount_usage IS 'Increments the usage counter for a discount code';
