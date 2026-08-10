-- Supplier cancellation & refund system
-- Run in Supabase SQL Editor after supplier-platform.sql

-- ---------------------------------------------------------------------------
-- Load cancellation columns
-- ---------------------------------------------------------------------------
alter table public.loads add column if not exists cancelled_at timestamptz;
alter table public.loads add column if not exists cancellation_reason text;
alter table public.loads add column if not exists cancelled_by uuid references auth.users(id) on delete set null;

create index if not exists loads_cancelled_idx on public.loads (supplier_id, cancelled_at desc)
  where cancelled_at is not null;

-- ---------------------------------------------------------------------------
-- Supplier payment refund tracking
-- ---------------------------------------------------------------------------
alter table public.supplier_payments add column if not exists stripe_refund_id text;
alter table public.supplier_payments add column if not exists refunded_at timestamptz;
alter table public.supplier_payments add column if not exists refund_amount numeric(12, 2);

-- ---------------------------------------------------------------------------
-- Cancellation / dispute requests
-- ---------------------------------------------------------------------------
create table if not exists public.load_cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads(id) on delete cascade,
  supplier_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null default 'cancellation'
    check (request_type in ('cancellation', 'dispute')),
  cancellation_stage text not null
    check (cancellation_stage in ('before_acceptance', 'after_acceptance', 'in_transit', 'completed', 'dispute')),
  reason text not null,
  reason_detail text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'processing', 'completed', 'failed')),
  refund_type text
    check (refund_type is null or refund_type in ('full', 'partial', 'none', 'manual_review')),
  original_amount numeric(12, 2),
  refund_amount numeric(12, 2),
  deduction_amount numeric(12, 2) default 0,
  deduction_reason text,
  admin_note text,
  stripe_refund_id text,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists load_cancellation_requests_load_idx
  on public.load_cancellation_requests (load_id, created_at desc);
create index if not exists load_cancellation_requests_supplier_idx
  on public.load_cancellation_requests (supplier_id, created_at desc);
create index if not exists load_cancellation_requests_status_idx
  on public.load_cancellation_requests (status, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS: load_cancellation_requests
-- ---------------------------------------------------------------------------
alter table public.load_cancellation_requests enable row level security;

drop policy if exists "Suppliers read own cancellation requests" on public.load_cancellation_requests;
create policy "Suppliers read own cancellation requests"
  on public.load_cancellation_requests for select to authenticated
  using (auth.uid() = supplier_id);

drop policy if exists "Suppliers insert own cancellation requests" on public.load_cancellation_requests;
create policy "Suppliers insert own cancellation requests"
  on public.load_cancellation_requests for insert to authenticated
  with check (auth.uid() = supplier_id);

grant select, insert on public.load_cancellation_requests to authenticated;

-- Admin access via service role or admin-rls-setup.sql is_platform_admin()
