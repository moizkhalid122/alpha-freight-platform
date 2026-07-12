-- Phase 2: HLS / streaming fields for reels. Run in Supabase SQL editor.

alter table public.feed_posts add column if not exists video_hls_url text;
alter table public.feed_posts add column if not exists video_poster_url text;
alter table public.feed_posts add column if not exists video_processing_status text
  default 'ready';

create index if not exists feed_posts_video_processing_status_idx
  on public.feed_posts (video_processing_status, published_at desc);

comment on column public.feed_posts.video_hls_url is 'Adaptive HLS manifest URL (Mux/Cloudflare Stream)';
comment on column public.feed_posts.video_poster_url is 'Dedicated poster/thumbnail URL for reels';
comment on column public.feed_posts.video_processing_status is 'pending | processing | ready | failed';
