-- Website inquiries: contact, support, quote, and partner forms
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.website_inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_type text not null default 'general',
  source_page text,
  full_name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  admin_notes text,
  created_at timestamptz not null default now()
);

create index if not exists website_inquiries_created_at_idx
  on public.website_inquiries (created_at desc);

create index if not exists website_inquiries_status_idx
  on public.website_inquiries (status);

create index if not exists website_inquiries_type_idx
  on public.website_inquiries (inquiry_type);

alter table public.website_inquiries enable row level security;
revoke all on public.website_inquiries from anon, authenticated;
