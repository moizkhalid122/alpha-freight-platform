import { CarrierWalletData, fetchCarrierWallet } from "@/lib/carrier-wallet";
import { isCacheStale, SCREEN_CACHE_STALE_MS } from "@/lib/cache-stale";

let cached: CarrierWalletData | null = null;
let cachedAt: number | null = null;
let inflight: Promise<CarrierWalletData | null> | null = null;

export function getCachedCarrierWallet() {
  return cached;
}

export function isCarrierWalletCacheStale(maxAgeMs = SCREEN_CACHE_STALE_MS) {
  if (!cached) return true;
  return isCacheStale(cachedAt, maxAgeMs);
}

export function setCachedCarrierWallet(data: CarrierWalletData | null) {
  cached = data;
  cachedAt = data ? Date.now() : null;
}

export async function prefetchCarrierWallet(force = false) {
  if (!force && cached && !isCarrierWalletCacheStale()) return cached;
  if (!force && inflight) return inflight;

  inflight = fetchCarrierWallet()
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
