-- Employee document storage — run in Supabase SQL Editor (once)
-- Required for profile photo, CV, and ID uploads during onboarding

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
