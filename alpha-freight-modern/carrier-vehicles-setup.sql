-- Run in Supabase SQL Editor for carrier My Vehicles (add / list / update).
-- Safe to re-run.

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references auth.users(id) on delete cascade,
  name text,
  status text default 'active',
  profile jsonb,
  created_at timestamptz not null default now()
);

alter table public.vehicles
  add column if not exists profile jsonb;

create index if not exists vehicles_carrier_id_idx
  on public.vehicles (carrier_id, created_at desc);

alter table public.vehicles enable row level security;

drop policy if exists "Carriers read own vehicles" on public.vehicles;
create policy "Carriers read own vehicles"
  on public.vehicles
  for select
  to authenticated
  using (carrier_id = auth.uid());

drop policy if exists "Carriers insert own vehicles" on public.vehicles;
create policy "Carriers insert own vehicles"
  on public.vehicles
  for insert
  to authenticated
  with check (carrier_id = auth.uid());

drop policy if exists "Carriers update own vehicles" on public.vehicles;
create policy "Carriers update own vehicles"
  on public.vehicles
  for update
  to authenticated
  using (carrier_id = auth.uid())
  with check (carrier_id = auth.uid());

drop policy if exists "Carriers delete own vehicles" on public.vehicles;
create policy "Carriers delete own vehicles"
  on public.vehicles
  for delete
  to authenticated
  using (carrier_id = auth.uid());

grant select, insert, update, delete on public.vehicles to authenticated;
