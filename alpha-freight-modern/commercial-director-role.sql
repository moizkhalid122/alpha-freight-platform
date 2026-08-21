-- Allow Commercial Director role on public.profiles — run once in Supabase SQL Editor

alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles add constraint profiles_role_check
  check (role in ('supplier', 'carrier', 'admin', 'driver', 'employee', 'commercial_director'));

-- Optional backfill for Alastair (after auth user exists)
-- insert into public.profiles (id, full_name, role, email)
-- select id, 'Alastair James Massey', 'commercial_director', 'alastair@alphafreightuk.com'
-- from auth.users
-- where email = 'alastair@alphafreightuk.com'
-- on conflict (id) do update set
--   full_name = excluded.full_name,
--   role = excluded.role,
--   email = excluded.email;
