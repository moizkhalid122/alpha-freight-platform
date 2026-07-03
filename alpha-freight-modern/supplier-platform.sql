-- Run in Supabase SQL Editor for supplier marketplace (loads, bids, payments).
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS.

-- ---------------------------------------------------------------------------
-- Loads table (extend or create)
-- ---------------------------------------------------------------------------
create table if not exists public.loads (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references auth.users(id) on delete cascade,
  carrier_id uuid references auth.users(id) on delete set null,
  status text not null default 'active',
  origin text,
  destination text,
  price numeric(12, 2),
  weight text,
  equipment text,
  pickup_date date,
  delivery_date date,
  title text,
  commodity text,
  notes text,
  payment_route text default 'pay-later',
  payment_state text default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.loads add column if not exists supplier_id uuid references auth.users(id) on delete cascade;
alter table public.loads add column if not exists carrier_id uuid references auth.users(id) on delete set null;
alter table public.loads add column if not exists title text;
alter table public.loads add column if not exists commodity text;
alter table public.loads add column if not exists notes text;
alter table public.loads add column if not exists payment_route text default 'pay-later';
alter table public.loads add column if not exists payment_state text default 'pending';
alter table public.loads add column if not exists updated_at timestamptz default now();
alter table public.loads add column if not exists pod_url text;
alter table public.loads add column if not exists pod_name text;
alter table public.loads add column if not exists pod_uploaded_at timestamptz;
alter table public.loads add column if not exists pod_verification_status text;
alter table public.loads add column if not exists pod_review_note text;
alter table public.loads add column if not exists pod_verified_at timestamptz;

create index if not exists loads_supplier_id_idx on public.loads (supplier_id, created_at desc);
create index if not exists loads_carrier_id_idx on public.loads (carrier_id, created_at desc);
create index if not exists loads_status_idx on public.loads (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Bids table
-- ---------------------------------------------------------------------------
create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads(id) on delete cascade,
  carrier_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12, 2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bids add column if not exists updated_at timestamptz default now();

create index if not exists bids_load_id_idx on public.bids (load_id, created_at desc);
create index if not exists bids_carrier_id_idx on public.bids (carrier_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Supplier payments (replaces browser localStorage)
-- ---------------------------------------------------------------------------
create table if not exists public.supplier_payments (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads(id) on delete cascade,
  supplier_id uuid not null references auth.users(id) on delete cascade,
  payment_route text not null check (payment_route in ('pay-now', 'pay-later')),
  payment_state text not null default 'pending' check (payment_state in ('pending', 'paid', 'failed', 'refunded')),
  amount numeric(12, 2) not null default 0,
  currency text not null default 'gbp',
  title text,
  origin text,
  destination text,
  equipment text,
  due_label text,
  payment_method text,
  card_brand text,
  card_last4 text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (load_id, supplier_id)
);

create index if not exists supplier_payments_supplier_idx on public.supplier_payments (supplier_id, created_at desc);
create index if not exists supplier_payments_state_idx on public.supplier_payments (payment_state);

-- ---------------------------------------------------------------------------
-- RLS helpers (avoid infinite recursion between loads <-> bids policies)
-- ---------------------------------------------------------------------------
create or replace function public.auth_user_owns_load(load_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.loads
    where id = load_uuid and supplier_id = auth.uid()
  );
$$;

grant execute on function public.auth_user_owns_load(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: loads
-- ---------------------------------------------------------------------------
alter table public.loads enable row level security;

drop policy if exists "Suppliers read own loads" on public.loads;
create policy "Suppliers read own loads"
  on public.loads for select to authenticated
  using (auth.uid() = supplier_id);

drop policy if exists "Carriers read marketplace loads" on public.loads;
drop policy if exists "Authenticated read marketplace loads" on public.loads;
create policy "Authenticated read marketplace loads"
  on public.loads for select to authenticated
  using (
    status in ('active', 'available')
    and coalesce(payment_state, 'pending') = 'paid'
  );

drop policy if exists "Participants read assigned loads" on public.loads;
create policy "Participants read assigned loads"
  on public.loads for select to authenticated
  using (carrier_id = auth.uid());

drop policy if exists "Suppliers insert own loads" on public.loads;
create policy "Suppliers insert own loads"
  on public.loads for insert to authenticated
  with check (auth.uid() = supplier_id);

drop policy if exists "Suppliers update own loads" on public.loads;
create policy "Suppliers update own loads"
  on public.loads for update to authenticated
  using (auth.uid() = supplier_id)
  with check (auth.uid() = supplier_id);

-- ---------------------------------------------------------------------------
-- RLS: bids
-- ---------------------------------------------------------------------------
alter table public.bids enable row level security;

drop policy if exists "Carriers insert bids" on public.bids;
create policy "Carriers insert bids"
  on public.bids for insert to authenticated
  with check (auth.uid() = carrier_id);

drop policy if exists "Carriers read own bids" on public.bids;
create policy "Carriers read own bids"
  on public.bids for select to authenticated
  using (auth.uid() = carrier_id);

drop policy if exists "Suppliers read bids on their loads" on public.bids;
create policy "Suppliers read bids on their loads"
  on public.bids for select to authenticated
  using (public.auth_user_owns_load(load_id));

drop policy if exists "Suppliers update bids on their loads" on public.bids;
create policy "Suppliers update bids on their loads"
  on public.bids for update to authenticated
  using (public.auth_user_owns_load(load_id));

drop policy if exists "Carriers update own bids" on public.bids;
create policy "Carriers update own bids"
  on public.bids for update to authenticated
  using (auth.uid() = carrier_id);

-- ---------------------------------------------------------------------------
-- RLS: supplier_payments
-- ---------------------------------------------------------------------------
alter table public.supplier_payments enable row level security;

drop policy if exists "Suppliers read own payments" on public.supplier_payments;
create policy "Suppliers read own payments"
  on public.supplier_payments for select to authenticated
  using (auth.uid() = supplier_id);

drop policy if exists "Suppliers insert own payments" on public.supplier_payments;
create policy "Suppliers insert own payments"
  on public.supplier_payments for insert to authenticated
  with check (auth.uid() = supplier_id);

drop policy if exists "Suppliers update own payments" on public.supplier_payments;
create policy "Suppliers update own payments"
  on public.supplier_payments for update to authenticated
  using (auth.uid() = supplier_id)
  with check (auth.uid() = supplier_id);

grant select, insert, update on public.loads to authenticated;
grant select, insert, update on public.bids to authenticated;
grant select, insert, update on public.supplier_payments to authenticated;
