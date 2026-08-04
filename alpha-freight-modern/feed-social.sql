-- Run in Supabase SQL Editor for cross-browser Following feed + follow sync.
-- Uses dedicated "feed-media" storage bucket for post images/videos.

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  distribution_id text not null unique,
  author_id uuid not null,
  author_name text not null,
  author_email text,
  author_profile_key text not null,
  author_role text not null,
  author_avatar text,
  content text not null default '',
  image_url text,
  video_url text,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  interest_tags text[] not null default '{}',
  share_count integer not null default 0,
  save_count integer not null default 0,
  view_count integer not null default 0,
  engagement_score integer not null default 0,
  distribution_stage text not null default 'interest',
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists feed_posts_author_profile_key_idx
  on public.feed_posts (author_profile_key, published_at desc);

create index if not exists feed_posts_author_id_idx
  on public.feed_posts (author_id, published_at desc);

create index if not exists feed_posts_published_at_idx
  on public.feed_posts (published_at desc);

alter table public.feed_posts enable row level security;

drop policy if exists "Authenticated users can read feed posts" on public.feed_posts;
create policy "Authenticated users can read feed posts"
  on public.feed_posts
  for select
  to authenticated
  using (true);

drop policy if exists "Users can create their own feed posts" on public.feed_posts;
create policy "Users can create their own feed posts"
  on public.feed_posts
  for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "Users can update own feed posts" on public.feed_posts;
create policy "Users can update own feed posts"
  on public.feed_posts
  for update
  to authenticated
  using (auth.uid() = author_id);

create table if not exists public.feed_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null,
  follower_profile_key text not null,
  followed_profile_key text not null,
  followed_profile_id uuid,
  created_at timestamptz not null default now(),
  unique (follower_id, followed_profile_key)
);

create index if not exists feed_follows_follower_id_idx
  on public.feed_follows (follower_id, created_at desc);

alter table public.feed_follows enable row level security;

drop policy if exists "Users can read their follows" on public.feed_follows;
create policy "Users can read their follows"
  on public.feed_follows
  for select
  to authenticated
  using (auth.uid() = follower_id);

drop policy if exists "Users can create their follows" on public.feed_follows;
create policy "Users can create their follows"
  on public.feed_follows
  for insert
  to authenticated
  with check (auth.uid() = follower_id);

drop policy if exists "Users can delete their follows" on public.feed_follows;
create policy "Users can delete their follows"
  on public.feed_follows
  for delete
  to authenticated
  using (auth.uid() = follower_id);

grant usage on schema public to authenticated;
grant select, insert, update on public.feed_posts to authenticated;
grant select, insert, delete on public.feed_follows to authenticated;

-- Optional columns for reliable media playback across browsers.
alter table public.feed_posts add column if not exists image_storage_path text;
alter table public.feed_posts add column if not exists video_storage_path text;

-- Dedicated bucket for feed images/videos (pods bucket may not exist in every project).
insert into storage.buckets (id, name, public, file_size_limit)
values ('feed-media', 'feed-media', true, 104857600)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Authenticated users can upload feed media" on storage.objects;
drop policy if exists "Authenticated users can update feed media" on storage.objects;
drop policy if exists "Authenticated users can read feed media" on storage.objects;
drop policy if exists "Public can read feed media" on storage.objects;

drop policy if exists "Public read feed media bucket" on storage.objects;
create policy "Public read feed media bucket"
  on storage.objects
  for select
  to public
  using (bucket_id = 'feed-media');

drop policy if exists "Auth upload own feed media" on storage.objects;
create policy "Auth upload own feed media"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'feed-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Auth update own feed media" on storage.objects;
create policy "Auth update own feed media"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'feed-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Auth delete own feed media" on storage.objects;
create policy "Auth delete own feed media"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'feed-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Profile banner for cross-browser feed profile views.
alter table public.profiles add column if not exists banner_url text;

-- Persist likes across reloads and browsers.
create table if not exists public.feed_post_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  distribution_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, distribution_id)
);

create index if not exists feed_post_likes_user_id_idx
  on public.feed_post_likes (user_id);

create index if not exists feed_post_likes_distribution_id_idx
  on public.feed_post_likes (distribution_id);

alter table public.feed_post_likes enable row level security;

drop policy if exists "Users can read their likes" on public.feed_post_likes;
create policy "Users can read their likes"
  on public.feed_post_likes
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their likes" on public.feed_post_likes;
create policy "Users can insert their likes"
  on public.feed_post_likes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their likes" on public.feed_post_likes;
create policy "Users can delete their likes"
  on public.feed_post_likes
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.feed_post_likes to authenticated;

create or replace function public.adjust_feed_post_likes_count(p_distribution_id text, p_delta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.feed_posts
  set likes_count = greatest(0, coalesce(likes_count, 0) + p_delta)
  where distribution_id = p_distribution_id;
end;
$$;

grant execute on function public.adjust_feed_post_likes_count(text, integer) to authenticated;
