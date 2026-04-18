-- Domain-level notification emitters (server-side templates).

create or replace function public.emit_appointment_notification(
  p_user_id uuid,
  p_event text,
  p_service text,
  p_barbershop_name text,
  p_date text default null,
  p_time text default null,
  p_status text default null
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
  v_payload text := '/cliente/agendamentos';
  v_dedupe_key text;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    return query select false, null::text, 'forbidden'::text;
    return;
  end if;

  case p_event
    when 'created' then
      v_title := 'Agendamento confirmado';
      v_message := format('%s em %s no dia %s às %s.', coalesce(nullif(trim(p_service), ''), 'Serviço'), coalesce(nullif(trim(p_barbershop_name), ''), 'sua barbearia'), coalesce(p_date, '--/--/----'), coalesce(p_time, '--:--'));
      v_priority := 'high';
    when 'updated' then
      v_title := 'Agendamento atualizado';
      v_message := format('%s em %s foi atualizado.', coalesce(nullif(trim(p_service), ''), 'Serviço'), coalesce(nullif(trim(p_barbershop_name), ''), 'sua barbearia'));
    when 'cancelled' then
      v_title := 'Agendamento cancelado';
      v_message := format('%s em %s foi cancelado.', coalesce(nullif(trim(p_service), ''), 'Serviço'), coalesce(nullif(trim(p_barbershop_name), ''), 'sua barbearia'));
      v_priority := 'high';
    when 'rescheduled' then
      v_title := 'Agendamento reagendado';
      v_message := format('Novo horário de %s em %s: %s às %s.', coalesce(nullif(trim(p_service), ''), 'Serviço'), coalesce(nullif(trim(p_barbershop_name), ''), 'sua barbearia'), coalesce(p_date, '--/--/----'), coalesce(p_time, '--:--'));
      v_priority := 'high';
    when 'status_changed' then
      v_title := 'Status do agendamento atualizado';
      v_message := format('%s em %s está com status: %s.', coalesce(nullif(trim(p_service), ''), 'Serviço'), coalesce(nullif(trim(p_barbershop_name), ''), 'sua barbearia'), coalesce(nullif(trim(p_status), ''), 'atualizado'));
    else
      v_title := 'Agendamento atualizado';
      v_message := format('%s em %s teve atualização.', coalesce(nullif(trim(p_service), ''), 'Serviço'), coalesce(nullif(trim(p_barbershop_name), ''), 'sua barbearia'));
  end case;

  v_dedupe_key := format(
    'appointment_%s_%s_%s_%s',
    coalesce(p_event, 'event'),
    coalesce(p_service, 'service'),
    coalesce(p_date, 'date'),
    coalesce(p_time, 'time')
  );

  return query
  select *
  from public.emit_notification(
    p_user_id,
    'cliente',
    'appointment',
    v_title,
    v_message,
    v_priority,
    'view_details',
    'Ver agendamentos',
    v_payload,
    jsonb_build_object(
      'event', p_event,
      'service', p_service,
      'barbershop_name', p_barbershop_name,
      'date', p_date,
      'time', p_time,
      'status', p_status
    ),
    v_dedupe_key,
    30
  );
end;
$$;

grant execute on function public.emit_appointment_notification(uuid, text, text, text, text, text, text) to authenticated;

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
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    return query select false, null::text, 'forbidden'::text;
    return;
  end if;

  case p_event
    when 'created' then
      v_title := 'Pedido realizado';
      v_message := format('Seu pedido %s foi criado e está aguardando processamento.', coalesce(nullif(trim(p_order_id), ''), '--'));
    when 'confirmed' then
      v_title := 'Pedido confirmado';
      v_message := format('Pedido %s confirmado. Total: R$ %s.', coalesce(nullif(trim(p_order_id), ''), '--'), coalesce(to_char(p_total, 'FM999999990D00'), '--'));
    when 'status_changed' then
      v_title := 'Status do pedido atualizado';
      v_message := format('Seu pedido %s agora está: %s.', coalesce(nullif(trim(p_order_id), ''), '--'), coalesce(replace(p_status, '_', ' '), 'atualizado'));
      if p_status in ('entregue', 'enviado') then
        v_priority := 'high';
      end if;
    else
      v_title := 'Atualização do pedido';
      v_message := format('Seu pedido %s recebeu uma atualização.', coalesce(nullif(trim(p_order_id), ''), '--'));
  end case;

  v_dedupe_key := format(
    'store_%s_%s_%s',
    coalesce(p_event, 'event'),
    coalesce(p_order_id, 'order'),
    coalesce(p_status, 'status')
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
      'status', p_status,
      'total', p_total
    ),
    v_dedupe_key,
    20
  );
end;
$$;

grant execute on function public.emit_store_order_notification(uuid, text, text, text, numeric) to authenticated;

create or replace function public.emit_giftcard_notification(
  p_user_id uuid,
  p_event text,
  p_code text,
  p_recipient_name text default null,
  p_amount numeric default null
)
returns table (inserted boolean, notification_id text, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_message text;
  v_dedupe_key text;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    return query select false, null::text, 'forbidden'::text;
    return;
  end if;

  case p_event
    when 'created' then
      v_title := 'Gift card criado';
      v_message := format(
        'Código %s pronto para %s.',
        coalesce(nullif(trim(p_code), ''), '--'),
        coalesce(nullif(trim(p_recipient_name), ''), 'compartilhamento')
      );
    when 'expiring' then
      v_title := 'Gift card próximo de expirar';
      v_message := format('Seu gift card %s expira em breve.', coalesce(nullif(trim(p_code), ''), '--'));
    else
      v_title := 'Atualização de gift card';
      v_message := format('Gift card %s recebeu uma atualização.', coalesce(nullif(trim(p_code), ''), '--'));
  end case;

  v_dedupe_key := format('giftcard_%s_%s', coalesce(p_event, 'event'), coalesce(p_code, 'code'));

  return query
  select *
  from public.emit_notification(
    p_user_id,
    'cliente',
    'giftcard',
    v_title,
    v_message,
    'normal',
    'open_gift',
    'Ver gift cards',
    '/cliente/gift-cards',
    jsonb_build_object(
      'event', p_event,
      'code', p_code,
      'recipient_name', p_recipient_name,
      'amount', p_amount
    ),
    v_dedupe_key,
    45
  );
end;
$$;

grant execute on function public.emit_giftcard_notification(uuid, text, text, text, numeric) to authenticated;
