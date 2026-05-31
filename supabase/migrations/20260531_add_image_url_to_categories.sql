-- Migration: add image_url column to categories
-- Safe: uses IF NOT EXISTS pattern via DO block

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE categories ADD COLUMN image_url TEXT DEFAULT NULL;
  END IF;
END;
$$;

COMMENT ON COLUMN categories.image_url IS 'Optional image URL for visual category pills in the storefront';
