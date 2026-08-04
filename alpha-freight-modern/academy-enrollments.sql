-- Academy enrollment submissions from /enroll and /enroll/bundle
-- Run in Supabase SQL Editor

create table if not exists public.academy_enrollments (
  id uuid primary key default gen_random_uuid(),
  enrollment_type text not null,
  course_id text,
  course_title text not null,
  full_name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now()
);

create index if not exists academy_enrollments_created_at_idx
  on public.academy_enrollments (created_at desc);

alter table public.academy_enrollments enable row level security;
revoke all on public.academy_enrollments from anon, authenticated;
