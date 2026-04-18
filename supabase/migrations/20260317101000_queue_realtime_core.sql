-- Queue realtime core.

create table if not exists public.queue_sessions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id bigint not null,
  service_name text not null default 'Corte',
  status text not null default 'open' check (status in ('open', 'paused', 'closed')),
  active_barbers integer not null default 1 check (active_barbers > 0),
  avg_service_minutes integer not null default 30 check (avg_service_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_queue_sessions_barbershop_open
  on public.queue_sessions (barbershop_id, status);

create table if not exists public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.queue_sessions(id) on delete cascade,
  client_id uuid not null,
  client_name text not null default 'Cliente',
  position integer not null check (position > 0),
  status text not null default 'waiting' check (status in ('waiting', 'notified', 'arriving', 'served', 'cancelled', 'expired')),
  notified_at timestamptz null,
  arrived_at timestamptz null,
  served_at timestamptz null,
  cancelled_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, client_id, status)
    deferrable initially immediate
);

create index if not exists idx_queue_entries_session_position
  on public.queue_entries (session_id, position);

create index if not exists idx_queue_entries_client
  on public.queue_entries (client_id, created_at desc);

create table if not exists public.queue_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.queue_sessions(id) on delete cascade,
  entry_id uuid null references public.queue_entries(id) on delete set null,
  event_type text not null check (event_type in ('join', 'leave', 'status_change', 'position_change', 'served', 'called_next')),
  actor_user_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_queue_events_session_created
  on public.queue_events (session_id, created_at desc);

alter table public.queue_sessions enable row level security;
alter table public.queue_entries enable row level security;
alter table public.queue_events enable row level security;

drop policy if exists "Queue sessions read public" on public.queue_sessions;
create policy "Queue sessions read public"
  on public.queue_sessions
  for select
  using (true);

drop policy if exists "Queue entries clients read own" on public.queue_entries;
create policy "Queue entries clients read own"
  on public.queue_entries
  for select
  using (auth.uid() = client_id);

drop policy if exists "Queue entries clients insert own" on public.queue_entries;
create policy "Queue entries clients insert own"
  on public.queue_entries
  for insert
  with check (auth.uid() = client_id);

drop policy if exists "Queue entries clients update own" on public.queue_entries;
create policy "Queue entries clients update own"
  on public.queue_entries
  for update
  using (auth.uid() = client_id);

drop policy if exists "Queue events clients read own" on public.queue_events;
create policy "Queue events clients read own"
  on public.queue_events
  for select
  using (
    exists (
      select 1
      from public.queue_entries qe
      where qe.id = queue_events.entry_id
        and qe.client_id = auth.uid()
    )
  );

