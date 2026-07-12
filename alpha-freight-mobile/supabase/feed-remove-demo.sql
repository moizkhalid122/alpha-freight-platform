-- Remove demo / seed feed posts (fake reels & posts). Run once in Supabase SQL editor.

delete from public.feed_post_likes
where distribution_id like 'demo-%'
   or distribution_id in (
     select distribution_id
     from public.feed_posts
     where distribution_id like 'demo-%'
        or author_email like 'demo.%'
        or coalesce(video_url, '') ilike '%mixkit.co%'
   );

delete from public.feed_saves
where distribution_id like 'demo-%'
   or distribution_id in (
     select distribution_id
     from public.feed_posts
     where distribution_id like 'demo-%'
        or author_email like 'demo.%'
        or coalesce(video_url, '') ilike '%mixkit.co%'
   );

delete from public.feed_post_views
where distribution_id like 'demo-%'
   or distribution_id in (
     select distribution_id
     from public.feed_posts
     where distribution_id like 'demo-%'
        or author_email like 'demo.%'
        or coalesce(video_url, '') ilike '%mixkit.co%'
   );

delete from public.feed_post_comments
where distribution_id like 'demo-%'
   or distribution_id in (
     select distribution_id
     from public.feed_posts
     where distribution_id like 'demo-%'
        or author_email like 'demo.%'
        or coalesce(video_url, '') ilike '%mixkit.co%'
   );

delete from public.feed_notifications
where href like '/feed-post/demo-%'
   or actor_profile_key like 'demo.%';

delete from public.feed_posts
where distribution_id like 'demo-%'
   or author_email like 'demo.%'
   or author_profile_key like 'demo.%'
   or coalesce(video_url, '') ilike '%mixkit.co%';
