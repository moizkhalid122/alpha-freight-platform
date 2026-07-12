/** Tab screens refresh at most every ~45s unless user pull-to-refreshes. */
export const SCREEN_CACHE_STALE_MS = 45_000;

export function isCacheStale(
  fetchedAt: number | null | undefined,
  maxAgeMs = SCREEN_CACHE_STALE_MS
) {
  if (!fetchedAt) return true;
  return Date.now() - fetchedAt > maxAgeMs;
}
