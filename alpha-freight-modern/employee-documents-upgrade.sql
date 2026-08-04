-- Document library fields — run after employee-platform.sql

alter table public.employee_documents
  add column if not exists description text;

alter table public.employee_documents
  add column if not exists file_name text;

alter table public.employee_documents
  add column if not exists file_size_kb integer;

alter table public.employee_documents
  add column if not exists is_required boolean not null default false;

create index if not exists employee_documents_category_idx
  on public.employee_documents (category, created_at desc);
