-- Run in Supabase SQL Editor after supplier-platform.sql and carrier RLS fixes.
-- Grants platform admins full read (and limited write) on profiles, loads, bids, and payments.
-- Also supports service-role API routes used by the admin console.

-- ---------------------------------------------------------------------------
-- Admin role on profiles (set manually for your admin user):
--   update public.profiles set role = 'admin' where id = '<your-auth-user-uuid>';
-- ---------------------------------------------------------------------------

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and lower(coalesce(role, '')) = 'admin'
  );
$$;

grant execute on function public.is_platform_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles for select to authenticated
  using (public.is_platform_admin());

drop policy if exists "Admins update all profiles" on public.profiles;
create policy "Admins update all profiles"
  on public.profiles for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Users can still read/update own profile (add if missing)
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- loads — admin read all + update status
-- ---------------------------------------------------------------------------
drop policy if exists "Admins read all loads" on public.loads;
create policy "Admins read all loads"
  on public.loads for select to authenticated
  using (public.is_platform_admin());

drop policy if exists "Admins update all loads" on public.loads;
create policy "Admins update all loads"
  on public.loads for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- bids
-- ---------------------------------------------------------------------------
alter table public.bids enable row level security;

drop policy if exists "Admins read all bids" on public.bids;
create policy "Admins read all bids"
  on public.bids for select to authenticated
  using (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- supplier_payments
-- ---------------------------------------------------------------------------
drop policy if exists "Admins read all supplier payments" on public.supplier_payments;
create policy "Admins read all supplier payments"
  on public.supplier_payments for select to authenticated
  using (public.is_platform_admin());

drop policy if exists "Admins update all supplier payments" on public.supplier_payments;
create policy "Admins update all supplier payments"
  on public.supplier_payments for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
