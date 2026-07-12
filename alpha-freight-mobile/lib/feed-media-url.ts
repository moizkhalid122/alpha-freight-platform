import { supabase } from "@/lib/supabase";

const FEED_MEDIA_BUCKET = "feed-media";

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const SIGNED_URL_TTL_MS = 23 * 60 * 60 * 1000;

export const extractFeedMediaStoragePath = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;
  if (!trimmed.startsWith("http") && trimmed.includes("/")) {
    return trimmed.replace(/^\/+/, "");
  }
  const bucketMatch = trimmed.match(/\/feed-media\/(.+?)(?:\?|$)/);
  return bucketMatch?.[1] ? decodeURIComponent(bucketMatch[1]) : null;
};

export function getFeedMediaPublicUrl(storagePath?: string | null) {
  const path = extractFeedMediaStoragePath(storagePath);
  if (!path) return undefined;
  const { data } = supabase.storage.from(FEED_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl || undefined;
}

function getCachedSignedUrl(path: string) {
  const cached = signedUrlCache.get(path);
  if (!cached) return null;
  if (Date.now() >= cached.expiresAt) {
    signedUrlCache.delete(path);
    return null;
  }
  return cached.url;
}

function rememberSignedUrl(path: string, url: string) {
  signedUrlCache.set(path, { url, expiresAt: Date.now() + SIGNED_URL_TTL_MS });
  if (signedUrlCache.size > 300) {
    const firstKey = signedUrlCache.keys().next().value;
    if (firstKey) signedUrlCache.delete(firstKey);
  }
}

export function resolveFeedMediaUrlSync(
  storagePath?: string | null,
  fallbackUrl?: string | null,
  hlsUrl?: string | null
) {
  const hls = hlsUrl?.trim();
  if (hls?.startsWith("https://")) return hls;

  const directUrl = fallbackUrl?.trim();
  if (directUrl?.startsWith("https://") && !directUrl.startsWith("blob:")) {
    return directUrl;
  }
  if (directUrl?.startsWith("data:")) return directUrl;

  const path =
    extractFeedMediaStoragePath(storagePath) || extractFeedMediaStoragePath(fallbackUrl);
  if (!path) return undefined;

  return getFeedMediaPublicUrl(path);
}

export async function resolveFeedMediaUrlPrivate(
  storagePath?: string | null,
  fallbackUrl?: string | null
) {
  const syncUrl = resolveFeedMediaUrlSync(storagePath, fallbackUrl);
  if (syncUrl) return syncUrl;

  const path =
    extractFeedMediaStoragePath(storagePath) || extractFeedMediaStoragePath(fallbackUrl);
  if (!path) return undefined;

  const cached = getCachedSignedUrl(path);
  if (cached) return cached;

  const { data, error } = await supabase.storage
    .from(FEED_MEDIA_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24);

  if (!error && data?.signedUrl) {
    rememberSignedUrl(path, data.signedUrl);
    return data.signedUrl;
  }

  return undefined;
}
