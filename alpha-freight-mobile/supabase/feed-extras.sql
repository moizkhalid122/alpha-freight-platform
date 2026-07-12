-- Run in Supabase SQL editor: saves, views, comment notifications, delete own posts.

-- Saved posts
create table if not exists public.feed_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  distribution_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, distribution_id)
);

create index if not exists feed_saves_user_id_idx on public.feed_saves (user_id, created_at desc);
create index if not exists feed_saves_distribution_id_idx on public.feed_saves (distribution_id);

alter table public.feed_saves enable row level security;

drop policy if exists "Users manage own saves" on public.feed_saves;
create policy "Users manage own saves"
  on public.feed_saves
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, delete on public.feed_saves to authenticated;

create or replace function public.adjust_feed_post_saves_count(p_distribution_id text, p_delta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.feed_posts
  set save_count = greatest(0, coalesce(save_count, 0) + p_delta)
  where distribution_id = p_distribution_id;
end;
$$;

grant execute on function public.adjust_feed_post_saves_count(text, integer) to authenticated;

-- View tracking (one count bump per user per post per 24h)
create table if not exists public.feed_post_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  distribution_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists feed_post_views_user_post_idx
  on public.feed_post_views (user_id, distribution_id, created_at desc);

alter table public.feed_post_views enable row level security;

drop policy if exists "Users manage own views" on public.feed_post_views;
create policy "Users manage own views"
  on public.feed_post_views
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert on public.feed_post_views to authenticated;

create or replace function public.track_feed_post_view(p_distribution_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_recent timestamptz;
begin
  if v_user_id is null or p_distribution_id is null or btrim(p_distribution_id) = '' then
    return false;
  end if;

  select fpv.created_at into v_recent
  from public.feed_post_views fpv
  where fpv.user_id = v_user_id
    and fpv.distribution_id = p_distribution_id
    and fpv.created_at > now() - interval '24 hours'
  order by fpv.created_at desc
  limit 1;

  if v_recent is not null then
    return false;
  end if;

  insert into public.feed_post_views (user_id, distribution_id)
  values (v_user_id, p_distribution_id);

  update public.feed_posts
  set view_count = coalesce(view_count, 0) + 1
  where distribution_id = p_distribution_id;

  return true;
end;
$$;

grant execute on function public.track_feed_post_view(text) to authenticated;

-- Delete own posts
drop policy if exists "Users can delete own feed posts" on public.feed_posts;
create policy "Users can delete own feed posts"
  on public.feed_posts
  for delete
  to authenticated
  using (auth.uid() = author_id);

grant delete on public.feed_posts to authenticated;

-- Comment / reply notifications
create or replace function public.notify_on_feed_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author_id uuid;
  post_author_profile_key text;
  actor_name text;
  actor_avatar text;
  actor_role text;
  actor_profile_key text;
  notification_type text;
  message_text text;
begin
  select fp.author_id, fp.author_profile_key
  into post_author_id, post_author_profile_key
  from public.feed_posts fp
  where fp.distribution_id = NEW.distribution_id
  limit 1;

  if post_author_id is null or post_author_id = NEW.author_id then
    return NEW;
  end if;

  notification_type := case when NEW.parent_comment_id is null then 'reply' else 'reply' end;
  message_text := case
    when NEW.parent_comment_id is null then coalesce(NEW.author_name, 'Someone') || ' commented on your post'
    else coalesce(NEW.author_name, 'Someone') || ' replied to a comment'
  end;

  if exists (
    select 1 from public.feed_notifications fn
    where fn.recipient_id = post_author_id
      and fn.actor_id = NEW.author_id
      and fn.notification_type = 'reply'
      and fn.href = '/feed-post/' || NEW.distribution_id
      and fn.created_at > now() - interval '5 minutes'
  ) then
    return NEW;
  end if;

  select coalesce(p.company_name, p.full_name, 'Someone'), p.avatar_url
  into actor_name, actor_avatar
  from public.profiles p
  where p.id = NEW.author_id;

  select coalesce(fp.author_role, 'carrier'), fp.author_profile_key
  into actor_role, actor_profile_key
  from public.feed_posts fp
  where fp.author_id = NEW.author_id
  order by fp.published_at desc
  limit 1;

  insert into public.feed_notifications (
    recipient_id,
    recipient_profile_key,
    actor_id,
    actor_name,
    actor_avatar,
    actor_role,
    actor_profile_key,
    notification_type,
    message,
    href
  ) values (
    post_author_id,
    post_author_profile_key,
    NEW.author_id,
    coalesce(actor_name, NEW.author_name, 'Someone'),
    actor_avatar,
    coalesce(actor_role, 'carrier'),
    coalesce(actor_profile_key, lower(replace(coalesce(actor_name, 'member'), ' ', '-'))),
    notification_type,
    message_text,
    '/feed-post/' || NEW.distribution_id
  );

  return NEW;
end;
$$;

drop trigger if exists feed_post_comments_notify on public.feed_post_comments;
create trigger feed_post_comments_notify
after insert on public.feed_post_comments
for each row
execute function public.notify_on_feed_comment();
