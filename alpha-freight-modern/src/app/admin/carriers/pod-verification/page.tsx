"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileCheck2,
  PauseCircle,
  RefreshCcw,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  mergeCarrierPaymentOrder,
  readCarrierPaymentOrders,
  upsertCarrierPaymentOrder,
  type CarrierPaymentRecord,
} from "@/lib/carrier-payments";
import {
  mergeCarrierPodUpload,
  readCarrierPodUploads,
  type CarrierPodUploadRecord,
} from "@/lib/carrier-pod-uploads";
import { readCarrierExtras } from "@/lib/profile-extras";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type ProfileRecord = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
};

type LoadRecord = {
  id: string;
  carrier_id: string | null;
  supplier_id: string | null;
  origin: string | null;
  destination: string | null;
  pickup_location: string | null;
  delivery_location: string | null;
  price: number | string | null;
  status: string | null;
  created_at: string | null;
};

type PodVerificationRow = {
  loadId: string;
  carrierId: string;
  carrierName: string;
  amount: number;
  route: string;
  uploadedAt: string;
  podName: string;
  podUrl: string;
  podMode: "upload" | "team";
  podStatus: CarrierPodUploadRecord["verificationStatus"];
  paymentStatus: CarrierPaymentRecord["status"];
  reviewNote: string | null;
};

const DELIVERED_LOAD_STATUSES = new Set(["completed", "delivered"]);

function normalizeStatus(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildLoadPaymentRecord(load: LoadRecord): CarrierPaymentRecord | null {
  if (!load.carrier_id) return null;
  if (!DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status))) return null;

  const amount = toNumber(load.price);
  const invoiceDate = load.created_at ?? new Date().toISOString();
  const dueDate = new Date(new Date(invoiceDate).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const fuelSurcharge = Number((amount * 0.07).toFixed(2));
  const vatAmount = 0;
  const baseRate = Number((amount - fuelSurcharge - vatAmount).toFixed(2));
  const loadCode = load.id.slice(0, 8).toUpperCase();

  return {
    transactionId: `TX-${loadCode}-001`,
    loadId: load.id,
    carrierId: load.carrier_id,
    supplierId: load.supplier_id,
    amount,
    baseRate,
    fuelSurcharge,
    vatAmount,
    invoiceNumber: `INV-${loadCode}`,
    invoiceDate,
    dueDate,
    status: "pending_review",
    priority: "high",
  };
}

function getRouteLabel(load: LoadRecord) {
  const origin = (load.origin || load.pickup_location || "Origin").split(",")[0]?.trim();
  const destination = (load.destination || load.delivery_location || "Destination").split(",")[0]?.trim();
  return `${origin || "Origin"} -> ${destination || "Destination"}`;
}

function getPodBadgeClass(status: CarrierPodUploadRecord["verificationStatus"]) {
  if (status === "verified") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "on_hold") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "info_required") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-violet-200 bg-violet-50 text-violet-700";
}

function getPodLabel(status: CarrierPodUploadRecord["verificationStatus"]) {
  if (status === "verified") return "Verified";
  if (status === "on_hold") return "On Hold";
  if (status === "rejected") return "Rejected";
  if (status === "info_required") return "Info Required";
  return "Pending Review";
}

