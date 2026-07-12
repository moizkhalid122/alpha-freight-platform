import { fetchAvailableLoads } from "@/lib/available-loads";
import { fetchCarrierBids, getLoadCode } from "@/lib/carrier-bids";
import { fetchCarrierMyLoads } from "@/lib/carrier-my-loads";
import { fetchCarrierWallet, formatWalletMoney } from "@/lib/carrier-wallet";
import { isCacheStale, SCREEN_CACHE_STALE_MS } from "@/lib/cache-stale";

export type AiCarrierLoadSnapshot = {
  code: string;
  route: string;
  price: string;
  status?: string;
  equipment?: string;
  pickup?: string;
  highPay?: boolean;
};

export type AiCarrierBidSnapshot = {
  code: string;
  route: string;
  bidAmount: string;
  loadPrice?: string;
  status: string;
};

export type AiCarrierContext = {
  carrierName: string;
  fetchedAt: string;
  stats: {
    activeLoads: number;
    inTransitLoads: number;
    pendingBids: number;
    availableLoads: number;
  };
  wallet: {
    availableBalance: string;
    pendingBalance: string;
    lifetimeEarnings: string;
  };
  myLoads: AiCarrierLoadSnapshot[];
  availableLoads: AiCarrierLoadSnapshot[];
  bids: AiCarrierBidSnapshot[];
};

function buildRoute(origin?: string | null, destination?: string | null) {
  const from = origin?.trim() || "Origin TBC";
  const to = destination?.trim() || "Destination TBC";
  return `${from} → ${to}`;
}

let cachedContext: AiCarrierContext | null = null;
let cachedAt: number | null = null;
let inflight: Promise<AiCarrierContext | null> | null = null;

export function getCachedAiCarrierContext() {
  return cachedContext;
}

export function isAiCarrierContextStale(maxAgeMs = SCREEN_CACHE_STALE_MS) {
  if (!cachedContext) return true;
  return isCacheStale(cachedAt, maxAgeMs);
}

export async function fetchAiCarrierContext(force = false): Promise<AiCarrierContext | null> {
  if (!force && cachedContext && !isAiCarrierContextStale()) return cachedContext;
  if (!force && inflight) return inflight;

  inflight = (async () => {
  const [availableData, myLoadsData, bids, wallet] = await Promise.all([
    fetchAvailableLoads().catch(() => null),
    fetchCarrierMyLoads().catch(() => null),
    fetchCarrierBids().catch(() => []),
    fetchCarrierWallet().catch(() => null),
  ]);

  const carrierName =
    wallet?.fullName || myLoadsData?.fullName || availableData?.fullName || "Carrier";

  if (!wallet && !myLoadsData && !availableData?.loads.length && !bids.length) {
    return null;
  }

  const pendingBids = bids.filter((bid) => bid.status.toLowerCase() === "pending");

  const myLoads = (myLoadsData?.loads || [])
    .slice()
    .sort((a, b) => {
      const priority = (status: string) => {
        const value = status.toLowerCase();
        if (["in-transit", "loading"].includes(value)) return 0;
        if (["active", "booked", "assigned", "pending"].includes(value)) return 1;
        return 2;
      };
      return priority(a.status) - priority(b.status);
    })
    .slice(0, 6)
    .map((load) => ({
      code: load.code,
      route: buildRoute(load.origin, load.destination),
      price: load.priceLabel,
      status: load.statusLabel,
      equipment: load.equipment,
      pickup: load.pickupLabel,
    }));

  const availableLoads = (availableData?.loads || [])
    .slice()
    .sort((a, b) => b.price - a.price)
    .slice(0, 8)
    .map((load) => ({
      code: load.code,
      route: buildRoute(load.origin, load.destination),
      price: load.priceLabel,
      equipment: load.equipment,
      pickup: load.pickupLabel,
      highPay: load.isHighPay,
    }));

  const bidSnapshots = bids.slice(0, 8).map((bid) => ({
    code: getLoadCode(bid.load_id),
    route: buildRoute(bid.loads?.origin, bid.loads?.destination),
    bidAmount: bid.amountLabel,
    loadPrice:
      bid.loads?.price != null
        ? formatWalletMoney(Number(bid.loads.price) || 0)
        : undefined,
    status: bid.status,
  }));

  return {
    carrierName,
    fetchedAt: new Date().toISOString(),
    stats: {
      activeLoads: myLoadsData?.stats.active || 0,
      inTransitLoads: myLoadsData?.stats.inTransit || 0,
      pendingBids: pendingBids.length,
      availableLoads: availableData?.loads.length || 0,
    },
    wallet: {
      availableBalance: formatWalletMoney(wallet?.availableBalance || 0),
      pendingBalance: formatWalletMoney(wallet?.pendingBalance || 0),
      lifetimeEarnings: formatWalletMoney(wallet?.lifetimeEarnings || 0),
    },
    myLoads,
    availableLoads,
    bids: bidSnapshots,
  };
  })()
    .then((result) => {
      if (result) {
        cachedContext = result;
        cachedAt = Date.now();
      }
      return result;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
