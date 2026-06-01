-- Migration: 20260701_add_wishlist_and_reviews.sql
-- Strategy: additive only — no DROP TABLE, no destructive changes
-- Adds: wishlist_items, product_reviews tables with RLS
-- Rollback: DROP TABLE wishlist_items; DROP TABLE product_reviews; (safe, new tables only)

-- ─── wishlist_items ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Owner can read their own wishlist
DROP POLICY IF EXISTS "wishlist_self_select" ON wishlist_items;
CREATE POLICY "wishlist_self_select"
  ON wishlist_items FOR SELECT
  USING (auth.uid() = user_id);

-- Owner can insert into their own wishlist
DROP POLICY IF EXISTS "wishlist_self_insert" ON wishlist_items;
CREATE POLICY "wishlist_self_insert"
  ON wishlist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete from their own wishlist
DROP POLICY IF EXISTS "wishlist_self_delete" ON wishlist_items;
CREATE POLICY "wishlist_self_delete"
  ON wishlist_items FOR DELETE
  USING (auth.uid() = user_id);

-- ─── product_reviews ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  text NOT NULL,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body        text,
  is_published boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read published reviews
DROP POLICY IF EXISTS "reviews_public_select" ON product_reviews;
CREATE POLICY "reviews_public_select"
  ON product_reviews FOR SELECT
  USING (is_published = true);

-- Owner can read their own review (even unpublished)
DROP POLICY IF EXISTS "reviews_self_select" ON product_reviews;
CREATE POLICY "reviews_self_select"
  ON product_reviews FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own review
DROP POLICY IF EXISTS "reviews_self_insert" ON product_reviews;
CREATE POLICY "reviews_self_insert"
  ON product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owner can update their own review (re-submit)
DROP POLICY IF EXISTS "reviews_self_update" ON product_reviews;
CREATE POLICY "reviews_self_update"
  ON product_reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND is_published = false);

-- Admin can publish/unpublish reviews
DROP POLICY IF EXISTS "reviews_admin_update" ON product_reviews;
CREATE POLICY "reviews_admin_update"
  ON product_reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_published ON product_reviews(product_id) WHERE is_published = true;

COMMENT ON TABLE wishlist_items IS 'Server-side wishlist — one row per user/product pair. RLS: owner only.';
COMMENT ON TABLE product_reviews IS 'Product reviews with moderation. is_published controlled by admin. RLS: public reads published, owner reads own.';