async function fetchPodVerificationRows(): Promise<PodVerificationRow[]> {
  const [profilesResult, loadsResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, company_name"),
    supabase
      .from("loads")
      .select("id, carrier_id, supplier_id, origin, destination, pickup_location, delivery_location, price, status, created_at")
      .not("carrier_id", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  const profiles = (profilesResult.error ? [] : (profilesResult.data ?? [])) as ProfileRecord[];
  const loads = (loadsResult.error ? [] : (loadsResult.data ?? [])) as LoadRecord[];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const paymentOrdersByLoadId = new Map(readCarrierPaymentOrders().map((order) => [order.loadId, order]));
  const podUploads = readCarrierPodUploads();

  return loads
    .filter((load) => DELIVERED_LOAD_STATUSES.has(normalizeStatus(load.status)))
    .map((load) => {
      const podRecord = podUploads[load.id];
      if (!podRecord) return null;

      const profile = load.carrier_id ? profileById.get(load.carrier_id) : null;
      const extras = load.carrier_id ? readCarrierExtras(load.carrier_id) : {};
      const basePayment = buildLoadPaymentRecord(load);
      const paymentRecord =
        paymentOrdersByLoadId.get(load.id) || (basePayment ? upsertCarrierPaymentOrder(basePayment) : null);

      return {
        loadId: load.id,
        carrierId: load.carrier_id || "",
        carrierName:
          extras.companyName?.trim() ||
          profile?.company_name?.trim() ||
          profile?.full_name?.trim() ||
          `Carrier ${String(load.carrier_id || "").slice(0, 8)}`,
        amount: toNumber(load.price),
        route: getRouteLabel(load),
        uploadedAt: podRecord.uploadedAt,
        podName: podRecord.name,
        podUrl: podRecord.url,
        podMode: podRecord.mode,
        podStatus: podRecord.verificationStatus,
        paymentStatus: paymentRecord?.status || "pending_review",
        reviewNote: podRecord.reviewNote || paymentRecord?.verificationNotes || paymentRecord?.disputeReason || null,
      } satisfies PodVerificationRow;
    })
    .filter(Boolean) as PodVerificationRow[];
}

function StatsCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <p className={cn("mt-3 text-2xl font-semibold tracking-tight", tone)}>{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </div>
  );
}

export default function CarrierPodVerificationPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [podPreview, setPodPreview] = useState<{ url: string; name: string } | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-carrier-pod-verification"],
    queryFn: fetchPodVerificationRows,
  });

  const rows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return (data ?? []).filter((row) => {
      if (!search) return true;
      return (
        row.carrierName.toLowerCase().includes(search) ||
        row.loadId.toLowerCase().includes(search) ||
        row.route.toLowerCase().includes(search)
      );
    });
  }, [data, searchTerm]);

  const stats = useMemo(() => {
    const pending = rows.filter((row) => row.podStatus === "pending").length;
    const verified = rows.filter((row) => row.podStatus === "verified").length;
    const onHold = rows.filter((row) => row.podStatus === "on_hold").length;
    const rejected = rows.filter((row) => row.podStatus === "rejected").length;
    return { pending, verified, onHold, rejected };
  }, [rows]);

  const closePodPreview = () => setPodPreview(null);

  const openPodPreview = (row: PodVerificationRow) => {
    if (!row.podUrl) {
      toast.error("No POD file is available for this load yet.");
      return;
    }

    setPodPreview({
      url: row.podUrl,
      name: row.podName || `POD ${row.loadId.slice(0, 8).toUpperCase()}`,
    });
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-carrier-pod-verification"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-carrier-payments"] });
    toast.success("POD verification queue refreshed.");
  };

  const updatePodState = async (
    row: PodVerificationRow,
    nextStatus: CarrierPodUploadRecord["verificationStatus"],
    successMessage: string
  ) => {
    const timestamp = new Date().toISOString();

    mergeCarrierPodUpload(row.loadId, {
      verificationStatus: nextStatus,
      reviewedAt: timestamp,
      reviewedBy: "Admin - Khalid",
      verifiedAt: nextStatus === "verified" ? timestamp : null,
      verifiedBy: nextStatus === "verified" ? "Admin - Khalid" : null,
      requestedInfoAt: nextStatus === "info_required" ? timestamp : null,
      rejectedAt: nextStatus === "rejected" ? timestamp : null,
      reviewNote:
        nextStatus === "verified"
          ? "POD verified by Alpha Freight admin."
          : nextStatus === "on_hold"
            ? "POD review placed on hold."
            : nextStatus === "rejected"
              ? "POD rejected during admin review."
              : "More POD information requested from carrier.",
    });

    const baseRecord = buildLoadPaymentRecord({
      id: row.loadId,
      carrier_id: row.carrierId,
      supplier_id: null,
      origin: row.route,
      destination: row.route,
      pickup_location: null,
      delivery_location: null,
      price: row.amount,
      status: "completed",
      created_at: row.uploadedAt,
    });

    const existingOrder = readCarrierPaymentOrders().find((item) => item.loadId === row.loadId);
    const targetTransactionId = existingOrder?.transactionId || baseRecord?.transactionId;
    if (baseRecord && !existingOrder) {
      upsertCarrierPaymentOrder(baseRecord);
    }

    if (targetTransactionId) {
      mergeCarrierPaymentOrder(targetTransactionId, {
        status:
          nextStatus === "verified"
            ? "verified"
            : nextStatus === "on_hold"
              ? "on_hold"
              : nextStatus === "rejected"
                ? "failed"
                : "pending_review",
        verifiedAt: nextStatus === "verified" ? timestamp : null,
        heldAt: nextStatus === "on_hold" ? timestamp : null,
        rejectedAt: nextStatus === "rejected" ? timestamp : null,
        requestedInfoAt: nextStatus === "info_required" ? timestamp : null,
        verificationNotes:
          nextStatus === "verified"
            ? "POD verified by Alpha Freight admin."
            : nextStatus === "info_required"
              ? "More POD information requested."
              : undefined,
        disputeReason:
          nextStatus === "on_hold"
            ? "POD review placed on hold."
            : nextStatus === "rejected"
              ? "POD rejected during admin review."
              : undefined,
      });
    }

    await queryClient.invalidateQueries({ queryKey: ["admin-carrier-pod-verification"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-carrier-payments"] });
    toast.success(successMessage);
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
              Carrier POD Verification
            </p>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Review completed-load PODs before wallet funds move from incoming to available
              </h1>
              <p className="max-w-3xl text-sm text-slate-500">
                Verify uploaded POD documents, hold unclear deliveries, reject invalid proofs,
                and keep wallet balances aligned with live admin review.
              </p>
            </div>
          </div>

          <Button type="button" variant="secondary" className="h-11 rounded-2xl border-slate-200 px-4" onClick={refresh}>
            <RefreshCcw className={cn("mr-2 h-4 w-4", isFetching ? "animate-spin" : "")} />
            Refresh
          </Button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <StatsCard label="Pending" value={String(stats.pending)} note="Awaiting admin verification" tone="text-violet-600" />
        <StatsCard label="Verified" value={String(stats.verified)} note="Moved toward available wallet funds" tone="text-emerald-600" />
        <StatsCard label="On Hold" value={String(stats.onHold)} note="Need extra review before clearance" tone="text-amber-600" />
        <StatsCard label="Rejected" value={String(stats.rejected)} note="Invalid or incomplete POD evidence" tone="text-rose-600" />
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by carrier name, load ID, or route"
            className="h-12 w-full rounded-[20px] border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
          />
        </div>
      </section>

      <section className="space-y-4">
        {isLoading ? (
          <div className="rounded-[30px] border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            Loading POD verification queue...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-[30px] border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
            No carrier PODs found for verification yet.
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.loadId}
              className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", getPodBadgeClass(row.podStatus))}>
                      {getPodLabel(row.podStatus)}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Load {row.loadId.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-slate-950">{row.carrierName}</p>
                    <p className="mt-1 text-sm text-slate-500">{row.route}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Amount</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{formatMoney(row.amount)}</p>
                    </div>
                    <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Uploaded</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{format(new Date(row.uploadedAt), "dd MMM yyyy, HH:mm")}</p>
                    </div>
                    <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Mode</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{row.podMode === "team" ? "Alpha Freight Team Review" : "Uploaded Document"}</p>
                    </div>
                    <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Payment State</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{row.paymentStatus.replace("_", " ")}</p>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Review Note</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {row.reviewNote || "No admin review note added yet."}
                    </p>
                  </div>
                </div>

                <div className="w-full max-w-[320px] space-y-3">
                  {row.podUrl ? (
                    <button
                      type="button"
                      onClick={() => openPodPreview(row)}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4" />
                      View POD
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Alpha Freight team review requested. No file URL attached.
                    </div>
                  )}

                  <Link href={`/admin/carriers/${row.carrierId}`} className="block">
                    <Button type="button" variant="secondary" className="h-11 w-full rounded-2xl border-slate-200">
                      <Truck className="mr-2 h-4 w-4" />
                      View Carrier Profile
                    </Button>
                  </Link>

                  <Button
                    type="button"
                    className="h-11 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
                    onClick={() => void updatePodState(row, "verified", "POD verified. Carrier funds will move into available balance.")}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Verify POD
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 w-full rounded-2xl border-slate-200"
                    onClick={() => void updatePodState(row, "on_hold", "POD moved to hold. Carrier funds remain incoming.")}
                  >
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Hold
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 w-full rounded-2xl border-slate-200"
                    onClick={() => void updatePodState(row, "info_required", "More POD information requested from carrier.")}
                  >
                    <FileCheck2 className="mr-2 h-4 w-4" />
                    Request Info
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 w-full rounded-2xl border-slate-200"
                    onClick={() => void updatePodState(row, "rejected", "POD rejected. Funds will not move to available balance.")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {podPreview ? (
        <>
          <div
            className="fixed inset-0 z-[110] bg-slate-950/55 backdrop-blur-sm"
            onClick={closePodPreview}
          />
          <div className="fixed left-1/2 top-1/2 z-[111] flex h-[88vh] w-[94%] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_35px_120px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">POD Preview</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{podPreview.name}</h3>
              </div>
              <button
                type="button"
                onClick={closePodPreview}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 bg-slate-100 p-4">
              {podPreview.url.startsWith("data:image") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(podPreview.url) ? (
                <div className="flex h-full items-center justify-center overflow-auto rounded-[24px] bg-white p-4">
                  <img src={podPreview.url} alt={podPreview.name} className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <iframe
                  src={podPreview.url}
                  title={podPreview.name}
                  className="h-full w-full rounded-[24px] border border-slate-200 bg-white"
                />
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
