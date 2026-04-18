create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  barbershop_id bigint not null,
  items jsonb not null,
  subtotal numeric not null default 0,
  shipping numeric not null default 0,
  total numeric not null,
  discount numeric default 0,
  coupon text,
  status text default 'aguardando_pagamento',
  payment_method text,
  customer_name text,
  customer_email text,
  customer_phone text,
  pickup_in_store boolean default true,
  address jsonb,
  created_at timestamptz default now()
);

alter table public.shop_orders enable row level security;

drop policy if exists "Users can view own shop orders" on public.shop_orders;
create policy "Users can view own shop orders"
  on public.shop_orders
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own shop orders" on public.shop_orders;
create policy "Users can create own shop orders"
  on public.shop_orders
  for insert
  with check (auth.uid() = user_id);
