import { FeedPost, fetchFeedPosts } from "@/lib/feed-posts";
import { withoutDemoFeedPosts } from "@/lib/feed-demo";

const FEED_CACHE_STALE_MS = 3 * 60 * 1000;

let cached: FeedPost[] | null = null;
let cachedAt: number | null = null;
let inflight: Promise<FeedPost[]> | null = null;

export function getCachedFeedPosts() {
  if (!cached) return null;
  return withoutDemoFeedPosts(cached);
}

export function getFeedCacheAgeMs() {
  if (!cachedAt) return Number.POSITIVE_INFINITY;
  return Date.now() - cachedAt;
}

export function isFeedCacheStale(maxAgeMs = FEED_CACHE_STALE_MS) {
  if (!cached?.length) return true;
  return getFeedCacheAgeMs() > maxAgeMs;
}

export function setCachedFeedPosts(posts: FeedPost[] | null) {
  cached = posts ? withoutDemoFeedPosts(posts) : null;
  cachedAt = cached?.length ? Date.now() : null;
}

export function clearFeedCache() {
  cached = null;
  cachedAt = null;
  inflight = null;
}

export function getCachedFeedPostById(postId: string) {
  return cached?.find((post) => post.id === postId) ?? null;
}

export async function prefetchFeedPosts(force = false) {
  if (!force && cached && !isFeedCacheStale()) return cached;
  if (!force && inflight) return inflight;

  inflight = fetchFeedPosts()
    .then(({ posts }) => {
      cached = withoutDemoFeedPosts(posts);
      cachedAt = Date.now();
      return cached;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
