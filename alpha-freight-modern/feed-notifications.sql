-- Run this in Supabase SQL editor for cross-device follow notifications.

create table if not exists public.feed_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null,
  recipient_profile_key text,
  actor_id uuid,
  actor_name text not null,
  actor_avatar text,
  actor_role text,
  actor_profile_key text,
  notification_type text not null default 'follow',
  message text not null default 'started following you',
  href text,
  created_at timestamptz not null default now()
);

create index if not exists feed_notifications_recipient_id_idx
  on public.feed_notifications (recipient_id, created_at desc);

alter table public.feed_notifications enable row level security;

drop policy if exists "Users can read their notifications" on public.feed_notifications;
create policy "Users can read their notifications"
  on public.feed_notifications
  for select
  using (auth.uid() = recipient_id);

drop policy if exists "Authenticated users can create notifications" on public.feed_notifications;
create policy "Authenticated users can create notifications"
  on public.feed_notifications
  for insert
  with check (auth.uid() = actor_id);

grant usage on schema public to authenticated;
grant select, insert on public.feed_notifications to authenticated;
