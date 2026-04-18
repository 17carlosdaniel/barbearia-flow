alter table public.product_sales
  add column if not exists commission_rate numeric not null default 0,
  add column if not exists commission_amount numeric not null default 0,
  add column if not exists seller_name text null;

create or replace function public.register_product_sale_tx(
  p_product_id uuid,
  p_barbershop_id bigint,
  p_barber_id text default null,
  p_seller_name text default null,
  p_quantity integer default 1,
  p_payment_method text default 'pix',
  p_source text default 'store',
  p_commission_rate numeric default 10
)
returns table (
  sale_id uuid,
  product_id uuid,
  barbershop_id bigint,
  quantity integer,
  unit_price numeric,
  total numeric,
  commission_rate numeric,
  commission_amount numeric,
  seller_name text,
  stock_after integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product record;
  v_sale_id uuid;
  v_unit_price numeric;
  v_total numeric;
  v_stock_after integer;
  v_commission_rate numeric;
  v_commission_amount numeric;
  v_created_at timestamptz := now();
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantidade inválida';
  end if;

  if p_source not in ('store', 'appointment_upsell') then
    raise exception 'Source inválido';
  end if;

  select *
  into v_product
  from public.store_products
  where id = p_product_id
    and barbershop_id = p_barbershop_id
  for update;

  if not found then
    raise exception 'Produto não encontrado para a barbearia';
  end if;

  if coalesce(v_product.stock, 0) < p_quantity then
    raise exception 'Estoque insuficiente';
  end if;

  v_unit_price := coalesce(v_product.sale_price, 0);
  v_total := round((v_unit_price * p_quantity)::numeric, 2);
  v_commission_rate := greatest(coalesce(p_commission_rate, 0), 0);
  v_commission_amount := round((v_total * (v_commission_rate / 100.0))::numeric, 2);
  v_stock_after := v_product.stock - p_quantity;

  insert into public.product_sales (
    product_id,
    barbershop_id,
    barber_id,
    quantity,
    unit_price,
    total,
    payment_method,
    source,
    commission_rate,
    commission_amount,
    seller_name,
    created_at
  )
  values (
    p_product_id,
    p_barbershop_id,
    p_barber_id,
    p_quantity,
    v_unit_price,
    v_total,
    coalesce(nullif(trim(p_payment_method), ''), 'pix'),
    p_source,
    v_commission_rate,
    v_commission_amount,
    nullif(trim(p_seller_name), ''),
    v_created_at
  )
  returning id into v_sale_id;

  update public.store_products
  set stock = v_stock_after
  where id = p_product_id;

  insert into public.stock_movements (
    product_id,
    barbershop_id,
    type,
    quantity,
    reason,
    reference_id,
    created_at
  )
  values (
    p_product_id,
    p_barbershop_id,
    'OUT',
    p_quantity,
    'SALE',
    v_sale_id::text,
    v_created_at
  );

  return query
  select
    v_sale_id,
    p_product_id,
    p_barbershop_id,
    p_quantity,
    v_unit_price,
    v_total,
    v_commission_rate,
    v_commission_amount,
    nullif(trim(p_seller_name), ''),
    v_stock_after,
    v_created_at;
end;
$$;

grant execute on function public.register_product_sale_tx(
  uuid,
  bigint,
  text,
  text,
  integer,
  text,
  text,
  numeric
) to authenticated;
