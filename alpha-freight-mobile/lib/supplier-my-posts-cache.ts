import { SupplierMyPostsData, fetchSupplierMyPosts } from "@/lib/supplier-my-posts";
import { isCacheStale, SCREEN_CACHE_STALE_MS } from "@/lib/cache-stale";

let cached: SupplierMyPostsData | null = null;
let cachedAt: number | null = null;
let inflight: Promise<SupplierMyPostsData | null> | null = null;

export function getCachedSupplierMyPosts() {
  return cached;
}

export function isSupplierMyPostsCacheStale(maxAgeMs = SCREEN_CACHE_STALE_MS) {
  if (!cached) return true;
  return isCacheStale(cachedAt, maxAgeMs);
}

export function getCachedSupplierPostById(loadId: string) {
  return cached?.posts.find((post) => post.id === loadId) ?? null;
}

export function setCachedSupplierMyPosts(data: SupplierMyPostsData | null) {
  cached = data;
  cachedAt = data ? Date.now() : null;
}

export async function prefetchSupplierMyPosts(force = false) {
  if (!force && cached && !isSupplierMyPostsCacheStale()) return cached;
  if (!force && inflight) return inflight;

  inflight = fetchSupplierMyPosts()
    .then((result) => {
      if (result) {
        cached = result;
        cachedAt = Date.now();
      }
      return result;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
