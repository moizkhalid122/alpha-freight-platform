-- Phase 2: persist onboarding extras + platform settings in Supabase.
-- Run after supplier-platform.sql and admin-rls-setup.sql.

-- ---------------------------------------------------------------------------
-- profiles.profile_extras — carrier/supplier onboarding JSON
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists profile_extras jsonb not null default '{}'::jsonb;

create index if not exists profiles_profile_extras_gin_idx
  on public.profiles using gin (profile_extras);

-- ---------------------------------------------------------------------------
-- platform_settings — singleton admin configuration row
-- ---------------------------------------------------------------------------
create table if not exists public.platform_settings (
  id text primary key default 'default',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.platform_settings (id, settings)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

drop policy if exists "Authenticated read platform settings" on public.platform_settings;
create policy "Authenticated read platform settings"
  on public.platform_settings for select to authenticated
  using (true);

drop policy if exists "Admins update platform settings" on public.platform_settings;
create policy "Admins update platform settings"
  on public.platform_settings for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Admins insert platform settings" on public.platform_settings;
create policy "Admins insert platform settings"
  on public.platform_settings for insert to authenticated
  with check (public.is_platform_admin());

-- Users may update their own profile_extras via existing profile update policies.
-- Admins may update any profile via admin-rls-setup.sql policies.
