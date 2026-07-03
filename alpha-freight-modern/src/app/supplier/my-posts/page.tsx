"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  ClipboardList,
  Package,
  MapPin,
  Clock,
  MoreVertical,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Truck,
  X,
  ArrowRight,
  CreditCard,
  FileCheck,
  ExternalLink,
  Eye,
  XCircle,
} from "lucide-react";
import { getSupplierPaymentOrdersForUser, resolveSupplierPaymentState, type SupplierPaymentRecord } from "@/lib/supplier-payments";
import {
  getPodVerificationMeta,
  hasSubmittedPod,
  isShipmentFullyClosed,
  needsSupplierPodReview,
  type LoadPodFields,
} from "@/lib/load-pod-verification";

type LoadPost = LoadPodFields & {
  id: string;
  origin: string | null;
  destination: string | null;
  price: number | string | null;
  status: string;
  pickup_date: string | null;
  delivery_date: string | null;
  equipment: string | null;
  weight: number | string | null;
  carrier_id: string | null;
  created_at: string;
  payment_route?: string | null;
  payment_state?: string | null;
  commodity?: string | null;
  notes?: string | null;
  special_instructions?: string | null;
};

const FILTERS = ["all", "active", "booked", "in-transit", "pod-review", "completed"] as const;

const OVERLAY_CLASS =
  "fixed inset-0 z-[200] min-h-[100dvh] w-screen bg-slate-900/45 backdrop-blur-[6px]";

const STATUS_STYLES: Record<string, { pill: string; accent: string; surface: string; label: string }> = {
  active: {
    pill: "bg-blue-50 text-blue-700 border border-blue-100",
    accent: "from-blue-500 to-cyan-500",
    surface: "bg-blue-50/70",
    label: "Live In Marketplace",
  },
  booked: {
    pill: "bg-amber-50 text-amber-700 border border-amber-100",
    accent: "from-amber-500 to-orange-500",
    surface: "bg-amber-50/70",
    label: "Carrier Secured",
  },
  "in-transit": {
    pill: "bg-violet-50 text-violet-700 border border-violet-100",
    accent: "from-violet-500 to-fuchsia-500",
    surface: "bg-violet-50/70",
    label: "In Movement",
  },
  completed: {
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    accent: "from-emerald-500 to-teal-500",
    surface: "bg-emerald-50/70",
    label: "Operationally Closed",
  },
  "pending-payment": {
    pill: "bg-slate-100 text-slate-600 border border-slate-200",
    accent: "from-slate-400 to-slate-500",
    surface: "bg-slate-50/70",
    label: "Awaiting Payment",
  },
  "pod-review": {
    pill: "bg-violet-50 text-violet-700 border border-violet-100",
    accent: "from-violet-500 to-purple-500",
    surface: "bg-violet-50/70",
    label: "POD Review",
  },
  delivered: {
    pill: "bg-cyan-50 text-cyan-700 border border-cyan-100",
    accent: "from-cyan-500 to-blue-500",
    surface: "bg-cyan-50/70",
    label: "Delivered — Review POD",
  },
};

