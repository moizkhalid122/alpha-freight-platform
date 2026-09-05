-- Profile verification columns for carrier/supplier onboarding.
-- Run in Supabase SQL Editor (safe to re-run).

alter table public.profiles add column if not exists verification_status text default 'pending';
alter table public.profiles add column if not exists is_approved boolean default false;
alter table public.profiles add column if not exists status text default 'pending';

create index if not exists profiles_verification_status_idx
  on public.profiles (role, verification_status, created_at desc);
