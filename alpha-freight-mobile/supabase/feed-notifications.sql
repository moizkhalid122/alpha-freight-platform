-- Run in Supabase SQL editor for feed follow/like notifications (mobile + web).

create table if not exists public.feed_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null,
  recipient_profile_key text,
  actor_id uuid,
  actor_name text not null,
  actor_avatar text,
  actor_role text,
  actor_profile_key text,
  notification_type text not null default 'follow',
  message text not null default 'started following you',
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.feed_notifications add column if not exists read_at timestamptz;

create index if not exists feed_notifications_recipient_id_idx
  on public.feed_notifications (recipient_id, created_at desc);

alter table public.feed_notifications enable row level security;

drop policy if exists "Users can read their notifications" on public.feed_notifications;
create policy "Users can read their notifications"
  on public.feed_notifications
  for select
  using (auth.uid() = recipient_id);

drop policy if exists "Authenticated users can create notifications" on public.feed_notifications;
create policy "Authenticated users can create notifications"
  on public.feed_notifications
  for insert
  with check (auth.uid() = actor_id);

drop policy if exists "Users update their feed notifications" on public.feed_notifications;
create policy "Users update their feed notifications"
  on public.feed_notifications
  for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

grant usage on schema public to authenticated;
grant select, insert, update on public.feed_notifications to authenticated;

-- Realtime push to recipient devices (app open)
alter table public.feed_notifications replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.feed_notifications;
exception
  when duplicate_object then null;
end $$;

-- Remote Expo push when app is background/closed (requires pg_net on Supabase)
create extension if not exists pg_net with schema extensions;

create or replace function public.send_expo_push_to_user(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  token_record record;
  push_payload jsonb;
begin
  for token_record in
    select expo_push_token
    from public.push_device_tokens
    where user_id = p_user_id
      and is_active = true
      and expo_push_token is not null
      and btrim(expo_push_token) <> ''
  loop
    push_payload := jsonb_build_object(
      'to', token_record.expo_push_token,
      'title', coalesce(p_title, 'Alpha Freight'),
      'body', coalesce(p_body, 'You have a new notification'),
      'sound', 'default',
      'priority', 'high',
      'channelId', 'default',
      'data', coalesce(p_data, '{}'::jsonb)
    );

    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
      ),
      body := push_payload
    );
  end loop;
end;
$$;

create or replace function public.send_feed_notification_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  push_type text;
  push_route text;
  push_post_id text;
begin
  push_type := case
    when NEW.notification_type = 'like' then 'feed_like'
    else 'feed_follow'
  end;

  push_route := coalesce(NEW.href, '/feed-profile');
  push_post_id := case
    when NEW.href like '%/feed-post/%' then split_part(split_part(NEW.href, '/feed-post/', 2), '?', 1)
    else null
  end;

  perform public.send_expo_push_to_user(
    NEW.recipient_id,
    NEW.actor_name,
    NEW.message,
    jsonb_build_object(
      'type', push_type,
      'route', push_route,
      'profileKey', NEW.actor_profile_key,
      'name', NEW.actor_name,
      'role', NEW.actor_role,
      'avatarSrc', NEW.actor_avatar,
      'authorId', NEW.actor_id::text,
      'postId', push_post_id
    )
  );

  return NEW;
end;
$$;

drop trigger if exists feed_notifications_send_push on public.feed_notifications;
create trigger feed_notifications_send_push
after insert on public.feed_notifications
for each row
execute function public.send_feed_notification_push();

