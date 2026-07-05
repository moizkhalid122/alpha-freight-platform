import { CarrierMyLoadsData, fetchCarrierMyLoads } from "@/lib/carrier-my-loads";

let cached: CarrierMyLoadsData | null = null;
let inflight: Promise<CarrierMyLoadsData | null> | null = null;

export function getCachedCarrierMyLoads() {
  return cached;
}

export function setCachedCarrierMyLoads(data: CarrierMyLoadsData | null) {
  cached = data;
}

export async function prefetchCarrierMyLoads(force = false) {
  if (!force && cached) return cached;
  if (!force && inflight) return inflight;

  inflight = fetchCarrierMyLoads()
    .then((result) => {
      if (result) cached = result;
      return result;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
