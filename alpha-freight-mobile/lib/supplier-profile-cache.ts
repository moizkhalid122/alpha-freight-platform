import { SupplierProfileData, fetchSupplierProfile } from "@/lib/supplier-profile";
import { isCacheStale, SCREEN_CACHE_STALE_MS } from "@/lib/cache-stale";

let cached: SupplierProfileData | null = null;
let cachedAt: number | null = null;
let inflight: Promise<SupplierProfileData | null> | null = null;

export function getCachedSupplierProfile() {
  return cached;
}

export function isSupplierProfileCacheStale(maxAgeMs = SCREEN_CACHE_STALE_MS) {
  if (!cached) return true;
  return isCacheStale(cachedAt, maxAgeMs);
}

export function setCachedSupplierProfile(data: SupplierProfileData | null) {
  cached = data;
  cachedAt = data ? Date.now() : null;
}

export function clearCachedSupplierProfile() {
  cached = null;
  cachedAt = null;
  inflight = null;
}

export async function prefetchSupplierProfile(force = false) {
  if (!force && cached && !isSupplierProfileCacheStale()) return cached;
  if (!force && inflight) return inflight;

  inflight = fetchSupplierProfile()
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
