-- Variações / SKU por produto da loja (estoque por combinação de atributos)

create table if not exists public.store_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.store_products (id) on delete cascade,
  sku text,
  attrs_key jsonb not null default '{}'::jsonb,
  stock integer not null default 0,
  min_stock integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_store_product_variants_product_id
  on public.store_product_variants (product_id);

create index if not exists idx_store_product_variants_attrs
  on public.store_product_variants
  using gin (attrs_key);

create or replace function public.touch_store_product_variant_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_store_product_variants_updated_at on public.store_product_variants;
create trigger trg_store_product_variants_updated_at
  before update on public.store_product_variants
  for each row execute procedure public.touch_store_product_variant_updated_at();

alter table public.store_product_variants enable row level security;

drop policy if exists "Store product variants are readable" on public.store_product_variants;
create policy "Store product variants are readable"
  on public.store_product_variants
  for select using (true);

drop policy if exists "Store product variants are writable" on public.store_product_variants;
create policy "Store product variants are writable"
  on public.store_product_variants
  for all using (true) with check (true);
