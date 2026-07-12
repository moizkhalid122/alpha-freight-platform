import { CarrierProfileData, fetchCarrierProfile } from "@/lib/carrier-profile";
import { isCacheStale, SCREEN_CACHE_STALE_MS } from "@/lib/cache-stale";

let cached: CarrierProfileData | null = null;
let cachedAt: number | null = null;
let inflight: Promise<CarrierProfileData | null> | null = null;

export function getCachedCarrierProfile() {
  return cached;
}

export function isCarrierProfileCacheStale(maxAgeMs = SCREEN_CACHE_STALE_MS) {
  if (!cached) return true;
  return isCacheStale(cachedAt, maxAgeMs);
}

export function setCachedCarrierProfile(data: CarrierProfileData | null) {
  cached = data;
  cachedAt = data ? Date.now() : null;
}

export function clearCachedCarrierProfile() {
  cached = null;
  cachedAt = null;
  inflight = null;
}

export async function prefetchCarrierProfile(force = false) {
  if (!force && cached && !isCarrierProfileCacheStale()) return cached;
  if (!force && inflight) return inflight;

  inflight = fetchCarrierProfile()
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
