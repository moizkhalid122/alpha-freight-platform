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

-- Profile avatar/banner uploads use path: {user_id}/profile-media/{target}-{timestamp}.jpg
-- The first folder MUST be auth.uid() for storage RLS (same as POD uploads).
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
