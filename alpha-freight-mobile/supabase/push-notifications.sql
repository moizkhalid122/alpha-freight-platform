-- Run in Supabase SQL editor for mobile push + in-app notifications.

create table if not exists public.push_device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expo_push_token text not null,
  platform text,
  device_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create index if not exists push_device_tokens_user_id_idx
  on public.push_device_tokens (user_id, is_active);

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_id_idx
  on public.user_notifications (user_id, created_at desc);

alter table public.push_device_tokens enable row level security;
alter table public.user_notifications enable row level security;

drop policy if exists "Users manage own push tokens" on public.push_device_tokens;
create policy "Users manage own push tokens"
  on public.push_device_tokens
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users read own notifications" on public.user_notifications;
create policy "Users read own notifications"
  on public.user_notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users update own notifications" on public.user_notifications;
create policy "Users update own notifications"
  on public.user_notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.push_device_tokens to authenticated;
grant select on public.push_device_tokens to service_role;
grant select, update on public.user_notifications to authenticated;

-- Server (service role) inserts notification rows when admin verifies a carrier.
grant insert on public.user_notifications to service_role;
