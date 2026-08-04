-- Run in Supabase SQL Editor after supplier-platform.sql (+ supplier-platform-rls-fix.sql).
-- Enables carrier instant book, my-loads status updates, and my-bids load detail reads.

-- ---------------------------------------------------------------------------
-- Helper: carrier has bid on a load (avoids RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.auth_carrier_has_bid_on_load(load_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.bids
    where load_id = load_uuid
      and carrier_id = auth.uid()
  );
$$;

grant execute on function public.auth_carrier_has_bid_on_load(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- loads: carrier SELECT for my-bids join (any load status)
-- ---------------------------------------------------------------------------
drop policy if exists "Carriers read loads with own bids" on public.loads;
create policy "Carriers read loads with own bids"
  on public.loads for select to authenticated
  using (public.auth_carrier_has_bid_on_load(id));

-- ---------------------------------------------------------------------------
-- loads: carrier UPDATE — instant book (active → booked)
-- ---------------------------------------------------------------------------
drop policy if exists "Carriers claim marketplace loads" on public.loads;
create policy "Carriers claim marketplace loads"
  on public.loads for update to authenticated
  using (
    status in ('active', 'available')
    and coalesce(payment_state, 'pending') = 'paid'
    and (carrier_id is null or carrier_id = auth.uid())
  )
  with check (
    carrier_id = auth.uid()
    and status in ('booked', 'in-transit', 'completed', 'delivered')
  );

-- ---------------------------------------------------------------------------
-- loads: carrier UPDATE — assigned shipment progression
-- ---------------------------------------------------------------------------
drop policy if exists "Carriers update assigned loads" on public.loads;
create policy "Carriers update assigned loads"
  on public.loads for update to authenticated
  using (carrier_id = auth.uid())
  with check (carrier_id = auth.uid());

-- ---------------------------------------------------------------------------
-- bids: carrier rejects competing bids after instant book / self-accept
-- ---------------------------------------------------------------------------
drop policy if exists "Carriers finalize bids on claimed loads" on public.bids;
create policy "Carriers finalize bids on claimed loads"
  on public.bids for update to authenticated
  using (
    exists (
      select 1
      from public.bids own
      where own.load_id = bids.load_id
        and own.carrier_id = auth.uid()
        and own.status = 'accepted'
    )
  )
  with check (true);
