import { CarrierPayoutDetails, fetchCarrierPayoutDetails } from "@/lib/carrier-payout-setup";

let cached: CarrierPayoutDetails | null = null;
let inflight: Promise<CarrierPayoutDetails | null> | null = null;

export function getCachedPayoutDetails() {
  return cached;
}

export function setCachedPayoutDetails(data: CarrierPayoutDetails | null) {
  cached = data;
}

export async function prefetchPayoutDetails(force = false) {
  if (!force && cached) return cached;
  if (!force && inflight) return inflight;

  inflight = fetchCarrierPayoutDetails()
    .then((result) => {
      if (result) cached = result;
      return result;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
