create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  barbershop_id bigint not null,
  name text not null,
  description text not null default '',
  category text not null default 'Produtos',
  cost_price numeric not null default 0,
  sale_price numeric not null default 0,
  stock integer not null default 0,
  min_stock integer not null default 3,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  tags text[] not null default '{}',
  image_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.store_products(id) on delete cascade,
  barbershop_id bigint not null,
  barber_id text null,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null default 0,
  total numeric not null default 0,
  payment_method text not null default 'pix',
  source text not null default 'store' check (source in ('store', 'appointment_upsell')),
  created_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.store_products(id) on delete cascade,
  barbershop_id bigint not null,
  type text not null check (type in ('IN', 'OUT')),
  quantity integer not null check (quantity > 0),
  reason text not null check (reason in ('SALE', 'ADJUSTMENT', 'RESTOCK')),
  reference_id text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_store_products_shop on public.store_products(barbershop_id);
create index if not exists idx_store_products_created on public.store_products(created_at desc);
create index if not exists idx_store_products_stock on public.store_products(barbershop_id, stock, min_stock);

create index if not exists idx_product_sales_shop on public.product_sales(barbershop_id);
create index if not exists idx_product_sales_product on public.product_sales(product_id);
create index if not exists idx_product_sales_created on public.product_sales(created_at desc);

create index if not exists idx_stock_movements_shop on public.stock_movements(barbershop_id);
create index if not exists idx_stock_movements_product on public.stock_movements(product_id);
create index if not exists idx_stock_movements_created on public.stock_movements(created_at desc);

alter table public.store_products enable row level security;
alter table public.product_sales enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists "Store products are readable" on public.store_products;
create policy "Store products are readable"
  on public.store_products
  for select
  using (true);

drop policy if exists "Store products are writable" on public.store_products;
create policy "Store products are writable"
  on public.store_products
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Product sales are readable" on public.product_sales;
create policy "Product sales are readable"
  on public.product_sales
  for select
  using (auth.uid() is not null);

drop policy if exists "Product sales are writable" on public.product_sales;
create policy "Product sales are writable"
  on public.product_sales
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Stock movements are readable" on public.stock_movements;
create policy "Stock movements are readable"
  on public.stock_movements
  for select
  using (auth.uid() is not null);

drop policy if exists "Stock movements are writable" on public.stock_movements;
create policy "Stock movements are writable"
  on public.stock_movements
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create or replace function public.touch_store_product_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_store_products_updated_at on public.store_products;
create trigger trg_store_products_updated_at
before update on public.store_products
for each row
execute procedure public.touch_store_product_updated_at();
