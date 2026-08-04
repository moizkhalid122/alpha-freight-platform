"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Package,
  Timer,
  Truck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getSupplierPaymentOrdersForUser,
  migrateLocalPaymentsToSupabase,
  moveSupplierPaymentToInstant,
  type SupplierPaymentRecord,
} from "@/lib/supplier-payments";

type LoadRow = {
  id: string;
  origin: string | null;
  destination: string | null;
  price: number | string | null;
  status: string | null;
  pickup_date: string | null;
  equipment: string | null;
  weight?: number | string | null;
  created_at: string | null;
  title?: string | null;
  payment_route?: string | null;
  payment_state?: string | null;
};

type PaymentQueueItem = SupplierPaymentRecord & {
  loadStatus: string;
  pickupDate: string;
  weight?: string | number | null;
};

function formatMoney(value: number | string | null | undefined) {
  return `£${(Number(value) || 0).toLocaleString("en-GB")}`;
}

function formatDate(value?: string | null) {
  if (!value || value === "Schedule pending") return "To be scheduled";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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

function SupplierPayLaterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [orders, setOrders] = useState<PaymentQueueItem[]>([]);
  const [supplierName, setSupplierName] = useState("Supplier");
  const [loading, setLoading] = useState(true);
  const [movingLoadId, setMovingLoadId] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      setSupplierName(profile?.full_name || "Supplier");

      await migrateLocalPaymentsToSupabase(user.id);

      const remoteOrders = await getSupplierPaymentOrdersForUser(user.id);
      const queueOrders = remoteOrders.filter((item) => item.paymentState !== "paid");

      const { data: loads } = await supabase
        .from("loads")
        .select("id, origin, destination, price, status, pickup_date, equipment, weight, created_at, title, payment_state, payment_route")
        .eq("supplier_id", user.id)
        .eq("payment_state", "pending")
        .order("created_at", { ascending: false });

      const loadMap = new Map<string, LoadRow>((loads || []).map((load) => [load.id, load]));

      const orderLoadIds = new Set(queueOrders.map((order) => order.loadId));

      const orphanQueueItems: PaymentQueueItem[] = (loads || [])
        .filter((load) => !orderLoadIds.has(load.id))
        .map((load) => ({
          loadId: load.id,
          supplierId: user.id,
          paymentRoute: (load.payment_route as "pay-now" | "pay-later") || "pay-later",
          paymentState: "pending" as const,
          amount: load.price ? Number(load.price) : 0,
          title: load.title || `${load.origin || "Origin"} → ${load.destination || "Destination"}`,
          origin: load.origin || "",
          destination: load.destination || "",
          equipment: load.equipment || "General freight",
          createdAt: load.created_at || new Date().toISOString(),
          dueLabel: load.payment_route === "pay-now" ? "Checkout incomplete" : "Due within 7 days",
          paymentMethod: "card",
          loadStatus: load.status || "pending-payment",
          pickupDate: load.pickup_date || "Schedule pending",
          weight: load.weight ?? null,
        }));

      const mergedOrders: PaymentQueueItem[] = [...queueOrders, ...orphanQueueItems].map((order) => {
        const load = loadMap.get(order.loadId);
        return {
          ...order,
          amount: load?.price ? Number(load.price) : order.amount,
          origin: load?.origin || order.origin,
          destination: load?.destination || order.destination,
          equipment: load?.equipment || order.equipment,
          weight: load?.weight ?? null,
          createdAt: load?.created_at || order.createdAt,
          loadStatus: load?.status || "active",
          pickupDate: load?.pickup_date || "Schedule pending",
        };
      });

      setOrders(mergedOrders);
      setLoading(false);
    };

    void fetchQueue();
  }, []);

  const stats = useMemo(() => {
    const pending = orders.filter((order) => order.paymentState === "pending");
    const paid = orders.filter((order) => order.paymentState === "paid");
    return {
      queued: pending.length,
      pendingValue: pending.reduce((total, order) => total + Number(order.amount || 0), 0),
      paid: paid.length,
      total: orders.length,
    };
  }, [orders]);

  const handleMoveToInstant = async (order: PaymentQueueItem) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    try {
      setMovingLoadId(order.loadId);
      await moveSupplierPaymentToInstant({
        supplierId: user.id,
        loadId: order.loadId,
      });
      router.push(`/supplier/pay-instant?load=${order.loadId}`);
    } finally {
      setMovingLoadId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <div className="rounded-md bg-amber-500 p-1.5">
                <Timer className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Deferred payments</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Pay later queue</h1>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Manage loads posted with deferred payment — move to card checkout when ready, {supplierName}.
            </p>
          </div>

          <Link
            href="/supplier/post-load"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
          >
            Post a load
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Queued loads", value: stats.queued },
            { label: "Pending value", value: formatMoney(stats.pendingValue) },
            { label: "Paid", value: stats.paid },
            { label: "Total in queue", value: stats.total },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] text-slate-500">{stat.label}</p>
              <p className="mt-0.5 text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-slate-400" />
            <p className="text-[13px] text-slate-500">Loading payment queue…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900">No deferred payments</h3>
            <p className="mx-auto mt-2 max-w-md text-[13px] text-slate-500">
              Choose Pay Later when posting a load and it will appear here until you pay.
            </p>
            <Link
              href="/supplier/post-load"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
            >
              Post a load
            </Link>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {orders.map((order, index) => {
              const isHighlighted = highlightId === order.loadId;
              const isPaid = order.paymentState === "paid";
              const isPending = order.paymentState === "pending";

              return (
                <motion.div
                  key={order.loadId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={`relative overflow-hidden rounded-xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-md ${
                    isHighlighted ? "border-slate-300" : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`absolute inset-y-0 left-0 w-[3px] ${
                      isPaid ? "bg-gradient-to-b from-emerald-400 to-teal-400" : "bg-gradient-to-b from-amber-400 to-orange-400"
                    }`}
                  />

                  <div className="grid gap-4 p-4 pl-5 lg:grid-cols-[120px_minmax(0,1fr)_168px] lg:items-center lg:gap-6">
                    {/* Amount */}
                    <div className="lg:border-r lg:border-slate-100 lg:pr-4">
                      <p className="text-[22px] font-bold leading-none tracking-tight text-slate-900">
                        {formatMoney(order.amount)}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-slate-400">{getLoadCode(order.loadId)}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{order.dueLabel || "Due when ready"}</p>
                    </div>

                    {/* Load details */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          {order.paymentRoute === "pay-now" ? "Checkout skipped" : "Pay later"}
                        </span>
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-600">
                          Load {order.loadStatus}
                        </span>
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {isPaid ? "Paid" : "Payment pending"}
                        </span>
                        {isHighlighted && (
                          <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            Just posted
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 truncate text-[14px] font-semibold text-slate-900">{order.title}</p>

                      <div className="mt-2.5 flex items-stretch gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">From</p>
                          <p className="truncate text-[13px] font-semibold capitalize text-slate-900">{getCity(order.origin)}</p>
                          <p className="truncate text-[11px] text-slate-500">{order.origin || "—"}</p>
                        </div>
                        <div className="flex shrink-0 items-center px-1">
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1 text-right">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">To</p>
                          <p className="truncate text-[13px] font-semibold capitalize text-slate-900">{getCity(order.destination)}</p>
                          <p className="truncate text-[11px] text-slate-500">{order.destination || "—"}</p>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Pickup {formatDate(order.pickupDate)}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          {formatLabel(order.equipment)}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {order.weight ? `${order.weight} kg` : "Weight TBC"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                      {isPaid ? (
                        <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Paid
                        </span>
                      ) : isPending ? (
                        <button
                          type="button"
                          onClick={() => handleMoveToInstant(order)}
                          disabled={movingLoadId === order.loadId}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                        >
                          {movingLoadId === order.loadId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CreditCard className="h-3.5 w-3.5" />
                          )}
                          Pay now
                        </button>
                      ) : null}

                      <Link
                        href={`/supplier/my-posts`}
                        className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default function SupplierPayLaterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SupplierPayLaterPageContent />
    </Suspense>
  );
}
