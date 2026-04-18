create table if not exists public.barbershop_customer_profiles (
  id uuid primary key default gen_random_uuid(),
  barbershop_id bigint not null,
  client_id text null,
  customer_name text not null,
  customer_phone text null,
  last_service_at timestamptz null,
  visit_count integer not null default 0,
  total_spent numeric not null default 0,
  avg_ticket numeric not null default 0,
  preferred_service text null,
  last_barber_name text null,
  notes text null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_profiles_shop on public.barbershop_customer_profiles(barbershop_id);
create index if not exists idx_customer_profiles_client_id on public.barbershop_customer_profiles(client_id);
create index if not exists idx_customer_profiles_customer_name on public.barbershop_customer_profiles(customer_name);
create index if not exists idx_customer_profiles_customer_phone on public.barbershop_customer_profiles(customer_phone);

create unique index if not exists idx_customer_profiles_shop_identity
  on public.barbershop_customer_profiles(
    barbershop_id,
    coalesce(client_id, ''),
    lower(customer_name),
    coalesce(customer_phone, '')
  );

alter table public.barbershop_customer_profiles enable row level security;

drop policy if exists "Customer profiles are readable" on public.barbershop_customer_profiles;
create policy "Customer profiles are readable"
  on public.barbershop_customer_profiles
  for select
  using (auth.uid() is not null);

drop policy if exists "Customer profiles are writable" on public.barbershop_customer_profiles;
create policy "Customer profiles are writable"
  on public.barbershop_customer_profiles
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create or replace function public.touch_customer_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_customer_profiles_updated_at on public.barbershop_customer_profiles;
create trigger trg_customer_profiles_updated_at
before update on public.barbershop_customer_profiles
for each row
execute procedure public.touch_customer_profile_updated_at();
