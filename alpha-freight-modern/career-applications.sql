-- Career applications submitted from /career/[slug]
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.career_applications (
  id uuid primary key default gen_random_uuid(),
  role_slug text not null,
  role_title text not null,
  full_name text not null,
  email text not null,
  phone text,
  linkedin text,
  portfolio text,
  cover_letter text not null,
  created_at timestamptz not null default now()
);

create index if not exists career_applications_created_at_idx
  on public.career_applications (created_at desc);

alter table public.career_applications enable row level security;

-- No public read; inserts go through Next.js API using service role.
revoke all on public.career_applications from anon, authenticated;
