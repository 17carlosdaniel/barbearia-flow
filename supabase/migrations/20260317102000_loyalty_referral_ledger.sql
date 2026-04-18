-- Loyalty ledger + referral program.

create table if not exists public.loyalty_points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  barbershop_id bigint null,
  points integer not null,
  direction text not null check (direction in ('credit', 'debit')),
  source text not null default 'manual',
  description text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_loyalty_points_ledger_user_created
  on public.loyalty_points_ledger (user_id, created_at desc);

alter table public.loyalty_points_ledger enable row level security;

drop policy if exists "Users can read own loyalty ledger" on public.loyalty_points_ledger;
create policy "Users can read own loyalty ledger"
  on public.loyalty_points_ledger
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own loyalty ledger" on public.loyalty_points_ledger;
create policy "Users can insert own loyalty ledger"
  on public.loyalty_points_ledger
  for insert
  with check (auth.uid() = user_id);

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  code text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_invites (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null,
  referred_email text null,
  referral_code text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_referral_invites_referrer
  on public.referral_invites (referrer_user_id, created_at desc);

create table if not exists public.referral_conversions (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null,
  referred_user_id uuid not null unique,
  referral_code text not null,
  first_service_at timestamptz null,
  status text not null default 'registered' check (status in ('registered', 'qualified', 'rewarded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_referral_conversions_referrer
  on public.referral_conversions (referrer_user_id, created_at desc);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid not null references public.referral_conversions(id) on delete cascade,
  referrer_user_id uuid not null,
  referred_user_id uuid not null,
  referrer_points integer not null default 20,
  referred_points integer not null default 10,
  rewarded_at timestamptz not null default now()
);

alter table public.referral_codes enable row level security;
alter table public.referral_invites enable row level security;
alter table public.referral_conversions enable row level security;
alter table public.referral_rewards enable row level security;

drop policy if exists "Users can read own referral codes" on public.referral_codes;
create policy "Users can read own referral codes"
  on public.referral_codes
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own referral codes" on public.referral_codes;
create policy "Users can insert own referral codes"
  on public.referral_codes
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own referral invites" on public.referral_invites;
create policy "Users can read own referral invites"
  on public.referral_invites
  for select
  using (auth.uid() = referrer_user_id);

drop policy if exists "Users can insert own referral invites" on public.referral_invites;
create policy "Users can insert own referral invites"
  on public.referral_invites
  for insert
  with check (auth.uid() = referrer_user_id);

drop policy if exists "Users can read own referral conversions" on public.referral_conversions;
create policy "Users can read own referral conversions"
  on public.referral_conversions
  for select
  using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

drop policy if exists "Users can read own referral rewards" on public.referral_rewards;
create policy "Users can read own referral rewards"
  on public.referral_rewards
  for select
  using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

create or replace function public.ensure_referral_code(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  existing text;
  generated text;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not allowed';
  end if;

  select code into existing
  from public.referral_codes
  where user_id = p_user_id;
  if existing is not null then
    return existing;
  end if;

  generated := upper(substr(replace(p_user_id::text, '-', ''), 1, 8));
  insert into public.referral_codes (user_id, code, active)
  values (p_user_id, generated, true)
  on conflict (code) do nothing;

  if not found then
    generated := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    insert into public.referral_codes (user_id, code, active)
    values (p_user_id, generated, true)
    on conflict (code) do update set user_id = excluded.user_id;
  end if;

  return generated;
end;
$$;

grant execute on function public.ensure_referral_code(uuid) to authenticated;

create or replace function public.register_referral_by_code(
  p_referred_user_id uuid,
  p_referral_code text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  referrer uuid;
begin
  if auth.uid() is null or auth.uid() <> p_referred_user_id then
    raise exception 'not allowed';
  end if;

  select user_id into referrer
  from public.referral_codes
  where code = upper(trim(p_referral_code))
    and active = true
  limit 1;

  if referrer is null or referrer = p_referred_user_id then
    return false;
  end if;

  insert into public.referral_conversions (
    referrer_user_id,
    referred_user_id,
    referral_code,
    status,
    created_at,
    updated_at
  )
  values (
    referrer,
    p_referred_user_id,
    upper(trim(p_referral_code)),
    'registered',
    now(),
    now()
  )
  on conflict (referred_user_id) do nothing;

  perform public.emit_notification(
    referrer,
    'cliente',
    'loyalty',
    'Indicação registrada',
    'Seu amigo se cadastrou com seu código. Recompensa liberada após o primeiro serviço.',
    'normal',
    'open_loyalty',
    'Ver fidelidade',
    '/cliente/fidelidade',
    jsonb_build_object('referred_user_id', p_referred_user_id::text),
    format('referral_registered_%s', p_referred_user_id::text),
    60
  );

  return true;
end;
$$;

grant execute on function public.register_referral_by_code(uuid, text) to authenticated;

create or replace function public.qualify_referral_conversion(
  p_referred_user_id uuid,
  p_referrer_points integer default 20,
  p_referred_points integer default 10
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  conv record;
begin
  select *
  into conv
  from public.referral_conversions
  where referred_user_id = p_referred_user_id
    and status in ('registered', 'qualified')
  limit 1;

  if conv.id is null then
    return false;
  end if;

  update public.referral_conversions
  set
    first_service_at = coalesce(first_service_at, now()),
    status = 'rewarded',
    updated_at = now()
  where id = conv.id;

  insert into public.referral_rewards (
    conversion_id,
    referrer_user_id,
    referred_user_id,
    referrer_points,
    referred_points,
    rewarded_at
  )
  values (conv.id, conv.referrer_user_id, conv.referred_user_id, p_referrer_points, p_referred_points, now())
  on conflict do nothing;

  insert into public.loyalty_points_ledger (user_id, points, direction, source, description, metadata)
  values
    (conv.referrer_user_id, p_referrer_points, 'credit', 'referral', 'Recompensa por indicação qualificada', jsonb_build_object('conversion_id', conv.id::text)),
    (conv.referred_user_id, p_referred_points, 'credit', 'referral', 'Bônus de boas-vindas por indicação', jsonb_build_object('conversion_id', conv.id::text));

  perform public.emit_notification(
    conv.referrer_user_id,
    'cliente',
    'loyalty',
    'Recompensa de indicação liberada',
    format('Você ganhou +%s pontos por uma indicação qualificada.', p_referrer_points),
    'high',
    'open_loyalty',
    'Ver pontos',
    '/cliente/fidelidade',
    jsonb_build_object('conversion_id', conv.id::text, 'points', p_referrer_points),
    format('referral_reward_referrer_%s', conv.id::text),
    30
  );

  perform public.emit_notification(
    conv.referred_user_id,
    'cliente',
    'loyalty',
    'Bônus de indicação confirmado',
    format('Você ganhou +%s pontos de boas-vindas.', p_referred_points),
    'normal',
    'open_loyalty',
    'Ver pontos',
    '/cliente/fidelidade',
    jsonb_build_object('conversion_id', conv.id::text, 'points', p_referred_points),
    format('referral_reward_referred_%s', conv.id::text),
    30
  );

  return true;
end;
$$;

grant execute on function public.qualify_referral_conversion(uuid, integer, integer) to authenticated;

create or replace function public.get_loyalty_summary(p_user_id uuid)
returns table (
  total_points integer,
  credits integer,
  debits integer
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(sum(case when direction = 'credit' then points else -points end), 0)::integer as total_points,
    coalesce(sum(case when direction = 'credit' then points else 0 end), 0)::integer as credits,
    coalesce(sum(case when direction = 'debit' then points else 0 end), 0)::integer as debits
  from public.loyalty_points_ledger
  where user_id = p_user_id
$$;

grant execute on function public.get_loyalty_summary(uuid) to authenticated;
