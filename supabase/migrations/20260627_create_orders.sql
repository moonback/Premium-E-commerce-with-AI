-- Migration: create order_status enum and orders table
-- Generated on 2026-06-27

-- Ensure enum type does not already exist
DROP TYPE IF EXISTS public.order_status CASCADE;

-- Create enum type for order status
CREATE TYPE public.order_status AS ENUM (
  'pending',
  'Nouvelle',
  'En préparation',
  'Prête',
  'Livrée',
  'Terminée'
);

-- Drop orders table if it already exists
DROP TABLE IF EXISTS public.orders CASCADE;

-- Create orders table
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  total numeric(10,2) NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending'::order_status,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE SET NULL
);

-- Optional: grant privileges (adjust as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO anon, authenticated;

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now to allow checkout and admin operations
CREATE POLICY "Enable read access for all users" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.orders FOR UPDATE USING (true);

-- End of migration
