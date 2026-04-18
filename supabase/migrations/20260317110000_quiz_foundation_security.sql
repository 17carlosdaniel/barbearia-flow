-- Quiz foundation + security hardening for existing RPCs.

-- 1) Hardening: emit_notification can only emit for self when called by authenticated client.
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

  if auth.uid() <> p_user_id then
    return query select false, null::text, 'forbidden'::text;
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

-- 2) Hardening: loyalty summary only for auth user.
create or replace function public.get_loyalty_summary(p_user_id uuid)
returns table (
  total_points integer,
  credits integer,
  debits integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not allowed';
  end if;

  return query
  select
    coalesce(sum(case when direction = 'credit' then points else -points end), 0)::integer as total_points,
    coalesce(sum(case when direction = 'credit' then points else 0 end), 0)::integer as credits,
    coalesce(sum(case when direction = 'debit' then points else 0 end), 0)::integer as debits
  from public.loyalty_points_ledger
  where user_id = p_user_id;
end;
$$;

-- 3) Queue sessions: allow authenticated insert/update and public read.
drop policy if exists "Queue sessions read public" on public.queue_sessions;
create policy "Queue sessions read public"
  on public.queue_sessions
  for select
  using (true);

drop policy if exists "Queue sessions authenticated insert" on public.queue_sessions;
create policy "Queue sessions authenticated insert"
  on public.queue_sessions
  for insert
  with check (auth.uid() is not null);

drop policy if exists "Queue sessions authenticated update" on public.queue_sessions;
create policy "Queue sessions authenticated update"
  on public.queue_sessions
  for update
  using (auth.uid() is not null);

-- 4) Quiz domain tables.
create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  source text not null default 'quiz_produtos',
  status text not null default 'started' check (status in ('started', 'analyzing', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  user_id uuid not null,
  hair_type text null,
  hair_length text null,
  concern text null,
  routine text null,
  budget text null,
  desired_style text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id)
);

create table if not exists public.quiz_image_analysis (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  user_id uuid not null,
  image_path text null,
  image_public_url text null,
  provider text null,
  confidence numeric not null default 0,
  hair_type_predicted text null,
  porosity text null,
  frizz_level text null,
  notes text null,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id)
);

create table if not exists public.quiz_recommendations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  user_id uuid not null,
  summary text not null default '',
  premium_tip text null,
  confidence numeric not null default 0,
  reasoning jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id)
);

create table if not exists public.quiz_recommendation_products (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.quiz_recommendations(id) on delete cascade,
  user_id uuid not null,
  product_id text not null,
  score numeric not null default 0,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_recommendation_styles (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.quiz_recommendations(id) on delete cascade,
  user_id uuid not null,
  style_name text not null,
  score numeric not null default 0,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  user_id uuid not null,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_quiz_sessions_user_created on public.quiz_sessions (user_id, created_at desc);
create index if not exists idx_quiz_events_user_created on public.quiz_events (user_id, created_at desc);

alter table public.quiz_sessions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.quiz_image_analysis enable row level security;
alter table public.quiz_recommendations enable row level security;
alter table public.quiz_recommendation_products enable row level security;
alter table public.quiz_recommendation_styles enable row level security;
alter table public.quiz_events enable row level security;

drop policy if exists "Users own quiz sessions select" on public.quiz_sessions;
create policy "Users own quiz sessions select" on public.quiz_sessions
  for select using (auth.uid() = user_id);
drop policy if exists "Users own quiz sessions insert" on public.quiz_sessions;
create policy "Users own quiz sessions insert" on public.quiz_sessions
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users own quiz sessions update" on public.quiz_sessions;
create policy "Users own quiz sessions update" on public.quiz_sessions
  for update using (auth.uid() = user_id);

drop policy if exists "Users own quiz answers select" on public.quiz_answers;
create policy "Users own quiz answers select" on public.quiz_answers
  for select using (auth.uid() = user_id);
drop policy if exists "Users own quiz answers insert" on public.quiz_answers;
create policy "Users own quiz answers insert" on public.quiz_answers
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users own quiz answers update" on public.quiz_answers;
create policy "Users own quiz answers update" on public.quiz_answers
  for update using (auth.uid() = user_id);

drop policy if exists "Users own quiz image analysis select" on public.quiz_image_analysis;
create policy "Users own quiz image analysis select" on public.quiz_image_analysis
  for select using (auth.uid() = user_id);
drop policy if exists "Users own quiz image analysis insert" on public.quiz_image_analysis;
create policy "Users own quiz image analysis insert" on public.quiz_image_analysis
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users own quiz image analysis update" on public.quiz_image_analysis;
create policy "Users own quiz image analysis update" on public.quiz_image_analysis
  for update using (auth.uid() = user_id);

drop policy if exists "Users own quiz recommendations select" on public.quiz_recommendations;
create policy "Users own quiz recommendations select" on public.quiz_recommendations
  for select using (auth.uid() = user_id);
drop policy if exists "Users own quiz recommendations insert" on public.quiz_recommendations;
create policy "Users own quiz recommendations insert" on public.quiz_recommendations
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users own quiz recommendations update" on public.quiz_recommendations;
create policy "Users own quiz recommendations update" on public.quiz_recommendations
  for update using (auth.uid() = user_id);

drop policy if exists "Users own quiz recommendation products select" on public.quiz_recommendation_products;
create policy "Users own quiz recommendation products select" on public.quiz_recommendation_products
  for select using (auth.uid() = user_id);
drop policy if exists "Users own quiz recommendation products insert" on public.quiz_recommendation_products;
create policy "Users own quiz recommendation products insert" on public.quiz_recommendation_products
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users own quiz recommendation styles select" on public.quiz_recommendation_styles;
create policy "Users own quiz recommendation styles select" on public.quiz_recommendation_styles
  for select using (auth.uid() = user_id);
drop policy if exists "Users own quiz recommendation styles insert" on public.quiz_recommendation_styles;
create policy "Users own quiz recommendation styles insert" on public.quiz_recommendation_styles
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users own quiz events select" on public.quiz_events;
create policy "Users own quiz events select" on public.quiz_events
  for select using (auth.uid() = user_id);
drop policy if exists "Users own quiz events insert" on public.quiz_events;
create policy "Users own quiz events insert" on public.quiz_events
  for insert with check (auth.uid() = user_id);

-- 5) Storage bucket for quiz image upload (future AI analysis).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quiz-hair-input',
  'quiz-hair-input',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "Quiz hair upload own folder" on storage.objects;
create policy "Quiz hair upload own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'quiz-hair-input'
  and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists "Quiz hair read own folder" on storage.objects;
create policy "Quiz hair read own folder"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'quiz-hair-input'
  and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists "Quiz hair update own folder" on storage.objects;
create policy "Quiz hair update own folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'quiz-hair-input'
  and auth.uid()::text = split_part(name, '/', 1)
)
with check (
  bucket_id = 'quiz-hair-input'
  and auth.uid()::text = split_part(name, '/', 1)
);