create or replace function public.dispatch_feed_push(p_notification_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.feed_notifications%rowtype;
  push_type text;
  push_route text;
  push_post_id text;
begin
  select * into row
  from public.feed_notifications
  where id = p_notification_id;

  if not found then
    return false;
  end if;

  push_type := case
    when row.notification_type = 'like' then 'feed_like'
    else 'feed_follow'
  end;

  push_route := coalesce(row.href, '/feed-profile');
  push_post_id := case
    when row.href like '%/feed-post/%' then split_part(split_part(row.href, '/feed-post/', 2), '?', 1)
    else null
  end;

  perform public.send_expo_push_to_user(
    row.recipient_id,
    row.actor_name,
    row.message,
    jsonb_build_object(
      'type', push_type,
      'route', push_route,
      'profileKey', row.actor_profile_key,
      'name', row.actor_name,
      'role', row.actor_role,
      'avatarSrc', row.actor_avatar,
      'authorId', row.actor_id::text,
      'postId', push_post_id
    )
  );

  return true;
end;
$$;

grant execute on function public.dispatch_feed_push(uuid) to authenticated;

-- Auto-create feed notifications when someone follows (server-side, always works)
create or replace function public.notify_on_feed_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
  actor_name text;
  actor_avatar text;
  actor_role text;
begin
  if NEW.follower_id is not null and NEW.followed_profile_id is not null
     and NEW.follower_id = NEW.followed_profile_id then
    return NEW;
  end if;

  recipient := NEW.followed_profile_id;
  if recipient is null then
    select fp.author_id into recipient
    from public.feed_posts fp
    where fp.author_profile_key = NEW.followed_profile_key
    order by fp.published_at desc
    limit 1;
  end if;

  if recipient is null or recipient = NEW.follower_id then
    return NEW;
  end if;

  if exists (
    select 1 from public.feed_notifications fn
    where fn.recipient_id = recipient
      and fn.actor_id = NEW.follower_id
      and fn.notification_type = 'follow'
      and fn.created_at > now() - interval '10 minutes'
  ) then
    return NEW;
  end if;

  select
    coalesce(p.company_name, p.full_name, 'Someone'),
    p.avatar_url
  into actor_name, actor_avatar
  from public.profiles p
  where p.id = NEW.follower_id;

  select coalesce(fp.author_role, 'carrier')
  into actor_role
  from public.feed_posts fp
  where fp.author_id = NEW.follower_id
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
    message
  ) values (
    recipient,
    NEW.followed_profile_key,
    NEW.follower_id,
    coalesce(actor_name, 'Someone'),
    actor_avatar,
    coalesce(actor_role, 'carrier'),
    NEW.follower_profile_key,
    'follow',
    coalesce(actor_name, 'Someone') || ' started following you'
  );

  return NEW;
end;
$$;

drop trigger if exists feed_follows_notify on public.feed_follows;
create trigger feed_follows_notify
after insert on public.feed_follows
for each row
execute function public.notify_on_feed_follow();

-- Auto-create feed notifications when someone likes a post
create or replace function public.notify_on_feed_like()
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
begin
  select fp.author_id, fp.author_profile_key
  into post_author_id, post_author_profile_key
  from public.feed_posts fp
  where fp.distribution_id = NEW.distribution_id
  limit 1;

  if post_author_id is null or post_author_id = NEW.user_id then
    return NEW;
  end if;

  if exists (
    select 1 from public.feed_notifications fn
    where fn.recipient_id = post_author_id
      and fn.actor_id = NEW.user_id
      and fn.notification_type = 'like'
      and fn.href = '/feed-post/' || NEW.distribution_id
      and fn.created_at > now() - interval '10 minutes'
  ) then
    return NEW;
  end if;

  select
    coalesce(p.company_name, p.full_name, 'Someone'),
    p.avatar_url
  into actor_name, actor_avatar
  from public.profiles p
  where p.id = NEW.user_id;

  select coalesce(fp.author_role, 'carrier'), fp.author_profile_key
  into actor_role, actor_profile_key
  from public.feed_posts fp
  where fp.author_id = NEW.user_id
  order by fp.published_at desc
  limit 1;

  if actor_profile_key is null then
    actor_profile_key := lower(replace(coalesce(actor_name, 'member'), ' ', '-'));
  end if;

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
    NEW.user_id,
    coalesce(actor_name, 'Someone'),
    actor_avatar,
    coalesce(actor_role, 'carrier'),
    actor_profile_key,
    'like',
    coalesce(actor_name, 'Someone') || ' liked your post',
    '/feed-post/' || NEW.distribution_id
  );

  return NEW;
end;
$$;

drop trigger if exists feed_post_likes_notify on public.feed_post_likes;
create trigger feed_post_likes_notify
after insert on public.feed_post_likes
for each row
execute function public.notify_on_feed_like();
