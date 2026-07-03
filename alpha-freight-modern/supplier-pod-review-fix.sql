-- Run in Supabase SQL Editor if supplier POD approve/reject fails.
-- Safe to re-run.

-- POD review columns on loads
alter table public.loads add column if not exists pod_url text;
alter table public.loads add column if not exists pod_name text;
alter table public.loads add column if not exists pod_uploaded_at timestamptz;
alter table public.loads add column if not exists pod_verification_status text;
alter table public.loads add column if not exists pod_review_note text;
alter table public.loads add column if not exists pod_verified_at timestamptz;
alter table public.loads add column if not exists updated_at timestamptz default now();

-- Supplier must be able to update own loads (POD review + status)
grant select, insert, update on public.loads to authenticated;

drop policy if exists "Suppliers update own loads" on public.loads;
create policy "Suppliers update own loads"
  on public.loads for update to authenticated
  using (auth.uid() = supplier_id)
  with check (auth.uid() = supplier_id);

drop policy if exists "Suppliers read own loads" on public.loads;
create policy "Suppliers read own loads"
  on public.loads for select to authenticated
  using (auth.uid() = supplier_id);

create index if not exists loads_pod_verification_idx
  on public.loads (supplier_id, pod_verification_status, status);
