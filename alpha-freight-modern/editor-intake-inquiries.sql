-- Editor intake form — allow browser to save submissions directly (fast, no server upload)
-- Run in Supabase SQL Editor AFTER website-inquiries.sql

grant insert on public.website_inquiries to anon, authenticated;

drop policy if exists "Anon insert editor intake inquiries" on public.website_inquiries;
create policy "Anon insert editor intake inquiries"
  on public.website_inquiries for insert to anon
  with check (inquiry_type = 'editor_intake');

drop policy if exists "Authenticated insert editor intake inquiries" on public.website_inquiries;
create policy "Authenticated insert editor intake inquiries"
  on public.website_inquiries for insert to authenticated
  with check (inquiry_type = 'editor_intake');
