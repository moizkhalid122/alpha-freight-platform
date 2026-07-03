"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  AlertCircle,
  Gavel,
  Calendar,
  Package,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type BidRow = {
  id: string;
  load_id: string;
  carrier_id: string;
  amount: number | string;
  status: string;
  created_at: string;
  loads?: {
    id: string;
    origin: string | null;
    destination: string | null;
    price: number | string | null;
    status: string | null;
    title?: string | null;
    equipment?: string | null;
    pickup_date?: string | null;
    weight?: number | string | null;
  } | null;
  carrier?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    avatar_url?: string | null;
  } | null;
};

const FILTERS = ["all", "pending", "accepted", "rejected"] as const;

const BID_STATUS_STYLES: Record<string, { pill: string; accent: string }> = {
  pending: { pill: "bg-amber-50 text-amber-700", accent: "from-amber-400 to-orange-400" },
  accepted: { pill: "bg-emerald-50 text-emerald-700", accent: "from-emerald-400 to-teal-400" },
  rejected: { pill: "bg-rose-50 text-rose-600", accent: "from-rose-400 to-red-400" },
};

function formatMoney(value: number | string | null | undefined) {
  return `£${(Number(value) || 0).toLocaleString("en-GB")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCity(value: string | null | undefined) {
  if (!value) return "—";
  return value.split(",")[0].trim();
}

function getLoadCode(loadId: string) {
  return `AF-${loadId.slice(0, 8).toUpperCase()}`;
}

function getCarrierInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function SupplierBids() {
  const [bids, setBids] = useState<BidRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3500);
  };

  const fetchBids = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setBids([]);
        return;
      }

      const { data: supplierLoads, error: loadsError } = await supabase
        .from("loads")
        .select("id")
        .eq("supplier_id", user.id);

      if (loadsError) throw loadsError;

      const loadIds = (supplierLoads || []).map((load) => load.id);

      if (loadIds.length === 0) {
        setBids([]);
        return;
      }

      const { data: bidRows, error } = await supabase
        .from("bids")
        .select("*")
        .in("load_id", loadIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const uniqueLoadIds = [...new Set((bidRows || []).map((bid) => bid.load_id))];
      const uniqueCarrierIds = [...new Set((bidRows || []).map((bid) => bid.carrier_id))];

      const [{ data: loadsData }, { data: carriersData }] = await Promise.all([
        uniqueLoadIds.length
          ? supabase
              .from("loads")
              .select("id, origin, destination, price, status, title, equipment, pickup_date, weight")
              .in("id", uniqueLoadIds)
          : Promise.resolve({ data: [] as BidRow["loads"][] }),
        uniqueCarrierIds.length
          ? supabase
              .from("profiles")
              .select("id, full_name, company_name, avatar_url")
              .in("id", uniqueCarrierIds)
          : Promise.resolve({ data: [] as BidRow["carrier"][] }),
      ]);

      const loadMap = new Map(
        (loadsData ?? [])
          .filter((load): load is NonNullable<typeof load> => load != null)
          .map((load) => [load.id, load] as const)
      );
      const carrierMap = new Map(
        (carriersData ?? [])
          .filter((carrier): carrier is NonNullable<typeof carrier> => carrier != null)
          .map((carrier) => [carrier.id, carrier] as const)
      );

      setBids(
        (bidRows || []).map((bid) => ({
          ...bid,
          loads: loadMap.get(bid.load_id) || null,
          carrier: carrierMap.get(bid.carrier_id) || null,
        }))
      );
    } catch (error) {
      console.error("Error fetching bids:", error);
      showToast("error", "Unable to load bids right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBidAction = async (bidId: string, action: string) => {
    try {
      setActionId(bidId);

      const { data: bid, error: bidFetchError } = await supabase
        .from("bids")
        .select("*")
        .eq("id", bidId)
        .single();

      if (bidFetchError) throw bidFetchError;

      if (action === "accept") {
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
            "Load update blocked. Run supplier-platform.sql in Supabase to fix loads/bids RLS policies."
          );
        }

        showToast("success", "Bid accepted. Carrier has been assigned to this load.");
      } else {
        const { error: rejectBidError } = await supabase
          .from("bids")
          .update({ status: "rejected", updated_at: new Date().toISOString() })
          .eq("id", bidId);

        if (rejectBidError) throw rejectBidError;
        showToast("success", "Bid rejected.");
      }

      await fetchBids();
    } catch (error) {
      console.error("Error handling bid action:", error);
      showToast("error", error instanceof Error ? error.message : "We could not update this bid.");
    } finally {
      setActionId(null);
    }
  };

  useEffect(() => {
    void fetchBids();

    const channel = supabase
      .channel("supplier-my-bids")
      .on("postgres_changes", { event: "*", schema: "public", table: "bids" }, () => {
        void fetchBids();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "loads" }, () => {
        void fetchBids();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBids]);

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const bidDate = new Date(dateString);
    const diffInHours = (now.getTime() - bidDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return `${Math.max(1, Math.floor(diffInHours * 60))}m ago`;
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const filteredBids = useMemo(() => {
    if (filter === "all") return bids;
    return bids.filter((bid) => bid.status === filter);
  }, [bids, filter]);

  const stats = useMemo(() => {
    return {
      total: bids.length,
      pending: bids.filter((b) => b.status === "pending").length,
      accepted: bids.filter((b) => b.status === "accepted").length,
      rejected: bids.filter((b) => b.status === "rejected").length,
    };
  }, [bids]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1280px] mx-auto">
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-slate-400" />
          <p className="text-[13px] text-slate-500">Loading bids…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1280px] mx-auto space-y-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`fixed left-1/2 top-24 z-[120] -translate-x-1/2 rounded-xl border px-4 py-2.5 shadow-lg ${
              toast.type === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-rose-100 bg-rose-50 text-rose-700"
            }`}
          >
            <div className="flex items-center gap-2 text-[13px] font-medium">
              {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span>{toast.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <div className="rounded-md bg-slate-900 p-1.5">
                <Gavel className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Carrier Offers</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Bid management</h1>
            <p className="mt-0.5 text-[13px] text-slate-500">Review, compare and accept carrier bids on your loads</p>
          </div>

          <div className="flex gap-1 rounded-lg bg-slate-100/80 p-1">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-md px-4 py-1.5 text-[11px] font-semibold capitalize transition ${
                  filter === item ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total bids", value: stats.total },
            { label: "Pending", value: stats.pending },
            { label: "Accepted", value: stats.accepted },
            { label: "Rejected", value: stats.rejected },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] text-slate-500">{stat.label}</p>
              <p className="mt-0.5 text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="space-y-3">
        {filteredBids.length > 0 ? (
          filteredBids.map((bid, index) => {
            const carrierName =
              bid.carrier?.company_name?.trim() || bid.carrier?.full_name?.trim() || "Carrier";
            const statusStyle = BID_STATUS_STYLES[bid.status] || BID_STATUS_STYLES.pending;
            const bidAmount = Number(bid.amount || 0);
            const listedPrice = Number(bid.loads?.price || 0);
            const priceDiff = listedPrice > 0 ? listedPrice - bidAmount : 0;
            const loadTitle = bid.loads?.title || getLoadCode(bid.load_id);

            return (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="group relative overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-md"
              >
                <div className={`absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${statusStyle.accent}`} />

                <div className="grid gap-4 p-4 pl-5 lg:grid-cols-[200px_minmax(0,1fr)_168px] lg:items-center lg:gap-6">
                  {/* Carrier profile */}
                  <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-2">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-[12px] font-bold text-white">
                      {bid.carrier?.avatar_url ? (
                        <img src={bid.carrier.avatar_url} alt={carrierName} className="h-full w-full object-cover" />
                      ) : (
                        getCarrierInitials(carrierName) || "C"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-slate-900">{carrierName}</p>
                      <p className="text-[11px] text-slate-400">Carrier · {getTimeAgo(bid.created_at)}</p>
                    </div>
                  </div>

                  {/* Load & route */}
                  <div className="min-w-0 border-slate-100 lg:border-l lg:pl-5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${statusStyle.pill}`}>
                        {bid.status}
                      </span>
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-600">
                        Load {bid.loads?.status || "unknown"}
                      </span>
                      <span className="text-[11px] text-slate-400">{getLoadCode(bid.load_id)}</span>
                    </div>

                    <p className="mt-1.5 truncate text-[13px] font-medium text-slate-800">{loadTitle}</p>

                    <div className="mt-2.5 flex items-stretch gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">From</p>
                        <p className="truncate text-[13px] font-semibold capitalize text-slate-900">{getCity(bid.loads?.origin)}</p>
                        <p className="truncate text-[11px] text-slate-500">{bid.loads?.origin || "—"}</p>
                      </div>
                      <div className="flex shrink-0 items-center px-1">
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="min-w-0 flex-1 text-right">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">To</p>
                        <p className="truncate text-[13px] font-semibold capitalize text-slate-900">{getCity(bid.loads?.destination)}</p>
                        <p className="truncate text-[11px] text-slate-500">{bid.loads?.destination || "—"}</p>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Pickup {formatDate(bid.loads?.pickup_date)}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {formatLabel(bid.loads?.equipment)}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {bid.loads?.weight ? `${bid.loads.weight} kg` : "Weight TBC"}
                      </span>
                    </div>
                  </div>

                  {/* Price + actions */}
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                    <div>
                      <p className="text-[11px] text-slate-400">Bid amount</p>
                      <p className="text-[20px] font-bold leading-tight text-slate-900">{formatMoney(bidAmount)}</p>
                      {listedPrice > 0 ? (
                        <>
                          <p className="mt-0.5 text-[11px] text-slate-500">Listed {formatMoney(listedPrice)}</p>
                          {priceDiff !== 0 && (
                            <p className={`mt-0.5 text-[11px] font-medium ${priceDiff > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                              {priceDiff > 0
                                ? `${formatMoney(priceDiff)} below list`
                                : `${formatMoney(Math.abs(priceDiff))} above list`}
                            </p>
                          )}
                        </>
                      ) : null}
                    </div>

                    {bid.status === "pending" ? (
                      <>
                        <button
                          type="button"
                          disabled={actionId === bid.id}
                          onClick={() => handleBidAction(bid.id, "accept")}
                          className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                        >
                          {actionId === bid.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Accept bid"}
                        </button>
                        <button
                          type="button"
                          disabled={actionId === bid.id}
                          onClick={() => handleBidAction(bid.id, "reject")}
                          className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <span
                        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold capitalize ${
                          bid.status === "accepted"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-600"
                        }`}
                      >
                        {bid.status === "accepted" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {bid.status}
                      </span>
                    )}

                    <Link
                      href="/supplier/my-posts"
                      className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      View load
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
            <Truck className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900">
              {filter === "all" ? "No bids yet" : `No ${filter} bids`}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[13px] text-slate-500">
              {filter === "all"
                ? "Once carriers bid on your loads, offers will appear here for review."
                : "Try another filter to see more bids."}
            </p>
            {filter === "all" && (
              <Link
                href="/supplier/post-load"
                className="mt-5 inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
              >
                Post a load
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
