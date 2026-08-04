-- Task assignment fields — run after employee-platform.sql

alter table public.employee_tasks
  add column if not exists task_source text not null default 'daily';

alter table public.employee_tasks
  add column if not exists assigned_by uuid references public.profiles(id);

alter table public.employee_tasks
  add column if not exists target_count integer;

create index if not exists employee_tasks_source_idx
  on public.employee_tasks (employee_id, task_source, due_date);
