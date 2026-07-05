import { CarrierReferralDashboard, fetchCarrierReferralDashboard } from "@/lib/carrier-referrals";

let cached: CarrierReferralDashboard | null = null;
let inflight: Promise<CarrierReferralDashboard | null> | null = null;

export function getCachedCarrierReferrals() {
  return cached;
}

export function setCachedCarrierReferrals(data: CarrierReferralDashboard | null) {
  cached = data;
}

export async function prefetchCarrierReferrals(force = false) {
  if (!force && cached) return cached;
  if (!force && inflight) return inflight;

  inflight = fetchCarrierReferralDashboard()
    .then((result) => {
      if (result) cached = result;
      return result;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
