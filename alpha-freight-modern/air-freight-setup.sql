-- Air freight marketplace tables (shipments, bookings, lanes).
-- Run in Supabase SQL Editor. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Profiles: transport mode for air/road/ship separation
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists transport_mode text default 'road';

-- ---------------------------------------------------------------------------
-- Air shipments (shipper posts)
-- ---------------------------------------------------------------------------
create table if not exists public.air_shipments (
  id uuid primary key default gen_random_uuid(),
  shipper_id uuid not null references auth.users(id) on delete cascade,
  forwarder_id uuid references auth.users(id) on delete set null,
  awb text not null unique,
  origin text not null,
  destination text not null,
  weight_kg numeric(12, 2) not null,
  cargo_type text not null,
  status text not null default 'pending'
    check (status in ('pending', 'booked', 'in_transit', 'delivered')),
  rate text,
  estimated_quote text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists air_shipments_shipper_idx on public.air_shipments (shipper_id, created_at desc);
create index if not exists air_shipments_status_idx on public.air_shipments (status, created_at desc);
create index if not exists air_shipments_forwarder_idx on public.air_shipments (forwarder_id, created_at desc);
create index if not exists air_shipments_awb_idx on public.air_shipments (awb);

-- ---------------------------------------------------------------------------
-- Air bookings (forwarder accepts AWB)
-- ---------------------------------------------------------------------------
create table if not exists public.air_bookings (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.air_shipments(id) on delete cascade,
  forwarder_id uuid not null references auth.users(id) on delete cascade,
  awb text not null,
  route text not null,
  weight text,
  rate text not null,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'in_transit', 'completed')),
  booked_at timestamptz not null default now(),
  unique (shipment_id)
);

create index if not exists air_bookings_forwarder_idx on public.air_bookings (forwarder_id, booked_at desc);
create index if not exists air_bookings_awb_idx on public.air_bookings (awb);

-- ---------------------------------------------------------------------------
-- Air lanes (forwarder published rates)
-- ---------------------------------------------------------------------------
create table if not exists public.air_lanes (
  id uuid primary key default gen_random_uuid(),
  forwarder_id uuid not null references auth.users(id) on delete cascade,
  route text not null,
  rate_per_kg text not null,
  frequency text not null default 'Weekly',
  created_at timestamptz not null default now()
);

create index if not exists air_lanes_forwarder_idx on public.air_lanes (forwarder_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------
create or replace function public.auth_user_owns_air_shipment(shipment_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.air_shipments
    where id = shipment_uuid and shipper_id = auth.uid()
  );
$$;

grant execute on function public.auth_user_owns_air_shipment(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: air_shipments
-- ---------------------------------------------------------------------------
alter table public.air_shipments enable row level security;

drop policy if exists "Shippers read own air shipments" on public.air_shipments;
create policy "Shippers read own air shipments"
  on public.air_shipments for select to authenticated
  using (shipper_id = auth.uid());

drop policy if exists "Forwarders read marketplace air shipments" on public.air_shipments;
create policy "Forwarders read marketplace air shipments"
  on public.air_shipments for select to authenticated
  using (status = 'pending' or forwarder_id = auth.uid());

drop policy if exists "Shippers insert air shipments" on public.air_shipments;
create policy "Shippers insert air shipments"
  on public.air_shipments for insert to authenticated
  with check (shipper_id = auth.uid());

drop policy if exists "Shippers update own air shipments" on public.air_shipments;
create policy "Shippers update own air shipments"
  on public.air_shipments for update to authenticated
  using (shipper_id = auth.uid())
  with check (shipper_id = auth.uid());

drop policy if exists "Forwarders accept pending air shipments" on public.air_shipments;
create policy "Forwarders accept pending air shipments"
  on public.air_shipments for update to authenticated
  using (status = 'pending')
  with check (forwarder_id = auth.uid() and status = 'booked');

drop policy if exists "Forwarders update assigned air shipments" on public.air_shipments;
create policy "Forwarders update assigned air shipments"
  on public.air_shipments for update to authenticated
  using (forwarder_id = auth.uid())
  with check (forwarder_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS: air_bookings
-- ---------------------------------------------------------------------------
alter table public.air_bookings enable row level security;

drop policy if exists "Forwarders read own air bookings" on public.air_bookings;
create policy "Forwarders read own air bookings"
  on public.air_bookings for select to authenticated
  using (forwarder_id = auth.uid());

drop policy if exists "Shippers read bookings on their shipments" on public.air_bookings;
create policy "Shippers read bookings on their shipments"
  on public.air_bookings for select to authenticated
  using (public.auth_user_owns_air_shipment(shipment_id));

drop policy if exists "Forwarders insert air bookings" on public.air_bookings;
create policy "Forwarders insert air bookings"
  on public.air_bookings for insert to authenticated
  with check (forwarder_id = auth.uid());

drop policy if exists "Forwarders update own air bookings" on public.air_bookings;
create policy "Forwarders update own air bookings"
  on public.air_bookings for update to authenticated
  using (forwarder_id = auth.uid())
  with check (forwarder_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS: air_lanes
-- ---------------------------------------------------------------------------
alter table public.air_lanes enable row level security;

drop policy if exists "Forwarders manage own air lanes" on public.air_lanes;
create policy "Forwarders manage own air lanes"
  on public.air_lanes for all to authenticated
  using (forwarder_id = auth.uid())
  with check (forwarder_id = auth.uid());

drop policy if exists "Authenticated read air lanes" on public.air_lanes;
create policy "Authenticated read air lanes"
  on public.air_lanes for select to authenticated
  using (true);
