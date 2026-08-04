-- User feedback submitted from /feedback (and in-app links)
-- Run in Supabase SQL Editor

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  user_role text not null default 'visitor',
  feedback_type text not null default 'general',
  rating smallint,
  subject text,
  message text not null,
  page_url text,
  status text not null default 'new',
  admin_notes text,
  created_at timestamptz not null default now()
);

create index if not exists user_feedback_created_at_idx
  on public.user_feedback (created_at desc);

create index if not exists user_feedback_status_idx
  on public.user_feedback (status);

alter table public.user_feedback enable row level security;
revoke all on public.user_feedback from anon, authenticated;
