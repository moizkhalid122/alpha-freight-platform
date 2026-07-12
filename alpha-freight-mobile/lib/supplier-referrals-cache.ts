import { SupplierReferralDashboard, fetchSupplierReferralDashboard } from "@/lib/supplier-referrals";

let cached: SupplierReferralDashboard | null = null;
let inflight: Promise<SupplierReferralDashboard | null> | null = null;

export function getCachedSupplierReferrals() {
  return cached;
}

export function setCachedSupplierReferrals(data: SupplierReferralDashboard | null) {
  cached = data;
}

export async function prefetchSupplierReferrals(force = false) {
  if (!force && cached) return cached;
  if (!force && inflight) return inflight;

  inflight = fetchSupplierReferralDashboard()
    .then((result) => {
      if (result) cached = result;
      return result;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
