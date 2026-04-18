-- Product completion for smart queue + gamification + referral operations.
-- Complements existing migrations with catalog, wallet aggregate, queue alerts and recommendation RPC.

create table if not exists public.wait_missions_catalog (
  id text primary key,
  type text not null,
  title text not null,
  description text not null,
  reward_points integer not null default 0,
  scope text not null check (scope in ('daily', 'weekly', 'always')),
  target_count integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.wait_missions_catalog (id, type, title, description, reward_points, scope, target_count, active)
values
  ('m-evaluate-last', 'evaluate_last_barbershop', 'Avalie sua última barbearia', 'Envie uma avaliação e ganhe pontos extras.', 40, 'weekly', 1, true),
  ('m-upload-photo', 'upload_cut_photo', 'Poste foto do seu corte', 'Mostre seu novo visual e acumule pontos.', 30, 'daily', 1, true),
  ('m-survey', 'quick_survey', 'Responda pesquisa rápida', 'Ajude a melhorar o app com feedback rápido.', 20, 'daily', 1, true),
  ('m-follow-shops', 'follow_barbershops', 'Siga 3 barbearias', 'Aumente suas recomendações personalizadas.', 50, 'always', 3, true),
  ('m-weekly-bookings', 'weekly_booking_challenge', 'Desafio semanal', 'Conclua 2 agendamentos na semana.', 80, 'weekly', 2, true)
on conflict (id) do update
set
  type = excluded.type,
  title = excluded.title,
  description = excluded.description,
  reward_points = excluded.reward_points,
  scope = excluded.scope,
  target_count = excluded.target_count,
  active = excluded.active,
  updated_at = now();

alter table public.wait_missions_catalog enable row level security;

drop policy if exists "Wait mission catalog read public" on public.wait_missions_catalog;
create policy "Wait mission catalog read public"
  on public.wait_missions_catalog
  for select
  using (true);

create table if not exists public.user_loyalty_wallet (
  user_id uuid primary key,
  total_points integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_loyalty_wallet enable row level security;

drop policy if exists "Users can read own loyalty wallet" on public.user_loyalty_wallet;
create policy "Users can read own loyalty wallet"
  on public.user_loyalty_wallet
  for select
  using (auth.uid() = user_id);

create or replace function public.refresh_user_loyalty_wallet(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer;
begin
  select coalesce(sum(case when direction = 'credit' then points else -points end), 0)::integer
  into total
  from public.loyalty_points_ledger
  where user_id = p_user_id;

  insert into public.user_loyalty_wallet (user_id, total_points, updated_at)
  values (p_user_id, total, now())
  on conflict (user_id) do update
  set total_points = excluded.total_points,
      updated_at = now();

  return total;
end;
$$;

grant execute on function public.refresh_user_loyalty_wallet(uuid) to authenticated;

create or replace function public.trg_refresh_wallet_on_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_user_loyalty_wallet(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_refresh_wallet_on_ledger on public.loyalty_points_ledger;
create trigger trg_refresh_wallet_on_ledger
after insert or update or delete on public.loyalty_points_ledger
for each row execute function public.trg_refresh_wallet_on_ledger();

create table if not exists public.queue_alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.queue_entries(id) on delete cascade,
  user_id uuid not null,
  alert_type text not null check (alert_type in ('one_ahead', 'my_turn', 'nearby_slot')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entry_id, user_id, alert_type)
);

alter table public.queue_alert_subscriptions enable row level security;

drop policy if exists "Queue alert read own" on public.queue_alert_subscriptions;
create policy "Queue alert read own"
  on public.queue_alert_subscriptions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Queue alert upsert own" on public.queue_alert_subscriptions;
create policy "Queue alert upsert own"
  on public.queue_alert_subscriptions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Queue alert update own" on public.queue_alert_subscriptions;
create policy "Queue alert update own"
  on public.queue_alert_subscriptions
  for update
  using (auth.uid() = user_id);

create or replace function public.get_smart_queue_recommendations(
  p_limit integer default 3
)
returns table (
  session_id uuid,
  barbershop_id bigint,
  waiting_count integer,
  estimated_wait_minutes integer,
  score numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with queue_counts as (
    select
      qs.id as session_id,
      qs.barbershop_id,
      qs.avg_service_minutes,
      qs.active_barbers,
      count(qe.id)::integer as waiting_count
    from public.queue_sessions qs
    left join public.queue_entries qe
      on qe.session_id = qs.id
      and qe.status in ('waiting', 'notified', 'arriving')
    where qs.status = 'open'
    group by qs.id, qs.barbershop_id, qs.avg_service_minutes, qs.active_barbers
  )
  select
    qc.session_id,
    qc.barbershop_id,
    qc.waiting_count,
    greatest((qc.waiting_count * greatest(qc.avg_service_minutes / greatest(qc.active_barbers, 1), 5)), 0)::integer as estimated_wait_minutes,
    (1000.0 / greatest((qc.waiting_count * greatest(qc.avg_service_minutes / greatest(qc.active_barbers, 1), 5)) + 1, 1))::numeric as score
  from queue_counts qc
  order by score desc
  limit greatest(coalesce(p_limit, 3), 1);
$$;

grant execute on function public.get_smart_queue_recommendations(integer) to authenticated;
