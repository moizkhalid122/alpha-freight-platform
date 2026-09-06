-- Editor intake uploads (photo + ID) — run ONCE in Supabase SQL Editor



insert into storage.buckets (id, name, public, file_size_limit)

values ('editor-intake', 'editor-intake', true, 8388608)

on conflict (id) do update

set public = excluded.public,

    file_size_limit = excluded.file_size_limit;



drop policy if exists "Public read editor intake" on storage.objects;

create policy "Public read editor intake"

  on storage.objects for select

  using (bucket_id = 'editor-intake');



drop policy if exists "Anon upload editor intake" on storage.objects;

create policy "Anon upload editor intake"

  on storage.objects for insert to anon

  with check (bucket_id = 'editor-intake');



-- Uploads go browser → Supabase directly (fast). Paths use random UUID folders.

-- Allow browser to save editor intake submissions (no slow server hop)
grant insert on public.website_inquiries to anon;

drop policy if exists "Anon insert editor intake inquiries" on public.website_inquiries;
create policy "Anon insert editor intake inquiries"
  on public.website_inquiries for insert to anon
  with check (inquiry_type = 'editor_intake');
