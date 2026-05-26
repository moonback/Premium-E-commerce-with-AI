-- Seed data for categories and products

-- Categories table (if not already defined)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- Sample categories
INSERT INTO categories (name) VALUES
    ('Flowers'),
    ('Edibles'),
    ('Concentrates'),
    ('Accessories')
    ON CONFLICT (name) DO NOTHING;

-- Sample products (adjust to match your product schema)
INSERT INTO products (id, name, description, price, image, category, effects, stock, created_at) VALUES
    ('prod-001', 'Blue Dream', 'Hybrid strain with balanced effects', 12.99, 'blue_dream.jpg', 'Flowers', ARRAY['relaxing','euphoric'], 100, now()),
    ('prod-002', 'Gummy Bears', 'Fruit flavored edibles', 9.50, 'gummy_bears.jpg', 'Edibles', ARRAY['sweet'], 200, now()),
    ('prod-003', 'Shatter', 'High potency concentrate', 35.00, 'shatter.jpg', 'Concentrates', ARRAY['intense'], 50, now()),
    ('prod-004', 'Grinder', 'Stainless steel grinder', 19.99, 'grinder.jpg', 'Accessories', ARRAY['durable'], 150, now())
    ON CONFLICT (id) DO NOTHING;
