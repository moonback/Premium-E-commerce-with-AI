-- Run this in the Supabase SQL Editor to create the addresses table.
-- The RLS policies ensure each user can only access their own addresses.

create table if not exists public.addresses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  label        text,
  address_line1 text not null,
  address_line2 text,
  city         text not null,
  postal_code  text not null,
  country      text not null,
  is_default   boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.addresses enable row level security;

-- Users can only see their own addresses
create policy "select own addresses"
  on public.addresses for select
  using (auth.uid() = user_id);

-- Users can insert their own addresses
create policy "insert own addresses"
  on public.addresses for insert
  with check (auth.uid() = user_id);

-- Users can update their own addresses
create policy "update own addresses"
  on public.addresses for update
  using (auth.uid() = user_id);

-- Users can delete their own addresses
create policy "delete own addresses"
  on public.addresses for delete
  using (auth.uid() = user_id);

-- Index for fast per-user lookups
create index if not exists addresses_user_id_idx on public.addresses(user_id);
