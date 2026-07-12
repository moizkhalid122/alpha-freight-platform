import {
  BID_FILTERS,
  BidFilter,
  formatBidDate,
  getBidStats,
  getBidStatusMeta,
  getLoadCode,
  getTimeAgo,
} from "@/lib/carrier-bids";
import { formatSupplierMoney } from "@/lib/supplier-payments";
import { supabase } from "@/lib/supabase";

export { BID_FILTERS, BidFilter, formatBidDate, getBidStats, getBidStatusMeta, getLoadCode, getTimeAgo };

export type SupplierBidLoad = {
  id: string;
  origin: string | null;
  destination: string | null;
  price: number | string | null;
  status: string | null;
  title?: string | null;
  equipment?: string | null;
  pickup_date?: string | null;
  weight?: number | string | null;
};

export type SupplierBidCarrier = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url?: string | null;
};

export type SupplierBid = {
  id: string;
  load_id: string;
  carrier_id: string;
  amount: number;
  amountLabel: string;
  status: string;
  created_at: string;
  loads: SupplierBidLoad | null;
  carrier: SupplierBidCarrier | null;
  carrierName: string;
  carrierInitials: string;
  loadTitle: string;
  loadCode: string;
  listedPrice: number;
  listedPriceLabel: string;
  priceDiff: number;
  priceDiffLabel: string;
  priceDiffTone: "below" | "above" | "neutral";
};

export type SupplierBidSnapshot = {
  id: string;
  loadId: string;
  loadRoute: string;
  loadBudget: string;
  carrierName: string;
  amount: number;
  amountLabel: string;
  status: string;
  statusLabel: string;
};

export type SupplierBidsSummary = {
  pending: SupplierBidSnapshot[];
  recent: SupplierBidSnapshot[];
  totalPending: number;
};

function formatStatus(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "pending") return "Pending";
  if (normalized === "accepted") return "Accepted";
  if (normalized === "rejected") return "Rejected";
  return value.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildRoute(origin?: string | null, destination?: string | null) {
  return `${origin?.trim() || "Pickup"} → ${destination?.trim() || "Delivery"}`;
}

export function getCarrierInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function getCity(value?: string | null) {
  if (!value) return "—";
  return value.split(",")[0].trim();
}

