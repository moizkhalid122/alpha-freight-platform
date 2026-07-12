import { SupplierDashboardData, fetchSupplierDashboard } from "@/lib/supplier-dashboard";
import { isCacheStale, SCREEN_CACHE_STALE_MS } from "@/lib/cache-stale";

let cached: SupplierDashboardData | null = null;
let cachedAt: number | null = null;
let inflight: Promise<SupplierDashboardData | null> | null = null;

export function getCachedSupplierDashboard() {
  return cached;
}

export function isSupplierDashboardCacheStale(maxAgeMs = SCREEN_CACHE_STALE_MS) {
  if (!cached) return true;
  return isCacheStale(cachedAt, maxAgeMs);
}

export function setCachedSupplierDashboard(data: SupplierDashboardData | null) {
  cached = data;
  cachedAt = data ? Date.now() : null;
}

export async function prefetchSupplierDashboard(force = false) {
  if (!force && cached && !isSupplierDashboardCacheStale()) return cached;
  if (!force && inflight) return inflight;

  inflight = fetchSupplierDashboard()
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