create or replace function public.queue_recompute_positions(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  new_pos integer := 1;
begin
  for rec in
    select id, position
    from public.queue_entries
    where session_id = p_session_id
      and status in ('waiting', 'notified', 'arriving')
    order by position asc, created_at asc
  loop
    if rec.position <> new_pos then
      update public.queue_entries
      set position = new_pos, updated_at = now()
      where id = rec.id;
    end if;
    new_pos := new_pos + 1;
  end loop;
end;
$$;

create or replace function public.queue_join(
  p_session_id uuid,
  p_client_name text default 'Cliente'
)
returns table (
  entry_id uuid,
  session_id uuid,
  position integer,
  status text,
  estimated_wait_minutes integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid := p_session_id;
  cid uuid := auth.uid();
  next_position integer;
  avg_min integer;
  active_barbers integer;
  eid uuid;
begin
  if cid is null then
    raise exception 'unauthenticated';
  end if;

  if exists (
    select 1
    from public.queue_entries
    where session_id = sid
      and client_id = cid
      and status in ('waiting', 'notified', 'arriving')
  ) then
    return query
      select qe.id, qe.session_id, qe.position, qe.status,
        greatest((qe.position - 1) * greatest(qs.avg_service_minutes / greatest(qs.active_barbers, 1), 5), 0)::integer
      from public.queue_entries qe
      join public.queue_sessions qs on qs.id = qe.session_id
      where qe.session_id = sid and qe.client_id = cid and qe.status in ('waiting', 'notified', 'arriving')
      order by qe.created_at desc
      limit 1;
    return;
  end if;

  select coalesce(max(position), 0) + 1
  into next_position
  from public.queue_entries
  where session_id = sid
    and status in ('waiting', 'notified', 'arriving');

  insert into public.queue_entries (session_id, client_id, client_name, position, status, created_at, updated_at)
  values (sid, cid, coalesce(nullif(trim(p_client_name), ''), 'Cliente'), next_position, 'waiting', now(), now())
  returning id into eid;

  insert into public.queue_events (session_id, entry_id, event_type, actor_user_id, metadata)
  values (sid, eid, 'join', cid, jsonb_build_object('position', next_position));

  select avg_service_minutes, active_barbers
  into avg_min, active_barbers
  from public.queue_sessions
  where id = sid;

  perform public.emit_notification(
    cid,
    'cliente',
    'queue',
    'Entrada na fila confirmada',
    format('Sua posição atual é #%s.', next_position),
    'high',
    'open_queue',
    'Acompanhar fila',
    '/cliente/fila-espera',
    jsonb_build_object('session_id', sid::text, 'entry_id', eid::text, 'position', next_position),
    format('queue_join_%s_%s', sid::text, cid::text),
    20
  );

  return query
    select
      eid,
      sid,
      next_position,
      'waiting'::text,
      greatest((next_position - 1) * greatest(avg_min / greatest(active_barbers, 1), 5), 0)::integer;
end;
$$;

grant execute on function public.queue_join(uuid, text) to authenticated;

create or replace function public.queue_leave(p_entry_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
begin
  update public.queue_entries
  set status = 'cancelled', cancelled_at = now(), updated_at = now()
  where id = p_entry_id
    and client_id = auth.uid()
    and status in ('waiting', 'notified', 'arriving')
  returning session_id into sid;

  if sid is null then
    return false;
  end if;

  insert into public.queue_events (session_id, entry_id, event_type, actor_user_id, metadata)
  values (sid, p_entry_id, 'leave', auth.uid(), '{}'::jsonb);

  perform public.queue_recompute_positions(sid);
  return true;
end;
$$;

grant execute on function public.queue_leave(uuid) to authenticated;

create or replace function public.queue_mark_arriving(p_entry_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
begin
  update public.queue_entries
  set status = 'arriving', arrived_at = now(), updated_at = now()
  where id = p_entry_id
    and client_id = auth.uid()
    and status in ('waiting', 'notified')
  returning session_id into sid;

  if sid is null then
    return false;
  end if;

  insert into public.queue_events (session_id, entry_id, event_type, actor_user_id, metadata)
  values (sid, p_entry_id, 'status_change', auth.uid(), jsonb_build_object('status', 'arriving'));
  return true;
end;
$$;

grant execute on function public.queue_mark_arriving(uuid) to authenticated;

create or replace function public.queue_call_next(p_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  next_entry record;
  cid uuid;
begin
  select id, client_id, position
  into next_entry
  from public.queue_entries
  where session_id = p_session_id
    and status = 'waiting'
  order by position asc, created_at asc
  limit 1;

  if next_entry.id is null then
    return null;
  end if;

  update public.queue_entries
  set status = 'notified', notified_at = now(), updated_at = now()
  where id = next_entry.id;

  cid := next_entry.client_id;

  insert into public.queue_events (session_id, entry_id, event_type, actor_user_id, metadata)
  values (
    p_session_id,
    next_entry.id,
    'called_next',
    auth.uid(),
    jsonb_build_object('position', next_entry.position)
  );

  perform public.emit_notification(
    cid,
    'cliente',
    'queue',
    'Você é o próximo',
    'Sua vez na fila foi chamada. Toque para acompanhar.',
    'critical',
    'open_queue',
    'Ver fila',
    '/cliente/fila-espera',
    jsonb_build_object('session_id', p_session_id::text, 'entry_id', next_entry.id::text),
    format('queue_called_%s_%s', p_session_id::text, next_entry.id::text),
    25
  );

  return next_entry.id;
end;
$$;

grant execute on function public.queue_call_next(uuid) to authenticated;

create or replace function public.queue_estimated_wait_minutes(p_session_id uuid, p_position integer)
returns integer
language sql
stable
as $$
  select greatest(
    (greatest(coalesce(p_position, 1), 1) - 1)
    * greatest(qs.avg_service_minutes / greatest(qs.active_barbers, 1), 5),
    0
  )::integer
  from public.queue_sessions qs
  where qs.id = p_session_id
$$;

grant execute on function public.queue_estimated_wait_minutes(uuid, integer) to authenticated;