export function formatEquipmentLabel(value?: string | null) {
  if (!value) return "Equipment TBC";
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatLoadStatus(value?: string | null) {
  if (!value) return "Unknown";
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function mapSupplierBid(
  bid: {
    id: string;
    load_id: string;
    carrier_id: string;
    amount: number | string;
    status: string;
    created_at: string;
  },
  loadMap: Map<string, SupplierBidLoad>,
  carrierMap: Map<string, SupplierBidCarrier>
): SupplierBid {
  const load = loadMap.get(bid.load_id) || null;
  const carrier = carrierMap.get(bid.carrier_id) || null;
  const carrierName = carrier?.company_name?.trim() || carrier?.full_name?.trim() || "Carrier";
  const amount = Number(bid.amount) || 0;
  const listedPrice = Number(load?.price) || 0;
  const priceDiff = listedPrice > 0 ? listedPrice - amount : 0;

  let priceDiffLabel = "";
  let priceDiffTone: SupplierBid["priceDiffTone"] = "neutral";
  if (listedPrice > 0 && priceDiff !== 0) {
    if (priceDiff > 0) {
      priceDiffLabel = `${formatSupplierMoney(priceDiff)} below list`;
      priceDiffTone = "below";
    } else {
      priceDiffLabel = `${formatSupplierMoney(Math.abs(priceDiff))} above list`;
      priceDiffTone = "above";
    }
  }

  return {
    id: bid.id,
    load_id: bid.load_id,
    carrier_id: bid.carrier_id,
    amount,
    amountLabel: formatSupplierMoney(amount),
    status: bid.status,
    created_at: bid.created_at,
    loads: load,
    carrier,
    carrierName,
    carrierInitials: getCarrierInitials(carrierName) || "C",
    loadTitle: load?.title?.trim() || getLoadCode(bid.load_id),
    loadCode: getLoadCode(bid.load_id),
    listedPrice,
    listedPriceLabel: formatSupplierMoney(listedPrice),
    priceDiff,
    priceDiffLabel,
    priceDiffTone,
  };
}

export async function fetchSupplierBids(): Promise<SupplierBid[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: supplierLoads, error: loadsError } = await supabase
    .from("loads")
    .select("id")
    .eq("supplier_id", user.id);

  if (loadsError) throw loadsError;

  const loadIds = (supplierLoads || []).map((load) => load.id);
  if (!loadIds.length) return [];

  const { data: bidRows, error } = await supabase
    .from("bids")
    .select("*")
    .in("load_id", loadIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!bidRows?.length) return [];

  const uniqueLoadIds = [...new Set(bidRows.map((bid) => bid.load_id))];
  const uniqueCarrierIds = [...new Set(bidRows.map((bid) => bid.carrier_id).filter(Boolean))];

  const [{ data: loadsData }, { data: carriersData }] = await Promise.all([
    uniqueLoadIds.length
      ? supabase
          .from("loads")
          .select("id, origin, destination, price, status, title, equipment, pickup_date, weight")
          .in("id", uniqueLoadIds)
      : Promise.resolve({ data: [] as SupplierBidLoad[] }),
    uniqueCarrierIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, company_name, avatar_url")
          .in("id", uniqueCarrierIds)
      : Promise.resolve({ data: [] as SupplierBidCarrier[] }),
  ]);

  const loadMap = new Map((loadsData || []).map((load) => [load.id, load]));
  const carrierMap = new Map((carriersData || []).map((carrier) => [carrier.id, carrier]));

  return bidRows.map((bid) => mapSupplierBid(bid, loadMap, carrierMap));
}

export async function fetchSupplierBidsSummary(): Promise<SupplierBidsSummary | null> {
  const bids = await fetchSupplierBids().catch(() => null);
  if (!bids) return null;

  const snapshots: SupplierBidSnapshot[] = bids.map((bid) => ({
    id: bid.id,
    loadId: bid.load_id,
    loadRoute: buildRoute(bid.loads?.origin, bid.loads?.destination),
    loadBudget: bid.listedPriceLabel,
    carrierName: bid.carrierName,
    amount: bid.amount,
    amountLabel: bid.amountLabel,
    status: bid.status,
    statusLabel: formatStatus(bid.status),
  }));

  const pending = snapshots.filter((bid) => bid.status.toLowerCase() === "pending");

  return {
    pending,
    recent: snapshots.slice(0, 6),
    totalPending: pending.length,
  };
}

export async function acceptSupplierBid(bidId: string) {
  const { data: bid, error: bidFetchError } = await supabase
    .from("bids")
    .select("*")
    .eq("id", bidId)
    .single();

  if (bidFetchError) throw bidFetchError;

  const { error: updateBidError } = await supabase
    .from("bids")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", bidId);

  if (updateBidError) throw updateBidError;

  const { error: rejectOtherBidsError } = await supabase
    .from("bids")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("load_id", bid.load_id)
    .neq("id", bidId);

  if (rejectOtherBidsError) throw rejectOtherBidsError;

  const { data: updatedLoad, error: updateLoadError } = await supabase
    .from("loads")
    .update({
      carrier_id: bid.carrier_id,
      status: "booked",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bid.load_id)
    .select("id, carrier_id, status")
    .maybeSingle();

  if (updateLoadError) throw updateLoadError;

  if (!updatedLoad || updatedLoad.carrier_id !== bid.carrier_id || updatedLoad.status !== "booked") {
    throw new Error(
      "Load update blocked. Contact support if carrier assignment did not complete."
    );
  }
}

export async function rejectSupplierBid(bidId: string) {
  const { error } = await supabase
    .from("bids")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", bidId);

  if (error) throw error;
}

export function filterSupplierBids(bids: SupplierBid[], filter: BidFilter): SupplierBid[] {
  if (filter === "all") return bids;
  if (filter === "rejected") {
    return bids.filter((bid) => bid.status === "rejected" || bid.status === "withdrawn");
  }
  return bids.filter((bid) => bid.status === filter);
}

export function searchSupplierBids(bids: SupplierBid[], query: string): SupplierBid[] {
  const value = query.trim().toLowerCase();
  if (!value) return bids;

  return bids.filter((bid) => {
    const haystack = [
      bid.carrierName,
      bid.loadTitle,
      bid.loadCode,
      bid.loads?.origin,
      bid.loads?.destination,
      bid.loads?.equipment,
      bid.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(value);
  });
}
