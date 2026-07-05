import { CarrierProfileData, fetchCarrierProfile } from "@/lib/carrier-profile";

let cached: CarrierProfileData | null = null;
let inflight: Promise<CarrierProfileData | null> | null = null;

export function getCachedCarrierProfile() {
  return cached;
}

export function setCachedCarrierProfile(data: CarrierProfileData | null) {
  cached = data;
}

export function clearCachedCarrierProfile() {
  cached = null;
  inflight = null;
}

export async function prefetchCarrierProfile(force = false) {
  if (!force && cached) return cached;
  if (!force && inflight) return inflight;

  inflight = fetchCarrierProfile()
    .then((result) => {
      if (result) cached = result;
      return result;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
