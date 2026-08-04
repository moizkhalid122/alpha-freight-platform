-- Employee document storage — run ONCE in Supabase SQL Editor
-- Fixes: "new row violates row-level security policy" on photo/CV/ID upload

-- 1) Create private bucket
insert into storage.buckets (id, name, public)
values ('employee-documents', 'employee-documents', false)
on conflict (id) do nothing;

-- 2) RLS policies (employees upload/read/update only their folder: {userId}/...)
drop policy if exists "Employees upload own documents" on storage.objects;
create policy "Employees upload own documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'employee-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Employees read own documents" on storage.objects;
create policy "Employees read own documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'employee-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Employees update own documents" on storage.objects;
create policy "Employees update own documents"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'employee-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'employee-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Admins read employee documents" on storage.objects;
create policy "Admins read employee documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'employee-documents'
    and public.is_platform_admin()
  );
