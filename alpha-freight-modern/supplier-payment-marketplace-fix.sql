-- Run in Supabase SQL Editor after supplier-platform.sql
-- Ensures carriers only see paid, live marketplace loads (not pending-payment drafts).

drop policy if exists "Authenticated read marketplace loads" on public.loads;
create policy "Authenticated read marketplace loads"
  on public.loads for select to authenticated
  using (
    status in ('active', 'available')
    and coalesce(payment_state, 'pending') = 'paid'
  );
