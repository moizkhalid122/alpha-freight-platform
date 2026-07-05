import { CarrierWalletData, fetchCarrierWallet } from "@/lib/carrier-wallet";

let cached: CarrierWalletData | null = null;
let inflight: Promise<CarrierWalletData | null> | null = null;

export function getCachedCarrierWallet() {
  return cached;
}

export function setCachedCarrierWallet(data: CarrierWalletData | null) {
  cached = data;
}

export async function prefetchCarrierWallet(force = false) {
  if (!force && cached) return cached;
  if (!force && inflight) return inflight;

  inflight = fetchCarrierWallet()
    .then((result) => {
      if (result) cached = result;
      return result;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
