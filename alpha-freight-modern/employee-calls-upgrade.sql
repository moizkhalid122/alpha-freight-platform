-- Call logging fields — run after employee-platform.sql

alter table public.employee_calls
  add column if not exists company_name text;

alter table public.employee_calls
  add column if not exists contact_phone text;

alter table public.employee_calls
  add column if not exists call_type text default 'outbound_sales';

create index if not exists employee_calls_called_at_idx
  on public.employee_calls (employee_id, called_at desc);
