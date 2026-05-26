-- 8️⃣  RLS pour la table orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent créer une commande pour eux‑mêmes
CREATE POLICY "Users can insert their own orders"
  ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Lecture publique (ou vous pouvez restreindre à l’auteur)
CREATE POLICY "Anyone can read orders"
  ON orders
  FOR SELECT
  USING (true);
