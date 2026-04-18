alter table public.shop_orders
  add column if not exists barber_id uuid null,
  add column if not exists barber_name text null,
  add column if not exists attended_at timestamptz null,
  add column if not exists finalized_at timestamptz null;

update public.shop_orders
set status = case
  when status = 'aguardando_pagamento' then 'pendente'
  when status = 'em_separacao' then 'em_atendimento'
  when status in ('enviado', 'entregue') then 'finalizado'
  else status
end
where status in ('aguardando_pagamento', 'em_separacao', 'enviado', 'entregue');

create or replace function public.emit_store_order_notification(
  p_user_id uuid,
  p_event text,
  p_order_id text,
  p_status text default null,
  p_total numeric default null
)
returns table (inserted boolean, notification_id text, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_message text;
  v_priority text := 'normal';
  v_dedupe_key text;
  v_status text := coalesce(p_status, 'pendente');
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    return query select false, null::text, 'forbidden'::text;
    return;
  end if;

  case p_event
    when 'created' then
      v_title := 'Venda registrada';
      v_message := format('Seu pedido %s foi registrado no caixa da barbearia.', coalesce(nullif(trim(p_order_id), ''), '--'));
    when 'confirmed' then
      v_title := 'Pagamento confirmado';
      v_message := format('Pedido %s confirmado. Total: R$ %s.', coalesce(nullif(trim(p_order_id), ''), '--'), coalesce(to_char(p_total, 'FM999999990D00'), '--'));
    when 'status_changed' then
      v_title := 'Status da venda atualizado';
      v_message := format('Seu pedido %s agora está: %s.', coalesce(nullif(trim(p_order_id), ''), '--'), coalesce(replace(v_status, '_', ' '), 'atualizado'));
      if v_status = 'finalizado' then
        v_priority := 'high';
      end if;
    else
      v_title := 'Atualização da venda';
      v_message := format('Seu pedido %s recebeu uma atualização.', coalesce(nullif(trim(p_order_id), ''), '--'));
  end case;

  v_dedupe_key := format(
    'store_%s_%s_%s',
    coalesce(p_event, 'event'),
    coalesce(p_order_id, 'order'),
    coalesce(v_status, 'status')
  );

  return query
  select *
  from public.emit_notification(
    p_user_id,
    'cliente',
    'store',
    v_title,
    v_message,
    v_priority,
    'open_store',
    'Acompanhar pedido',
    '/cliente/loja',
    jsonb_build_object(
      'event', p_event,
      'order_id', p_order_id,
      'status', v_status,
      'total', p_total
    ),
    v_dedupe_key,
    20
  );
end;
$$;

grant execute on function public.emit_store_order_notification(uuid, text, text, text, numeric) to authenticated;
