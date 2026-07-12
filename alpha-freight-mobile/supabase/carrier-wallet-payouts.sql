-- Carrier wallet payouts + notification-friendly indexes
-- Run in Supabase SQL Editor

create table if not exists public.carrier_wallet_payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method text not null default 'bank_transfer',
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'paid', 'failed')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carrier_wallet_payouts_user_idx
  on public.carrier_wallet_payouts (user_id, created_at desc);

alter table public.carrier_wallet_payouts enable row level security;

drop policy if exists "Carriers read own payouts" on public.carrier_wallet_payouts;
create policy "Carriers read own payouts"
  on public.carrier_wallet_payouts
  for select
  using (auth.uid() = user_id);

drop policy if exists "Carriers insert own payouts" on public.carrier_wallet_payouts;
create policy "Carriers insert own payouts"
  on public.carrier_wallet_payouts
  for insert
  with check (auth.uid() = user_id);

create index if not exists loads_carrier_status_idx
  on public.loads (carrier_id, status, updated_at desc);

create index if not exists loads_marketplace_new_idx
  on public.loads (status, created_at desc)
  where carrier_id is null;

create index if not exists bids_carrier_status_idx
  on public.bids (carrier_id, status, updated_at desc);

-- Allow app to log in-app notifications from realtime events
drop policy if exists "Users insert own notifications" on public.user_notifications;
create policy "Users insert own notifications"
  on public.user_notifications
  for insert
  to authenticated
  with check (auth.uid() = user_id);

grant insert on public.user_notifications to authenticated;