function formatMoney(value: number | string | null | undefined) {
  return `£${(Number(value) || 0).toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return "TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusMeta(status: string) {
  return STATUS_STYLES[status] || STATUS_STYLES.active;
}

function getEffectiveLoadStatus(status: string, paymentState: string) {
  if (paymentState !== "paid" && (status === "active" || status === "pending-payment")) {
    return "pending-payment";
  }
  return status;
}

function getStatusSummary(status: string, paymentState = "pending", load?: LoadPodFields) {
  const effectiveStatus = getEffectiveLoadStatus(status, paymentState);
  if (effectiveStatus === "pending-payment") {
    return "Payment is pending. Your load will go live once payment is complete.";
  }
  if (load && needsSupplierPodReview(load)) {
    return getPodVerificationMeta(load.pod_verification_status).summary;
  }
  if (load && hasSubmittedPod(load) && isShipmentFullyClosed(load)) {
    return "Delivery proof verified. Shipment is fully closed.";
  }
  if (status === "active") return "Your load is live and waiting for carrier demand.";
  if (status === "booked") return "Capacity is locked. Carrier handoff can now begin.";
  if (status === "in-transit") return "The shipment is currently moving through execution.";
  if (status === "delivered") return "Carrier marked delivery complete. Review POD to close the shipment.";
  if (status === "completed" || status === "delivered") return "Shipment cycle is complete and archived in history.";
  return "Shipment record is live in your network.";
}

function getShortCode(id: string) {
  return `AF-${id.slice(0, 8).toUpperCase()}`;
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCity(value: string | null | undefined) {
  if (!value) return "—";
  return value.split(",")[0].trim();
}

function isLoadClosed(status: string) {
  return status === "completed" || status === "delivered";
}

function getPaymentBadge(
  paymentState: string,
  paymentRoute: string,
  loadStatus: string
): { label: string; className: string } | null {
  if (paymentState === "paid") {
    return { label: "Paid", className: "bg-emerald-50 text-emerald-700" };
  }
  if (isLoadClosed(loadStatus)) {
    return null;
  }
  if (paymentRoute === "pay-now") {
    return { label: "Payment due", className: "bg-amber-50 text-amber-700" };
  }
  return { label: "Pay later", className: "bg-amber-50 text-amber-700" };
}

function showPaymentAction(paymentState: string, loadStatus: string) {
  if (paymentState === "paid") return "paid";
  if (isLoadClosed(loadStatus)) return "none";
  return "pay";
}

function matchesFilter(post: LoadPost, filter: string, paymentState: string) {
  if (filter === "all") return true;
  if (filter === "pod-review") return needsSupplierPodReview(post);
  if (filter === "completed") {
    if (needsSupplierPodReview(post)) return false;
    return post.status === "completed" || post.status === "delivered";
  }
  if (filter === "active") {
    return post.status === "active" && paymentState === "paid";
  }
  return post.status === filter;
}

function getPostStatusMeta(post: LoadPost, paymentState: string) {
  if (needsSupplierPodReview(post)) return getStatusMeta("pod-review");
  const effectiveStatus = getEffectiveLoadStatus(post.status, paymentState);
  if (post.status === "delivered" && !isShipmentFullyClosed(post)) {
    return getStatusMeta("delivered");
  }
  return getStatusMeta(effectiveStatus);
}

export default function MyPostsPage() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<LoadPost[]>([]);
  const [payments, setPayments] = useState<SupplierPaymentRecord[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedPost, setSelectedPost] = useState<LoadPost | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [podPreview, setPodPreview] = useState<{
    loadId: string;
    url: string;
    name: string;
    canReview: boolean;
  } | null>(null);
  const [podConfirm, setPodConfirm] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const hasOverlay = Boolean(selectedPost || podPreview || podConfirm);
    if (!hasOverlay) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedPost, podPreview, podConfirm]);

  const showToast = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    window.setTimeout(() => setActionMessage(null), 2500);
  };

  const reviewPod = async (
    loadId: string,
    decision: "verified" | "rejected" | "info_required",
    note?: string
  ) => {
    try {
      setUpdatingId(loadId);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please sign in again.");
      }

      const response = await fetch("/api/supplier/review-pod", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ loadId, decision, note }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        load?: LoadPost;
      };

      if (!response.ok || !payload.load) {
        throw new Error(
          payload.error ||
            "Unable to update POD review. Run carrier-pod-setup.sql in Supabase, then try again."
        );
      }

      const data = payload.load;

      setPosts((prev) => prev.map((post) => (post.id === loadId ? data : post)));
      setSelectedPost((prev) => (prev?.id === loadId ? data : prev));
      setPodPreview(null);
      setPodConfirm(null);
      showToast(
        "success",
        decision === "verified"
          ? "POD approved. Shipment is now fully completed."
          : decision === "rejected"
            ? "POD rejected. Carrier can reupload."
            : "Requested more information from carrier."
      );
    } catch (error) {
      console.error("POD review error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "We could not update POD review right now.";
      showToast("error", message);
    } finally {
      setUpdatingId(null);
    }
  };

  const openPodPreview = (post: LoadPost) => {
    if (!post.pod_url) {
      showToast("error", "No POD document is available for this load yet.");
      return;
    }
    setPodPreview({
      loadId: post.id,
      url: post.pod_url,
      name: post.pod_name || "Proof of delivery",
      canReview: needsSupplierPodReview(post),
    });
    setPodConfirm(null);
  };

  const handleConfirmPodReview = async () => {
    if (!podPreview || !podConfirm) return;
    if (podConfirm === "approve") {
      await reviewPod(podPreview.loadId, "verified");
      return;
    }
    await reviewPod(
      podPreview.loadId,
      "rejected",
      "POD rejected — carrier must reupload a signed delivery document."
    );
  };

  const updateLoadStatus = async (loadId: string, newStatus: string) => {
    try {
      setUpdatingId(loadId);
      const { error } = await supabase
        .from("loads")
        .update({ status: newStatus })
        .eq("id", loadId);

      if (error) throw error;

      setPosts((prev) =>
        prev.map((post) => (post.id === loadId ? { ...post, status: newStatus } : post))
      );
      setSelectedPost((prev) => (prev?.id === loadId ? { ...prev, status: newStatus } : prev));
      showToast("success", newStatus === "in-transit" ? "Load moved to in transit." : "Load marked as completed.");
    } catch (error) {
      console.error("Error updating load status:", error);
      showToast("error", "We could not update this shipment right now.");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setPosts([]);
          return;
        }

        const { data, error } = await supabase
          .from("loads")
          .select("*")
          .eq("supplier_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPosts((data || []) as LoadPost[]);

        const paymentRecords = await getSupplierPaymentOrdersForUser(user.id);
        setPayments(paymentRecords);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();

    const loadsChannel = supabase
      .channel("schema-db-changes-posts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loads",
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel("schema-db-changes-supplier-payments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "supplier_payments",
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(loadsChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, []);

  const paymentByLoadId = useMemo(() => {
    return new Map(payments.map((payment) => [payment.loadId, payment]));
  }, [payments]);

  const getPostPaymentState = (post: LoadPost) => {
    const payment = paymentByLoadId.get(post.id);
    return resolveSupplierPaymentState(post.payment_state, payment?.paymentState);
  };

  const podReviewCount = useMemo(
    () => posts.filter((post) => needsSupplierPodReview(post)).length,
    [posts]
  );

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const paymentState = getPostPaymentState(post);
      return matchesFilter(post, filter, paymentState);
    });
  }, [posts, filter, paymentByLoadId]);

  return (
    <div className="p-4 sm:p-6 max-w-[1280px] mx-auto space-y-6">
      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed left-1/2 top-24 z-[120] -translate-x-1/2 rounded-2xl border px-5 py-3 shadow-2xl ${
              actionMessage.type === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-rose-100 bg-rose-50 text-rose-700"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              {actionMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{actionMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-slate-900 rounded-md">
              <ClipboardList className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Freight Inventory</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Postings</h1>
          <p className="text-slate-500 text-[13px] mt-0.5">
            Track loads and verify carrier proof of delivery before closing shipments
          </p>
          {podReviewCount > 0 ? (
            <p className="mt-1 text-[12px] font-medium text-violet-600">
              {podReviewCount} shipment{podReviewCount === 1 ? "" : "s"} awaiting POD review
            </p>
          ) : null}
        </div>

        <div className="flex gap-1 p-1 bg-slate-100/80 rounded-lg w-fit">
          {FILTERS.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-4 py-1.5 rounded-md text-[11px] font-semibold capitalize transition-all ${
                filter === item ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {item.replace("-", " ")}
              {item === "pod-review" && podReviewCount > 0 ? (
                <span className="ml-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-700">
                  {podReviewCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-slate-400" />
              <p className="text-[13px] text-slate-500">Loading postings…</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post, index) => {
              const payment = paymentByLoadId.get(post.id);
              const paymentState = getPostPaymentState(post);
              const paymentRoute = payment?.paymentRoute || post.payment_route || "pay-later";
              const statusMeta = getPostStatusMeta(post, paymentState);
              const displayStatus = needsSupplierPodReview(post)
                ? "pod review"
                : getEffectiveLoadStatus(post.status, paymentState).replace("-", " ");
              const podMeta = hasSubmittedPod(post)
                ? getPodVerificationMeta(post.pod_verification_status)
                : null;
              const awaitingPodReview = needsSupplierPodReview(post);
              const primaryAction =
                post.status === "booked"
                  ? { label: "Mark In Transit", nextStatus: "in-transit", className: "bg-amber-600 hover:bg-amber-700" }
                  : null;

              const paymentBadge = getPaymentBadge(paymentState, paymentRoute, post.status);
              const paymentAction = showPaymentAction(paymentState, post.status);

              return (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="group relative overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-slate-300 hover:shadow-md"
                >
                  <div className={`absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${statusMeta.accent}`} />
                  <button
                    type="button"
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 opacity-0 transition hover:bg-slate-50 hover:text-slate-600 group-hover:opacity-100"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex flex-col gap-3 p-4 pl-5 pr-10 sm:p-4 sm:pl-5 sm:pr-10 lg:flex-row lg:items-center lg:gap-5">
                    {/* Price block */}
                    <div className="flex shrink-0 items-center gap-4 lg:w-[108px] lg:flex-col lg:items-start lg:gap-0.5">
                      <p className="text-[22px] font-bold leading-none tracking-tight text-slate-900">
                        {formatMoney(post.price)}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400">{getShortCode(post.id)}</p>
                    </div>

                    {/* Main info */}
                    <div className="min-w-0 flex-1 border-slate-100 lg:border-l lg:pl-5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${statusMeta.pill}`}>
                          {displayStatus}
                        </span>
                        {podMeta ? (
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${podMeta.pill}`}>
                            {podMeta.label}
                          </span>
                        ) : null}
                        {paymentBadge ? (
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${paymentBadge.className}`}>
                            {paymentBadge.label}
                          </span>
                        ) : null}
                        {post.commodity ? (
                          <span className="text-[11px] text-slate-400">{formatLabel(post.commodity)}</span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold capitalize text-slate-900">{getCity(post.origin)}</p>
                          <p className="truncate text-[11px] text-slate-500 max-w-[180px]">{post.origin || "Origin pending"}</p>
                        </div>
                        <div className="flex items-center gap-1 text-slate-300">
                          <div className="hidden h-px w-6 bg-slate-200 sm:block" />
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <div className="hidden h-px w-6 bg-slate-200 sm:block" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold capitalize text-slate-900">{getCity(post.destination)}</p>
                          <p className="truncate text-[11px] text-slate-500 max-w-[180px]">{post.destination || "Destination pending"}</p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Pickup {formatDate(post.pickup_date)}
                        </span>
                        <span className="hidden text-slate-300 sm:inline">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Posted {formatDate(post.created_at)}
                        </span>
                        <span className="hidden text-slate-300 sm:inline">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          {formatLabel(post.equipment)}
                        </span>
                        <span className="hidden text-slate-300 sm:inline">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {post.weight ? `${post.weight} kg` : "Weight TBC"}
                        </span>
                        <span className="hidden text-slate-300 sm:inline">·</span>
                        <span>
                          Carrier {post.carrier_id ? `· ${String(post.carrier_id).slice(0, 8)}` : "· Unassigned"}
                        </span>
                        {post.delivery_date ? (
                          <>
                            <span className="hidden text-slate-300 sm:inline">·</span>
                            <span>Delivery {formatDate(post.delivery_date)}</span>
                          </>
                        ) : null}
                      </div>

                      <p className="mt-2 text-[11px] leading-relaxed text-slate-400 line-clamp-1">
                        {getStatusSummary(post.status, paymentState, post)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-row flex-wrap items-center gap-2 border-t border-slate-100 pt-3 lg:w-[168px] lg:flex-col lg:items-stretch lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                      {paymentAction === "paid" ? (
                        <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700 lg:flex-none">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Paid
                        </span>
                      ) : paymentAction === "pay" ? (
                        <Link
                          href={
                            paymentRoute === "pay-now"
                              ? `/supplier/pay-instant?load=${post.id}`
                              : `/supplier/pay-later?highlight=${post.id}`
                          }
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-800 lg:flex-none"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          {paymentRoute === "pay-now" ? "Pay now" : "Pay later"}
                        </Link>
                      ) : null}

                      {awaitingPodReview || hasSubmittedPod(post) ? (
                        <button
                          type="button"
                          onClick={() => openPodPreview(post)}
                          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold transition lg:flex-none ${
                            awaitingPodReview
                              ? "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View POD
                        </button>
                      ) : null}

                      {primaryAction ? (
                        <button
                          onClick={() => updateLoadStatus(post.id, primaryAction.nextStatus)}
                          disabled={updatingId === post.id}
                          className={`inline-flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-[11px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 lg:flex-none ${primaryAction.className}`}
                        >
                          {updatingId === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : primaryAction.label}
                        </button>
                      ) : null}

                      <button
                        onClick={() => setSelectedPost(post)}
                        className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 lg:flex-none"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
                <Package className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No postings found</h3>
              <p className="mx-auto mt-2 max-w-md text-[13px] text-slate-500">
                Post a new load to activate marketplace visibility and carrier bidding.
              </p>
              <Link
                href="/supplier/post-load"
                className="mt-5 inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
              >
                Post your first load
              </Link>
            </div>
          )}
        </AnimatePresence>
      </div>

      {portalReady &&
        createPortal(
          <AnimatePresence>
            {selectedPost && (() => {
              const detailPayment = paymentByLoadId.get(selectedPost.id);
              const detailPaymentState = getPostPaymentState(selectedPost);
              const detailPaymentRoute = detailPayment?.paymentRoute || selectedPost.payment_route || "pay-later";
              const detailMeta = getPostStatusMeta(selectedPost, detailPaymentState);
              const detailPodMeta = hasSubmittedPod(selectedPost)
                ? getPodVerificationMeta(selectedPost.pod_verification_status)
                : null;
              const detailAwaitingPod = needsSupplierPodReview(selectedPost);
              const detailPrimaryAction =
                selectedPost.status === "booked"
                  ? { label: "Mark in transit", nextStatus: "in-transit", className: "bg-amber-600 hover:bg-amber-700" }
                  : null;
              const detailPaymentBadge = getPaymentBadge(
                detailPaymentState,
                detailPaymentRoute,
                selectedPost.status
              );
              const detailPaymentAction = showPaymentAction(detailPaymentState, selectedPost.status);

              return (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedPost(null)}
                    className="fixed inset-0 z-[200] h-[100dvh] min-h-[100dvh] w-screen bg-slate-900/45 backdrop-blur-sm"
                  />
                  <motion.aside
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 220 }}
                    className="fixed right-0 top-0 z-[201] flex h-[100dvh] max-h-[100dvh] w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                  >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-400">{getShortCode(selectedPost.id)}</p>
                    <h3 className="mt-0.5 text-lg font-semibold capitalize text-slate-900">
                      {getCity(selectedPost.origin)} → {getCity(selectedPost.destination)}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${detailMeta.pill}`}>
                        {detailAwaitingPod ? "pod review" : selectedPost.status.replace("-", " ")}
                      </span>
                      {detailPodMeta ? (
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${detailPodMeta.pill}`}>
                          {detailPodMeta.label}
                        </span>
                      ) : null}
                      {detailPaymentBadge ? (
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${detailPaymentBadge.className}`}
                        >
                          {detailPaymentBadge.label}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <p className="text-[11px] font-medium text-slate-500">Shipment value</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                      {formatMoney(selectedPost.price)}
                    </p>
                    <p className="mt-2 text-[12px] text-slate-500">{getStatusSummary(selectedPost.status, detailPaymentState, selectedPost)}</p>
                  </div>

                  {hasSubmittedPod(selectedPost) ? (
                    <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-white p-2">
                          <FileCheck className="h-4 w-4 text-violet-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-slate-900">Proof of delivery</p>
                          <p className="mt-0.5 truncate text-[12px] text-slate-500">
                            {selectedPost.pod_name || "Delivery document"}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            Uploaded {formatDateTime(selectedPost.pod_uploaded_at)}
                          </p>
                          {selectedPost.pod_review_note ? (
                            <p className="mt-2 text-[12px] text-slate-600">{selectedPost.pod_review_note}</p>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openPodPreview(selectedPost)}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-violet-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-violet-700 transition hover:bg-violet-50"
                      >
                        <Eye className="h-4 w-4" />
                        View POD document
                      </button>
                    </div>
                  ) : null}

                  <div className="mt-5">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Route</p>
                    <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                          <MapPin className="h-3 w-3 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-slate-400">Origin</p>
                          <p className="text-[13px] font-medium capitalize text-slate-900">
                            {selectedPost.origin || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="ml-3 h-px w-full bg-slate-100" />
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50">
                          <MapPin className="h-3 w-3 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-slate-400">Destination</p>
                          <p className="text-[13px] font-medium capitalize text-slate-900">
                            {selectedPost.destination || "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Load details</p>
                    <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                      {[
                        { icon: Calendar, label: "Pickup", value: formatDate(selectedPost.pickup_date) },
                        { icon: Clock, label: "Delivery", value: formatDate(selectedPost.delivery_date) },
                        { icon: Truck, label: "Equipment", value: formatLabel(selectedPost.equipment) },
                        { icon: Package, label: "Weight", value: selectedPost.weight ? `${selectedPost.weight} kg` : "TBC" },
                        {
                          icon: CreditCard,
                          label: "Payment",
                          value:
                            detailPaymentState === "paid"
                              ? detailPayment?.cardBrand && detailPayment?.cardLast4
                                ? `Paid · ${detailPayment.cardBrand} ···${detailPayment.cardLast4}`
                                : "Paid"
                              : isLoadClosed(selectedPost.status)
                                ? "Shipment archived"
                                : detailPaymentRoute === "pay-now"
                                  ? "Awaiting instant payment"
                                  : "Scheduled for later",
                        },
                        {
                          label: "Carrier",
                          value: selectedPost.carrier_id
                            ? `Assigned · ${String(selectedPost.carrier_id).slice(0, 8)}`
                            : "Unassigned",
                        },
                        { label: "Posted", value: formatDateTime(selectedPost.created_at) },
                        ...(selectedPost.commodity
                          ? [{ label: "Commodity", value: formatLabel(selectedPost.commodity) }]
                          : []),
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3">
                          <dt className="text-[12px] text-slate-500">{row.label}</dt>
                          <dd className="text-right text-[12px] font-medium text-slate-900">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {(selectedPost.notes || selectedPost.special_instructions) && (
                    <div className="mt-5">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Notes</p>
                      <p className="rounded-xl border border-slate-200 bg-white p-4 text-[13px] leading-relaxed text-slate-600">
                        {selectedPost.notes || selectedPost.special_instructions}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-slate-100 bg-white p-4">
                  {detailAwaitingPod ? (
                    <>
                      <button
                        type="button"
                        onClick={() => reviewPod(selectedPost.id, "verified")}
                        disabled={updatingId === selectedPost.id}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        {updatingId === selectedPost.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Approve POD & close shipment
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewPod(selectedPost.id, "info_required", "Please provide clearer delivery proof.")}
                        disabled={updatingId === selectedPost.id}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-[13px] font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                      >
                        Request more info
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewPod(selectedPost.id, "rejected", "POD rejected — please reupload a signed delivery document.")}
                        disabled={updatingId === selectedPost.id}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject POD
                      </button>
                    </>
                  ) : null}

                  {detailPaymentAction === "paid" ? (
                    <span className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Paid
                    </span>
                  ) : detailPaymentAction === "pay" ? (
                    <Link
                      href={
                        detailPaymentRoute === "pay-now"
                          ? `/supplier/pay-instant?load=${selectedPost.id}`
                          : `/supplier/pay-later?highlight=${selectedPost.id}`
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
                    >
                      <CreditCard className="h-4 w-4" />
                      {detailPaymentRoute === "pay-now" ? "Pay now" : "Manage payment"}
                    </Link>
                  ) : null}

                  {detailPrimaryAction ? (
                    <button
                      onClick={() => updateLoadStatus(selectedPost.id, detailPrimaryAction.nextStatus)}
                      disabled={updatingId === selectedPost.id}
                      className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${detailPrimaryAction.className}`}
                    >
                      {updatingId === selectedPost.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        detailPrimaryAction.label
                      )}
                    </button>
                  ) : null}

                  <Link
                    href="/supplier/post-load"
                    className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Create similar load
                  </Link>
                </div>
              </motion.aside>
            </>
          );
        })()}
          </AnimatePresence>,
          document.body
        )}

      {portalReady &&
        createPortal(
          <AnimatePresence>
            {podPreview && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    if (!podConfirm) setPodPreview(null);
                  }}
                  className={OVERLAY_CLASS}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 12 }}
                  className="fixed left-1/2 top-1/2 z-[201] flex max-h-[min(92dvh,780px)] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Proof of delivery</p>
                      <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">{podPreview.name}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPodConfirm(null);
                        setPodPreview(null);
                      }}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="min-h-[280px] flex-1 bg-slate-50 p-4">
                    {podPreview.url.startsWith("data:image") || /\.(png|jpg|jpeg|gif|webp|avif)$/i.test(podPreview.url) ? (
                      <div className="flex h-full min-h-[260px] items-center justify-center overflow-auto rounded-lg bg-white p-4">
                        <img src={podPreview.url} alt={podPreview.name} className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <iframe
                        src={podPreview.url}
                        title={podPreview.name}
                        className="h-full min-h-[260px] w-full rounded-lg border border-slate-200 bg-white"
                      />
                    )}
                  </div>

                  {podPreview.canReview ? (
                    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setPodConfirm("reject")}
                        disabled={Boolean(updatingId)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-5 py-2.5 text-[13px] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject POD
                      </button>
                      <button
                        type="button"
                        onClick={() => setPodConfirm("approve")}
                        disabled={Boolean(updatingId)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve POD
                      </button>
                    </div>
                  ) : null}
                </motion.div>

                {podConfirm && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[202] bg-slate-900/55 backdrop-blur-[2px]"
                      onClick={() => setPodConfirm(null)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 10 }}
                      className="fixed left-1/2 top-1/2 z-[203] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-lg p-2 ${
                            podConfirm === "approve" ? "bg-emerald-50" : "bg-rose-50"
                          }`}
                        >
                          {podConfirm === "approve" ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-rose-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-[16px] font-bold text-slate-900">
                            {podConfirm === "approve" ? "Approve this POD?" : "Reject this POD?"}
                          </h4>
                          <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                            {podConfirm === "approve" ? (
                              <>
                                If you approve this proof of delivery, the shipment will move to{" "}
                                <span className="font-semibold text-slate-900">Completed</span>, be archived in your
                                posting history, and the carrier payout review can proceed.
                              </>
                            ) : (
                              <>
                                If you reject this proof of delivery, the shipment will stay under{" "}
                                <span className="font-semibold text-slate-900">POD review</span>, the carrier will be
                                asked to reupload a corrected document, and payout will remain on hold until a valid POD
                                is approved.
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setPodConfirm(null)}
                          disabled={Boolean(updatingId)}
                          className="rounded-lg border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleConfirmPodReview()}
                          disabled={Boolean(updatingId)}
                          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition disabled:opacity-60 ${
                            podConfirm === "approve"
                              ? "bg-slate-900 hover:bg-slate-800"
                              : "bg-rose-600 hover:bg-rose-700"
                          }`}
                        >
                          {updatingId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : podConfirm === "approve" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          {podConfirm === "approve" ? "Yes, approve POD" : "Yes, reject POD"}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
