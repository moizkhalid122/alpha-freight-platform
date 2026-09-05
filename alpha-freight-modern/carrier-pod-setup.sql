-- Run in Supabase SQL Editor for carrier POD uploads (My Loads).
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- loads: POD metadata columns
-- ---------------------------------------------------------------------------
alter table public.loads add column if not exists pod_url text;
alter table public.loads add column if not exists pod_name text;
alter table public.loads add column if not exists pod_uploaded_at timestamptz;
alter table public.loads add column if not exists pod_verification_status text;
alter table public.loads add column if not exists pod_review_note text;
alter table public.loads add column if not exists pod_verified_at timestamptz;

create index if not exists loads_pod_verification_idx
  on public.loads (supplier_id, pod_verification_status, status);

-- Profile avatar/banner: {user_id}/profile-media/...
-- Verification docs (onboarding): {user_id}/verification/...
-- The first folder MUST be auth.uid() for storage RLS.
insert into storage.buckets (id, name, public, file_size_limit)
values ('pods', 'pods', true, 15728640)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Public read pods bucket" on storage.objects;
create policy "Public read pods bucket"
  on storage.objects
  for select
  to public
  using (bucket_id = 'pods');

drop policy if exists "Auth upload own pods" on storage.objects;
create policy "Auth upload own pods"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'pods'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Auth update own pods" on storage.objects;
create policy "Auth update own pods"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'pods'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Auth delete own pods" on storage.objects;
create policy "Auth delete own pods"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'pods'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Verification status columns (onboarding + admin review)
alter table public.profiles add column if not exists verification_status text default 'pending';
alter table public.profiles add column if not exists is_approved boolean default false;
alter table public.profiles add column if not exists status text default 'pending';

create index if not exists profiles_verification_status_idx
  on public.profiles (role, verification_status, created_at desc);
