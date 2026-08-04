-- Full CRM upgrade — run after employee-platform.sql

alter table public.employee_leads
  add column if not exists lead_type text not null default 'carrier';

alter table public.employee_leads
  add column if not exists next_follow_up date;

alter table public.employee_leads
  add column if not exists lead_source text default 'cold_call';

alter table public.employee_leads
  add column if not exists region text;

alter table public.employee_leads
  add column if not exists linkedin_url text;

alter table public.employee_leads
  add column if not exists last_activity_at timestamptz;

alter table public.employee_leads
  add column if not exists assigned_by uuid references public.profiles(id);

create index if not exists employee_leads_follow_up_idx
  on public.employee_leads (employee_id, next_follow_up);

create index if not exists employee_leads_region_idx
  on public.employee_leads (employee_id, region);

-- Activity timeline per lead
create table if not exists public.employee_lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.employee_leads(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  activity_type text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists employee_lead_activities_lead_idx
  on public.employee_lead_activities (lead_id, created_at desc);

alter table public.employee_lead_activities enable row level security;

drop policy if exists "Employees manage lead activities" on public.employee_lead_activities;
create policy "Employees manage lead activities"
  on public.employee_lead_activities for all to authenticated
  using (employee_id = auth.uid() or public.is_platform_admin())
  with check (employee_id = auth.uid() or public.is_platform_admin());
