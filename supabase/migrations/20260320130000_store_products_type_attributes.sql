alter table public.store_products
  add column if not exists product_type text not null default 'barbearia',
  add column if not exists attributes jsonb not null default '{}'::jsonb;

create index if not exists idx_store_products_product_type
  on public.store_products (product_type);

create index if not exists idx_store_products_attributes_gin
  on public.store_products
  using gin (attributes);
