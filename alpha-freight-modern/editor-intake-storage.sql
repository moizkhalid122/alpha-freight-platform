-- Editor intake uploads (photo + ID) — run ONCE in Supabase SQL Editor
-- Project must match production env: NEXT_PUBLIC_SUPABASE_URL on Vercel

insert into storage.buckets (id, name, public, file_size_limit)
values ('editor-intake', 'editor-intake', true, 8388608)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

-- Read uploaded files (public bucket)
drop policy if exists "Public read editor intake" on storage.objects;
create policy "Public read editor intake"
  on storage.objects for select
  using (bucket_id = 'editor-intake');

-- Browser uploads (anon — public form, no login)
drop policy if exists "Anon upload editor intake" on storage.objects;
create policy "Anon upload editor intake"
  on storage.objects for insert to anon
  with check (bucket_id = 'editor-intake');

-- Fallback if visitor already has a site login cookie
drop policy if exists "Authenticated upload editor intake" on storage.objects;
create policy "Authenticated upload editor intake"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'editor-intake');

-- Save submission row (browser → Supabase directly)
grant insert on public.website_inquiries to anon, authenticated;

drop policy if exists "Anon insert editor intake inquiries" on public.website_inquiries;
create policy "Anon insert editor intake inquiries"
  on public.website_inquiries for insert to anon
  with check (inquiry_type = 'editor_intake');

drop policy if exists "Authenticated insert editor intake inquiries" on public.website_inquiries;
create policy "Authenticated insert editor intake inquiries"
  on public.website_inquiries for insert to authenticated
  with check (inquiry_type = 'editor_intake');
