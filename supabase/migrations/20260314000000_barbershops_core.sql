-- Core barbershops table used across the app.
-- Needed by products, consultation_requests, loyalty policies, etc.

create extension if not exists pgcrypto;

create table if not exists public.barbershops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists barbershops_owner_id_idx on public.barbershops (owner_id);

alter table public.barbershops enable row level security;

drop policy if exists "Anyone can view barbershops" on public.barbershops;
create policy "Anyone can view barbershops"
  on public.barbershops
  for select
  using (true);

drop policy if exists "Owners can manage own barbershop" on public.barbershops;
create policy "Owners can manage own barbershop"
  on public.barbershops
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create or replace function public.trg_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_barbershops_touch_updated_at on public.barbershops;
create trigger trg_barbershops_touch_updated_at
before update on public.barbershops
for each row execute function public.trg_touch_updated_at();

-- Optional: seed a few shops for development (safe to re-run).
insert into public.barbershops (id, name, location)
values
  ('11111111-1111-1111-1111-111111111111', 'Barbearia Premium', 'Centro'),
  ('22222222-2222-2222-2222-222222222222', 'Classic Barber', 'Zona Sul'),
  ('33333333-3333-3333-3333-333333333333', 'King''s Cut', 'Zona Norte')
on conflict (id) do update
set
  name = excluded.name,
  location = excluded.location,
  updated_at = now();

