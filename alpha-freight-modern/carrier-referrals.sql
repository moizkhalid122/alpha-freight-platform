-- Run in Supabase SQL Editor for carrier referral tracking.
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS.
-- Requires profiles.referral_code / referred_by_code (from supplier-referrals.sql).

create table if not exists public.carrier_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  referral_code text not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'completed', 'rewarded')),
  reward_amount numeric(12, 2) not null default 50,
  milestone_loads integer not null default 5,
  loads_completed integer not null default 0,
  earned_amount numeric(12, 2) not null default 0,
  rewarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carrier_referrals_referred_user_unique unique (referred_user_id),
  constraint carrier_referrals_no_self_referral check (referrer_id <> referred_user_id)
);

create index if not exists carrier_referrals_referrer_idx
  on public.carrier_referrals (referrer_id, created_at desc);

alter table public.carrier_referrals enable row level security;

drop policy if exists "Referrers can read own carrier referrals" on public.carrier_referrals;
create policy "Referrers can read own carrier referrals"
  on public.carrier_referrals
  for select
  to authenticated
  using (referrer_id = auth.uid());

drop policy if exists "Referred users can read own carrier referral row" on public.carrier_referrals;
create policy "Referred users can read own carrier referral row"
  on public.carrier_referrals
  for select
  to authenticated
  using (referred_user_id = auth.uid());

drop policy if exists "Authenticated users can create carrier referral attribution" on public.carrier_referrals;
create policy "Authenticated users can create carrier referral attribution"
  on public.carrier_referrals
  for insert
  to authenticated
  with check (referred_user_id = auth.uid());

drop policy if exists "Referrers can update own carrier referrals" on public.carrier_referrals;
create policy "Referrers can update own carrier referrals"
  on public.carrier_referrals
  for update
  to authenticated
  using (referrer_id = auth.uid())
  with check (referrer_id = auth.uid());
