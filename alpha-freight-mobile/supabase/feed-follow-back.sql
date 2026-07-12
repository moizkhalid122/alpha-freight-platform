-- Run in Supabase SQL editor so users can see who follows them (Follow Back button).

drop policy if exists "Users can read their follows" on public.feed_follows;
create policy "Users can read their follows"
  on public.feed_follows
  for select
  to authenticated
  using (
    auth.uid() = follower_id
    or auth.uid() = followed_profile_id
  );

create index if not exists feed_follows_followed_profile_id_idx
  on public.feed_follows (followed_profile_id, follower_id);
