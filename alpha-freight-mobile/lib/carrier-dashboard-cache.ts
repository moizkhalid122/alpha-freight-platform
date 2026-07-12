import { CarrierDashboardData, fetchCarrierDashboard } from "@/lib/carrier-dashboard";
import { isCacheStale, SCREEN_CACHE_STALE_MS } from "@/lib/cache-stale";

let cached: CarrierDashboardData | null = null;
let cachedAt: number | null = null;
let inflight: Promise<CarrierDashboardData | null> | null = null;

export function getCachedCarrierDashboard() {
  return cached;
}

export function isCarrierDashboardCacheStale(maxAgeMs = SCREEN_CACHE_STALE_MS) {
  if (!cached) return true;
  return isCacheStale(cachedAt, maxAgeMs);
}

export function setCachedCarrierDashboard(data: CarrierDashboardData | null) {
  cached = data;
  cachedAt = data ? Date.now() : null;
}

export async function prefetchCarrierDashboard(force = false) {
  if (!force && cached && !isCarrierDashboardCacheStale()) return cached;
  if (!force && inflight) return inflight;

  inflight = fetchCarrierDashboard()
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
