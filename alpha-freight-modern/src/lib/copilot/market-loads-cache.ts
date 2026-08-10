import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchMarketRateLoads } from "@/lib/copilot/carrier-intelligence";
import type { RateLoadRow } from "@/lib/freight-tools";

const CACHE_TTL_MS = 45_000;
let cache: { data: RateLoadRow[]; expiresAt: number } | null = null;
let inflight: Promise<RateLoadRow[]> | null = null;

export async function fetchMarketRateLoadsCached(
  supabase: SupabaseClient,
  timeoutMs = 2500
): Promise<RateLoadRow[]> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  if (inflight) {
    return raceTimeout(inflight, timeoutMs, cache?.data ?? []);
  }

  inflight = fetchMarketRateLoads(supabase)
    .then((data) => {
      cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
      return data;
    })
    .finally(() => {
      inflight = null;
    });

  return raceTimeout(inflight, timeoutMs, cache?.data ?? []);
}

function raceTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}
