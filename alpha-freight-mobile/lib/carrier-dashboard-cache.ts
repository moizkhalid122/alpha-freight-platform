import { CarrierDashboardData, fetchCarrierDashboard } from "@/lib/carrier-dashboard";

let cached: CarrierDashboardData | null = null;
let inflight: Promise<CarrierDashboardData | null> | null = null;

export function getCachedCarrierDashboard() {
  return cached;
}

export function setCachedCarrierDashboard(data: CarrierDashboardData | null) {
  cached = data;
}

export async function prefetchCarrierDashboard(force = false) {
  if (!force && cached) return cached;
  if (!force && inflight) return inflight;

  inflight = fetchCarrierDashboard()
    .then((result) => {
      if (result) cached = result;
      return result;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
