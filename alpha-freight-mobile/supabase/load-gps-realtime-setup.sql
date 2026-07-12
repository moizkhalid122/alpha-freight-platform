-- Add live GPS tracking tables to Supabase Realtime (run after load-live-gps-tracking.sql)

alter table public.load_live_tracking replica identity full;
alter table public.load_location_updates replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.load_live_tracking;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.load_location_updates;
exception
  when duplicate_object then null;
end $$;
