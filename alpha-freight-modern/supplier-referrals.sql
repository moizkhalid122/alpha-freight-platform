-- Run in Supabase SQL Editor for supplier referral tracking.
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS.

alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by_code text;

create unique index if not exists profiles_referral_code_idx
  on public.profiles (referral_code)
  where referral_code is not null;

create table if not exists public.supplier_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  referral_code text not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'completed', 'rewarded')),
  reward_amount numeric(12, 2) not null default 100,
  milestone_loads integer not null default 10,
  loads_completed integer not null default 0,
  earned_amount numeric(12, 2) not null default 0,
  rewarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_referrals_referred_user_unique unique (referred_user_id),
  constraint supplier_referrals_no_self_referral check (referrer_id <> referred_user_id)
);

create index if not exists supplier_referrals_referrer_idx
  on public.supplier_referrals (referrer_id, created_at desc);

alter table public.supplier_referrals enable row level security;

drop policy if exists "Referrers can read own supplier referrals" on public.supplier_referrals;
create policy "Referrers can read own supplier referrals"
  on public.supplier_referrals
  for select
  to authenticated
  using (referrer_id = auth.uid());

drop policy if exists "Referred users can read own referral row" on public.supplier_referrals;
create policy "Referred users can read own referral row"
  on public.supplier_referrals
  for select
  to authenticated
  using (referred_user_id = auth.uid());

drop policy if exists "Authenticated users can create referral attribution" on public.supplier_referrals;
create policy "Authenticated users can create referral attribution"
  on public.supplier_referrals
  for insert
  to authenticated
  with check (referred_user_id = auth.uid());

drop policy if exists "Referrers can update own supplier referrals" on public.supplier_referrals;
create policy "Referrers can update own supplier referrals"
  on public.supplier_referrals
  for update
  to authenticated
  using (referrer_id = auth.uid())
  with check (referrer_id = auth.uid());
