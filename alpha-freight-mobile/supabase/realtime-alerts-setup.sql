-- Enable Supabase Realtime for mobile carrier alerts
-- Run once in Supabase SQL Editor (Dashboard → Database → SQL)

alter table public.loads replica identity full;
alter table public.bids replica identity full;
alter table public.user_notifications replica identity full;
alter table public.feed_notifications replica identity full;
alter table public.carrier_wallet_payouts replica identity full;
alter table public.profiles replica identity full;

-- Add tables to Realtime publication (ignore error if already added)
alter publication supabase_realtime add table public.loads;
alter publication supabase_realtime add table public.bids;
alter publication supabase_realtime add table public.user_notifications;
alter publication supabase_realtime add table public.feed_notifications;
alter publication supabase_realtime add table public.carrier_wallet_payouts;
alter publication supabase_realtime add table public.profiles;
