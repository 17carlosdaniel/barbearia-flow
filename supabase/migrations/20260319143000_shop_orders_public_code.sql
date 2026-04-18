alter table public.shop_orders
  add column if not exists order_public_code text null;

create index if not exists idx_shop_orders_public_code
  on public.shop_orders(order_public_code);
