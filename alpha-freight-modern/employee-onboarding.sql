-- Employee signup & onboarding — run after employee-platform.sql

-- Required: profiles.role must allow 'employee' (fixes profiles_role_check on signup/onboarding)
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('supplier', 'carrier', 'admin', 'driver', 'employee'));

-- Optional: speeds up admin employee list (run admin-profiles-email.sql for full backfill + trigger)
alter table public.profiles add column if not exists email text;

alter table public.employee_profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.employee_profiles add column if not exists profile_photo_url text;
alter table public.employee_profiles add column if not exists address text;
alter table public.employee_profiles add column if not exists cv_url text;
alter table public.employee_profiles add column if not exists id_document_url text;
alter table public.employee_profiles add column if not exists bank_account_name text;
alter table public.employee_profiles add column if not exists bank_sort_code text;
alter table public.employee_profiles add column if not exists bank_account_number text;
alter table public.employee_profiles add column if not exists accepted_nda_at timestamptz;
alter table public.employee_profiles add column if not exists accepted_employment_at timestamptz;
alter table public.employee_profiles add column if not exists accepted_commission_at timestamptz;

-- Employees can create and update their own HR profile (signup + onboarding)
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "Employees insert own profile" on public.employee_profiles;
create policy "Employees insert own profile"
  on public.employee_profiles for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "Employees update own profile" on public.employee_profiles;
create policy "Employees update own profile"
  on public.employee_profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Storage bucket for employee onboarding uploads (run if bucket missing)
insert into storage.buckets (id, name, public)
values ('employee-documents', 'employee-documents', false)
on conflict (id) do nothing;

drop policy if exists "Employees upload own documents" on storage.objects;
create policy "Employees upload own documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'employee-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Employees read own documents" on storage.objects;
create policy "Employees read own documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'employee-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Employees update own documents" on storage.objects;
create policy "Employees update own documents"
  on storage.objects for update to authenticated
  using (bucket_id = 'employee-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'employee-documents' and (storage.foldername(name))[1] = auth.uid()::text);
