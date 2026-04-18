-- Loyalty rewards redemption + social ranking foundation.

create table if not exists public.loyalty_rewards_catalog (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text null,
  points_cost integer not null check (points_cost > 0),
  reward_type text not null default 'service',
  active boolean not null default true,
  stock integer null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.loyalty_rewards_catalog (title, description, points_cost, reward_type, active, stock, metadata)
values
  ('Cerveja cortesia', 'Resgate no atendimento presencial.', 500, 'perk', true, null, '{}'::jsonb),
  ('50% OFF na Barba', 'Válido para o próximo atendimento.', 1500, 'discount', true, null, '{}'::jsonb),
  ('Corte grátis', 'Aplicável em qualquer parceiro ativo.', 2500, 'service', true, null, '{}'::jsonb)
on conflict do nothing;

alter table public.loyalty_rewards_catalog enable row level security;

drop policy if exists "Loyalty rewards catalog read public" on public.loyalty_rewards_catalog;
create policy "Loyalty rewards catalog read public"
  on public.loyalty_rewards_catalog
  for select
  using (active = true);

create table if not exists public.loyalty_reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reward_id uuid not null references public.loyalty_rewards_catalog(id) on delete restrict,
  points_spent integer not null,
  status text not null default 'redeemed' check (status in ('redeemed', 'cancelled')),
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_loyalty_redemptions_user_created
  on public.loyalty_reward_redemptions (user_id, created_at desc);

alter table public.loyalty_reward_redemptions enable row level security;

drop policy if exists "Users can read own redemptions" on public.loyalty_reward_redemptions;
create policy "Users can read own redemptions"
  on public.loyalty_reward_redemptions
  for select
  using (auth.uid() = user_id);

create table if not exists public.loyalty_friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  friend_user_id uuid not null,
  friend_label text null,
  status text not null default 'accepted' check (status in ('accepted', 'blocked')),
  created_at timestamptz not null default now(),
  unique (user_id, friend_user_id)
);

create index if not exists idx_loyalty_friendships_user
  on public.loyalty_friendships (user_id, created_at desc);

alter table public.loyalty_friendships enable row level security;

drop policy if exists "Users can read own friendships" on public.loyalty_friendships;
create policy "Users can read own friendships"
  on public.loyalty_friendships
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own friendships" on public.loyalty_friendships;
create policy "Users can insert own friendships"
  on public.loyalty_friendships
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own friendships" on public.loyalty_friendships;
create policy "Users can update own friendships"
  on public.loyalty_friendships
  for update
  using (auth.uid() = user_id);

create or replace function public.redeem_loyalty_reward(
  p_user_id uuid,
  p_reward_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  reward_row record;
  summary_row record;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not allowed';
  end if;

  select * into reward_row
  from public.loyalty_rewards_catalog
  where id = p_reward_id
    and active = true
  limit 1;

  if reward_row.id is null then
    return false;
  end if;

  if reward_row.stock is not null and reward_row.stock <= 0 then
    return false;
  end if;

  select * into summary_row
  from public.get_loyalty_summary(p_user_id)
  limit 1;

  if coalesce(summary_row.total_points, 0) < reward_row.points_cost then
    return false;
  end if;

  insert into public.loyalty_points_ledger (user_id, points, direction, source, description, metadata)
  values (
    p_user_id,
    reward_row.points_cost,
    'debit',
    'loyalty_redeem',
    format('Resgate de recompensa: %s', reward_row.title),
    jsonb_build_object('reward_id', reward_row.id::text)
  );

  insert into public.loyalty_reward_redemptions (user_id, reward_id, points_spent, metadata)
  values (
    p_user_id,
    reward_row.id,
    reward_row.points_cost,
    jsonb_build_object('reward_title', reward_row.title)
  );

  if reward_row.stock is not null then
    update public.loyalty_rewards_catalog
    set stock = greatest(stock - 1, 0)
    where id = reward_row.id;
  end if;

  return true;
end;
$$;

grant execute on function public.redeem_loyalty_reward(uuid, uuid) to authenticated;

create or replace function public.add_loyalty_friend_by_code(
  p_user_id uuid,
  p_friend_code text,
  p_friend_label text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid;
  label_to_store text;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not allowed';
  end if;

  select user_id into target_user
  from public.referral_codes
  where code = upper(trim(p_friend_code))
    and active = true
  limit 1;

  if target_user is null or target_user = p_user_id then
    return false;
  end if;

  label_to_store := nullif(trim(coalesce(p_friend_label, '')), '');

  insert into public.loyalty_friendships (user_id, friend_user_id, friend_label, status)
  values (p_user_id, target_user, label_to_store, 'accepted')
  on conflict (user_id, friend_user_id) do update
  set friend_label = coalesce(excluded.friend_label, public.loyalty_friendships.friend_label),
      status = 'accepted';

  insert into public.loyalty_friendships (user_id, friend_user_id, friend_label, status)
  values (target_user, p_user_id, null, 'accepted')
  on conflict (user_id, friend_user_id) do update
  set status = 'accepted';

  return true;
end;
$$;

grant execute on function public.add_loyalty_friend_by_code(uuid, text, text) to authenticated;

create or replace function public.get_loyalty_friends_ranking(
  p_user_id uuid
)
returns table (
  friend_user_id uuid,
  friend_label text,
  total_points integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    f.friend_user_id,
    coalesce(f.friend_label, 'Amigo') as friend_label,
    coalesce(sum(case when l.direction = 'credit' then l.points else -l.points end), 0)::integer as total_points
  from public.loyalty_friendships f
  left join public.loyalty_points_ledger l
    on l.user_id = f.friend_user_id
  where f.user_id = p_user_id
    and f.status = 'accepted'
  group by f.friend_user_id, f.friend_label
  order by total_points desc, f.friend_user_id;
$$;

grant execute on function public.get_loyalty_friends_ranking(uuid) to authenticated;
