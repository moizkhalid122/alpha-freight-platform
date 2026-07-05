import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/carrier-dashboard";

export type CarrierBidLoad = {
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

export type CarrierBid = {
  id: string;
  load_id: string;
  carrier_id: string;
  amount: number;
  amountLabel: string;
  status: string;
  created_at: string;
  loads: CarrierBidLoad | null;
};

export type BidFilter = "all" | "pending" | "accepted" | "rejected";

export const BID_FILTERS: { id: BidFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "rejected", label: "Rejected" },
];

export function getBidStatusMeta(status: string) {
  const value = status.toLowerCase();
  if (value === "accepted") {
    return { label: "Accepted", tone: "success" as const };
  }
  if (value === "rejected" || value === "withdrawn") {
    return { label: value === "withdrawn" ? "Withdrawn" : "Rejected", tone: "danger" as const };
  }
  return { label: "Pending", tone: "pending" as const };
}

export function getLoadCode(loadId: string) {
  return `AF-${loadId.slice(0, 8).toUpperCase()}`;
}

export function formatBidDate(value?: string | null) {
  if (!value) return "TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function getTimeAgo(dateString: string) {
  const diffInHours = (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60);
  if (diffInHours < 1) return `${Math.max(1, Math.floor(diffInHours * 60))}m ago`;
  if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
}

export async function fetchCarrierBids(): Promise<CarrierBid[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: bidRows, error } = await supabase
    .from("bids")
    .select("*")
    .eq("carrier_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchCarrierBids", error);
    throw error;
  }

  const uniqueLoadIds = [...new Set((bidRows || []).map((bid) => bid.load_id))];

  const { data: loadsData } = uniqueLoadIds.length
    ? await supabase
        .from("loads")
        .select("id, origin, destination, price, status, title, equipment, pickup_date, weight")
        .in("id", uniqueLoadIds)
    : { data: [] as CarrierBidLoad[] };

  const loadMap = new Map((loadsData || []).map((load) => [load.id, load]));

  return (bidRows || []).map((bid) => {
    const amount = Number(bid.amount) || 0;
    return {
      id: bid.id,
      load_id: bid.load_id,
      carrier_id: bid.carrier_id,
      amount,
      amountLabel: formatMoney(amount),
      status: bid.status,
      created_at: bid.created_at,
      loads: loadMap.get(bid.load_id) || null,
    };
  });
}

export async function fetchPendingBidForLoad(loadId: string): Promise<CarrierBid | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("bids")
    .select("*")
    .eq("carrier_id", user.id)
    .eq("load_id", loadId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const amount = Number(data.amount) || 0;
  return {
    id: data.id,
    load_id: data.load_id,
    carrier_id: data.carrier_id,
    amount,
    amountLabel: formatMoney(amount),
    status: data.status,
    created_at: data.created_at,
    loads: null,
  };
}

export async function submitCarrierBid(loadId: string, amount: number) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Please sign in again.");

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid bid amount.");
  }

  const { error } = await supabase.from("bids").insert({
    load_id: loadId,
    carrier_id: user.id,
    amount,
    status: "pending",
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function withdrawCarrierBid(bidId: string) {
  const { error } = await supabase
    .from("bids")
    .update({ status: "withdrawn", updated_at: new Date().toISOString() })
    .eq("id", bidId)
    .eq("status", "pending");

  if (error) throw error;
}

export function filterCarrierBids(bids: CarrierBid[], filter: BidFilter): CarrierBid[] {
  if (filter === "all") return bids;
  if (filter === "rejected") {
    return bids.filter((bid) => bid.status === "rejected" || bid.status === "withdrawn");
  }
  return bids.filter((bid) => bid.status === filter);
}

export function getBidStats(bids: CarrierBid[]) {
  return {
    total: bids.length,
    pending: bids.filter((b) => b.status === "pending").length,
    accepted: bids.filter((b) => b.status === "accepted").length,
    rejected: bids.filter((b) => b.status === "rejected" || b.status === "withdrawn").length,
  };
}
