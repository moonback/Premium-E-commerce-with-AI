-- Seed data for categories and products

-- Categories are now defined in supabase-schema.sql with id, name, parent_id, level

-- Sample categories (3 levels hierarchy)
INSERT INTO categories (id, name, parent_id, level) VALUES
    ('cat_1', 'Vêtements', NULL, 1),
    ('cat_1_1', 'Hauts', 'cat_1', 2),
    ('cat_1_1_1', 'T-Shirts', 'cat_1_1', 3),
    ('cat_1_1_2', 'Pulls', 'cat_1_1', 3),
    ('cat_1_2', 'Bas', 'cat_1', 2),
    ('cat_1_2_1', 'Pantalons', 'cat_1_2', 3),
    ('cat_2', 'Accessoires', NULL, 1),
    ('cat_2_1', 'Sacs', 'cat_2', 2),
    ('cat_3', 'Maison', NULL, 1)
    ON CONFLICT (id) DO NOTHING;

-- Sample products (adjust to match your product schema)
INSERT INTO products (id, name, description, price, image, category, effects, stock, created_at) VALUES
    ('prod-001', 'T-Shirt Basique', 'T-shirt 100% coton bio', 25.00, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab', 'T-Shirts', ARRAY['Confortable','Bio'], 100, now()),
    ('prod-002', 'Pantalon en Lin', 'Pantalon léger pour l''été', 45.00, 'https://images.unsplash.com/photo-1594938298596-eb5fd3f6b95c', 'Pantalons', ARRAY['Léger','Respirant'], 50, now()),
    ('prod-003', 'Sacoche en Cuir', 'Sacoche artisanale élégante', 110.00, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa', 'Sacs', ARRAY['Cuir véritable','Durable'], 30, now()),
    ('prod-004', 'Vase en Céramique', 'Vase fait main au design minimaliste', 35.00, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d', 'Maison', ARRAY['Fait main','Minimaliste'], 20, now())
    ON CONFLICT (id) DO NOTHING;
