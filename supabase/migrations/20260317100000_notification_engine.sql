-- Notification engine: preferences, dedup/cooldown and metrics.

create table if not exists public.notification_preferences (
  user_id uuid primary key,
  lembretes_agendamento boolean not null default true,
  novas_avaliacoes boolean not null default true,
  promocoes boolean not null default false,
  quiet_hours_start smallint null check (quiet_hours_start between 0 and 23),
  quiet_hours_end smallint null check (quiet_hours_end between 0 and 23),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "Users can read own notification prefs" on public.notification_preferences;
create policy "Users can read own notification prefs"
  on public.notification_preferences
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can upsert own notification prefs" on public.notification_preferences;
create policy "Users can upsert own notification prefs"
  on public.notification_preferences
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notification prefs" on public.notification_preferences;
create policy "Users can update own notification prefs"
  on public.notification_preferences
  for update
  using (auth.uid() = user_id);

create table if not exists public.notification_delivery_metrics (
  id uuid primary key default gen_random_uuid(),
  notification_id text null,
  user_id uuid not null,
  role text not null check (role in ('cliente', 'barbeiro')),
  category text not null,
  event_name text not null check (event_name in ('sent', 'suppressed', 'read', 'clicked', 'deleted')),
  reason text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_notification_delivery_metrics_user_created
  on public.notification_delivery_metrics (user_id, created_at desc);

create index if not exists idx_notification_delivery_metrics_event
  on public.notification_delivery_metrics (event_name, created_at desc);

alter table public.notification_delivery_metrics enable row level security;

drop policy if exists "Users can read own notification metrics" on public.notification_delivery_metrics;
create policy "Users can read own notification metrics"
  on public.notification_delivery_metrics
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own notification metrics" on public.notification_delivery_metrics;
create policy "Users can insert own notification metrics"
  on public.notification_delivery_metrics
  for insert
  with check (auth.uid() = user_id);

create or replace function public.notification_is_allowed(
  p_category text,
  p_prefs public.notification_preferences
)
returns boolean
language plpgsql
immutable
as $$
begin
  if p_category = 'appointment' then
    return p_prefs.lembretes_agendamento;
  end if;
  if p_category = 'promo' or p_category = 'store' or p_category = 'giftcard' then
    return p_prefs.promocoes;
  end if;
  if p_category = 'system' or p_category = 'queue' or p_category = 'loyalty' then
    return true;
  end if;
  return true;
end;
$$;

create or replace function public.notification_in_quiet_hours(
  p_now timestamptz,
  p_start smallint,
  p_end smallint
)
returns boolean
language plpgsql
immutable
as $$
declare
  h smallint;
begin
  if p_start is null or p_end is null then
    return false;
  end if;
  h := extract(hour from p_now)::smallint;
  if p_start = p_end then
    return false;
  end if;
  if p_start < p_end then
    return h >= p_start and h < p_end;
  end if;
  return h >= p_start or h < p_end;
end;
$$;

create or replace function public.get_notification_preferences(p_user_id uuid)
returns public.notification_preferences
language plpgsql
security definer
set search_path = public
as $$
declare
  prefs public.notification_preferences;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not allowed';
  end if;

  insert into public.notification_preferences (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select *
  into prefs
  from public.notification_preferences
  where user_id = p_user_id;

  return prefs;
end;
$$;

grant execute on function public.get_notification_preferences(uuid) to authenticated;

create or replace function public.upsert_notification_preferences(
  p_user_id uuid,
  p_lembretes_agendamento boolean,
  p_novas_avaliacoes boolean,
  p_promocoes boolean,
  p_quiet_hours_start smallint default null,
  p_quiet_hours_end smallint default null
)
returns public.notification_preferences
language plpgsql
security definer
set search_path = public
as $$
declare
  prefs public.notification_preferences;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not allowed';
  end if;

  insert into public.notification_preferences (
    user_id,
    lembretes_agendamento,
    novas_avaliacoes,
    promocoes,
    quiet_hours_start,
    quiet_hours_end,
    updated_at
  )
  values (
    p_user_id,
    coalesce(p_lembretes_agendamento, true),
    coalesce(p_novas_avaliacoes, true),
    coalesce(p_promocoes, false),
    p_quiet_hours_start,
    p_quiet_hours_end,
    now()
  )
  on conflict (user_id) do update
  set
    lembretes_agendamento = excluded.lembretes_agendamento,
    novas_avaliacoes = excluded.novas_avaliacoes,
    promocoes = excluded.promocoes,
    quiet_hours_start = excluded.quiet_hours_start,
    quiet_hours_end = excluded.quiet_hours_end,
    updated_at = now()
  returning *
  into prefs;

  return prefs;
end;
$$;

grant execute on function public.upsert_notification_preferences(uuid, boolean, boolean, boolean, smallint, smallint) to authenticated;

create or replace function public.emit_notification(
  p_user_id uuid,
  p_role text,
  p_category text,
  p_title text,
  p_message text,
  p_priority text default 'normal',
  p_action_type text default null,
  p_action_label text default null,
  p_action_payload text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_dedupe_key text default null,
  p_cooldown_seconds integer default 30
)
returns table (inserted boolean, notification_id text, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  prefs public.notification_preferences;
  notif_id text;
  now_utc timestamptz := now();
begin
  if auth.uid() is null then
    return query select false, null::text, 'unauthenticated'::text;
    return;
  end if;

  insert into public.notification_preferences (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select *
  into prefs
  from public.notification_preferences
  where user_id = p_user_id;

  if not public.notification_is_allowed(p_category, prefs) then
    insert into public.notification_delivery_metrics (user_id, role, category, event_name, reason, metadata)
    values (p_user_id, p_role, p_category, 'suppressed', 'preference_disabled', coalesce(p_metadata, '{}'::jsonb));
    return query select false, null::text, 'preference_disabled'::text;
    return;
  end if;

  if public.notification_in_quiet_hours(now_utc, prefs.quiet_hours_start, prefs.quiet_hours_end) then
    insert into public.notification_delivery_metrics (user_id, role, category, event_name, reason, metadata)
    values (p_user_id, p_role, p_category, 'suppressed', 'quiet_hours', coalesce(p_metadata, '{}'::jsonb));
    return query select false, null::text, 'quiet_hours'::text;
    return;
  end if;

  if p_dedupe_key is not null then
    if exists (
      select 1
      from public.notifications n
      where n.user_id = p_user_id
        and n.category = p_category
        and n.metadata ->> 'dedupe_key' = p_dedupe_key
        and n.created_at >= (now_utc - make_interval(secs => greatest(coalesce(p_cooldown_seconds, 30), 0)))
    ) then
      insert into public.notification_delivery_metrics (user_id, role, category, event_name, reason, metadata)
      values (
        p_user_id,
        p_role,
        p_category,
        'suppressed',
        'cooldown_dedupe',
        coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('dedupe_key', p_dedupe_key)
      );
      return query select false, null::text, 'cooldown_dedupe'::text;
      return;
    end if;
  end if;

  notif_id := 'notif_' || extract(epoch from now_utc)::bigint::text || '_' || substr(md5(random()::text), 1, 8);

  insert into public.notifications (
    id,
    user_id,
    role,
    category,
    title,
    message,
    priority,
    read,
    pinned,
    action_type,
    action_label,
    action_payload,
    metadata,
    created_at,
    updated_at
  )
  values (
    notif_id,
    p_user_id,
    p_role,
    p_category,
    p_title,
    p_message,
    coalesce(p_priority, 'normal'),
    false,
    case when p_priority = 'critical' then true else false end,
    p_action_type,
    p_action_label,
    p_action_payload,
    coalesce(p_metadata, '{}'::jsonb) || case when p_dedupe_key is not null then jsonb_build_object('dedupe_key', p_dedupe_key) else '{}'::jsonb end,
    now_utc,
    now_utc
  );

  insert into public.notification_delivery_metrics (
    notification_id,
    user_id,
    role,
    category,
    event_name,
    metadata
  )
  values (
    notif_id,
    p_user_id,
    p_role,
    p_category,
    'sent',
    coalesce(p_metadata, '{}'::jsonb)
  );

  return query select true, notif_id, 'sent'::text;
end;
$$;

grant execute on function public.emit_notification(uuid, text, text, text, text, text, text, text, text, jsonb, text, integer) to authenticated;
