import { AvailableLoadsData, fetchAvailableLoads } from "@/lib/available-loads";

let cached: AvailableLoadsData | null = null;
let inflight: Promise<AvailableLoadsData | null> | null = null;

export function getCachedAvailableLoads() {
  return cached;
}

export function setCachedAvailableLoads(data: AvailableLoadsData | null) {
  cached = data;
}

export async function prefetchAvailableLoads(force = false) {
  if (!force && cached) return cached;
  if (!force && inflight) return inflight;

  inflight = fetchAvailableLoads()
    .then((result) => {
      if (result) cached = result;
      return result;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
