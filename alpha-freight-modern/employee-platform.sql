-- Employee HR workspace — run in Supabase SQL Editor after admin-rls-setup.sql
-- Set employee role: update public.profiles set role = 'employee' where id = '<uuid>';

create or replace function public.is_employee()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and lower(coalesce(role, '')) = 'employee'
  );
$$;

grant execute on function public.is_employee() to authenticated;

-- ---------------------------------------------------------------------------
-- employee_profiles — HR metadata linked to auth profile
-- ---------------------------------------------------------------------------
create table if not exists public.employee_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  employee_code text unique,
  department text,
  job_title text,
  status text not null default 'active',
  hire_date date,
  manager_id uuid references public.profiles(id),
  commission_rate numeric(5, 2) not null default 0,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_profiles_status_idx on public.employee_profiles (status);

-- ---------------------------------------------------------------------------
-- employee_tasks
-- ---------------------------------------------------------------------------
create table if not exists public.employee_tasks (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending',
  priority text not null default 'medium',
  due_date date,
  created_at timestamptz not null default now()
);

create index if not exists employee_tasks_employee_idx on public.employee_tasks (employee_id, status);

-- ---------------------------------------------------------------------------
-- employee_leads
-- ---------------------------------------------------------------------------
create table if not exists public.employee_leads (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  status text not null default 'new',
  value_gbp numeric(12, 2),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists employee_leads_employee_idx on public.employee_leads (employee_id, status);

-- ---------------------------------------------------------------------------
-- employee_calls
-- ---------------------------------------------------------------------------
create table if not exists public.employee_calls (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  lead_id uuid references public.employee_leads(id) on delete set null,
  direction text not null default 'outbound',
  duration_minutes integer,
  outcome text,
  notes text,
  called_at timestamptz not null default now()
);

create index if not exists employee_calls_employee_idx on public.employee_calls (employee_id, called_at desc);

-- ---------------------------------------------------------------------------
-- employee_commissions
-- ---------------------------------------------------------------------------
create table if not exists public.employee_commissions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  lead_id uuid references public.employee_leads(id) on delete set null,
  amount_gbp numeric(12, 2) not null,
  status text not null default 'pending',
  period_month date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists employee_commissions_employee_idx
  on public.employee_commissions (employee_id, status);

-- ---------------------------------------------------------------------------
-- employee_documents
-- ---------------------------------------------------------------------------
create table if not exists public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  category text not null default 'other',
  file_url text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists employee_documents_employee_idx on public.employee_documents (employee_id);

-- ---------------------------------------------------------------------------
-- employee_training
-- ---------------------------------------------------------------------------
create table if not exists public.employee_training (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  module_title text not null,
  status text not null default 'not_started',
  progress_pct integer not null default 0,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists employee_training_employee_idx on public.employee_training (employee_id);

-- ---------------------------------------------------------------------------
-- employee_leave_requests
-- ---------------------------------------------------------------------------
create table if not exists public.employee_leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists employee_leave_employee_idx
  on public.employee_leave_requests (employee_id, status);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.employee_profiles enable row level security;
alter table public.employee_tasks enable row level security;
alter table public.employee_leads enable row level security;
alter table public.employee_calls enable row level security;
alter table public.employee_commissions enable row level security;
alter table public.employee_documents enable row level security;
alter table public.employee_training enable row level security;
alter table public.employee_leave_requests enable row level security;

-- employee_profiles
drop policy if exists "Employees read own profile" on public.employee_profiles;
create policy "Employees read own profile"
  on public.employee_profiles for select to authenticated
  using (id = auth.uid() or public.is_platform_admin());

drop policy if exists "Admins manage employee profiles" on public.employee_profiles;
create policy "Admins manage employee profiles"
  on public.employee_profiles for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- employee_tasks
drop policy if exists "Employees manage own tasks" on public.employee_tasks;
create policy "Employees manage own tasks"
  on public.employee_tasks for all to authenticated
  using (employee_id = auth.uid() or public.is_platform_admin())
  with check (employee_id = auth.uid() or public.is_platform_admin());

-- employee_leads
drop policy if exists "Employees manage own leads" on public.employee_leads;
create policy "Employees manage own leads"
  on public.employee_leads for all to authenticated
  using (employee_id = auth.uid() or public.is_platform_admin())
  with check (employee_id = auth.uid() or public.is_platform_admin());

-- employee_calls
drop policy if exists "Employees manage own calls" on public.employee_calls;
create policy "Employees manage own calls"
  on public.employee_calls for all to authenticated
  using (employee_id = auth.uid() or public.is_platform_admin())
  with check (employee_id = auth.uid() or public.is_platform_admin());

-- employee_commissions — employees read only
drop policy if exists "Employees read own commission" on public.employee_commissions;
create policy "Employees read own commission"
  on public.employee_commissions for select to authenticated
  using (employee_id = auth.uid() or public.is_platform_admin());

drop policy if exists "Admins manage commission" on public.employee_commissions;
create policy "Admins manage commission"
  on public.employee_commissions for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- employee_documents
drop policy if exists "Employees read documents" on public.employee_documents;
create policy "Employees read documents"
  on public.employee_documents for select to authenticated
  using (employee_id = auth.uid() or employee_id is null or public.is_platform_admin());

drop policy if exists "Admins manage documents" on public.employee_documents;
create policy "Admins manage documents"
  on public.employee_documents for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- employee_training
drop policy if exists "Employees manage own training" on public.employee_training;
create policy "Employees manage own training"
  on public.employee_training for all to authenticated
  using (employee_id = auth.uid() or public.is_platform_admin())
  with check (employee_id = auth.uid() or public.is_platform_admin());

-- employee_leave_requests
drop policy if exists "Employees manage own leave" on public.employee_leave_requests;
create policy "Employees manage own leave"
  on public.employee_leave_requests for all to authenticated
  using (employee_id = auth.uid() or public.is_platform_admin())
  with check (employee_id = auth.uid() or public.is_platform_admin());
