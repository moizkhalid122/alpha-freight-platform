-- Run this in Supabase SQL Editor if you already ran supplier-platform.sql
-- and see: "infinite recursion detected in policy for relation loads"

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

drop policy if exists "Suppliers read bids on their loads" on public.bids;
create policy "Suppliers read bids on their loads"
  on public.bids for select to authenticated
  using (public.auth_user_owns_load(load_id));

drop policy if exists "Suppliers update bids on their loads" on public.bids;
create policy "Suppliers update bids on their loads"
  on public.bids for update to authenticated
  using (public.auth_user_owns_load(load_id));
