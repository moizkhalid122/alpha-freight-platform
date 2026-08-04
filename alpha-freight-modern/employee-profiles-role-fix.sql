-- Allow employee accounts on public.profiles — run once in Supabase SQL Editor
-- Fixes: new row for relation "profiles" violates check constraint "profiles_role_check"

alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles add constraint profiles_role_check
  check (role in ('supplier', 'carrier', 'admin', 'driver', 'employee'));
