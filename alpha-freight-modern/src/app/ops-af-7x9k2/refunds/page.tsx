"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, Clock, RotateCcw, CreditCard } from "lucide-react";
import { AdminPageHero, AdminPageShell } from "@/components/admin/AdminPageShell";
import { ADMIN_CARD, ADMIN_INPUT } from "@/lib/admin-ui";
import { adminFetch } from "@/lib/admin-data-client";
import { adminRoute } from "@/lib/admin-path";
import type { LoadCancellationRequest } from "@/lib/load-cancellation";
import { Button } from "@/components/ui/button";

function formatMoney(value: number) {
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getShortCode(loadId: string) {
  return `AF-${loadId.slice(0, 8).toUpperCase()}`;
}

export default function AdminRefundsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<LoadCancellationRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refundAmounts, setRefundAmounts] = useState<Record<string, string>>({});
  const [deductionAmounts, setDeductionAmounts] = useState<Record<string, string>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  async function loadRequests() {
    try {
      setLoading(true);
      setError(null);
      const payload = await adminFetch<{ requests: LoadCancellationRequest[] }>("/api/admin/refunds");
      setRequests(payload.requests || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load refund queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  const pendingCount = useMemo(
    () => requests.filter((item) => item.status === "pending" || item.status === "processing").length,
    [requests]
  );

  async function handleDecision(
    request: LoadCancellationRequest,
    action: "approve" | "reject" | "process_refund"
  ) {
    try {
      setProcessingId(request.id);
      await adminFetch("/api/admin/refunds", {
        method: "PATCH",
        body: JSON.stringify({
          requestId: request.id,
          action,
          refundAmount: refundAmounts[request.id]
            ? Number(refundAmounts[request.id])
            : undefined,
          deductionAmount: deductionAmounts[request.id]
            ? Number(deductionAmounts[request.id])
            : undefined,
          adminNote: adminNotes[request.id] || undefined,
        }),
      });
      await loadRequests();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Unable to update request.");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <AdminPageShell>
      <AdminPageHero
        eyebrow="Refunds & cancellations"
        title="Supplier refund review queue"
        description="Review cancellation requests submitted after carrier acceptance, payment disputes, and manual refund approvals."
        icon={CreditCard}
        accent="rose"
        actions={
          <Button variant="secondary" size="sm" onClick={() => void loadRequests()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Open queue", value: pendingCount },
          { label: "Total requests", value: requests.length },
          { label: "Processed", value: requests.filter((r) => r.status === "refunded" || r.status === "rejected").length },
        ].map((item) => (
          <div key={item.label} className={`${ADMIN_CARD} p-4`}>
            <p className="text-[11px] font-semibold text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className={`${ADMIN_CARD} py-16 text-center`}>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
      ) : requests.length === 0 ? (
        <div className={`${ADMIN_CARD} px-6 py-16 text-center`}>
          <p className="text-lg font-bold text-slate-900">No cancellation requests yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Auto-refunds before carrier acceptance are processed immediately and may not appear here.
          </p>
        </div>
      ) : (
        <section className="space-y-4">
          {requests.map((request) => {
            const isPending = request.status === "pending" || request.status === "processing";
            const defaultRefund = request.original_amount ?? request.refund_amount ?? 0;

            return (
              <div key={request.id} className={`${ADMIN_CARD} p-6`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={adminRoute(`/loads/${request.load_id}`)}
                        className="text-lg font-bold tracking-tight text-slate-900 hover:text-blue-700"
                      >
                        {getShortCode(request.load_id)}
                      </Link>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        {request.status}
                      </span>
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-700">
                        {request.request_type}
                      </span>
                    </div>
                    <p className="mt-2 text-sm capitalize text-slate-600">
                      Stage: {request.cancellation_stage.replace(/_/g, " ")} · Reason:{" "}
                      {request.reason.replace(/_/g, " ")}
                    </p>
                    {request.reason_detail ? (
                      <p className="mt-1 text-sm text-slate-500">{request.reason_detail}</p>
                    ) : null}
                    <p className="mt-2 text-[11px] text-slate-400">
                      Submitted {formatDate(request.created_at)}
                    </p>
                  </div>

                  <div className="min-w-[220px] space-y-1 text-sm">
                    {request.original_amount != null ? (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Original paid</span>
                        <span className="font-bold text-slate-900">
                          {formatMoney(Number(request.original_amount))}
                        </span>
                      </div>
                    ) : null}
                    {request.refund_amount != null ? (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Refund issued</span>
                        <span className="font-bold text-emerald-700">
                          {formatMoney(Number(request.refund_amount))}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {isPending ? (
                  <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-3">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Refund amount
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={String(defaultRefund)}
                        onChange={(event) =>
                          setRefundAmounts((prev) => ({ ...prev, [request.id]: event.target.value }))
                        }
                        className={`${ADMIN_INPUT} mt-2`}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Deduction
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue="0"
                        onChange={(event) =>
                          setDeductionAmounts((prev) => ({ ...prev, [request.id]: event.target.value }))
                        }
                        className={`${ADMIN_INPUT} mt-2`}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Admin note
                      </label>
                      <input
                        type="text"
                        placeholder="Optional note to supplier"
                        onChange={(event) =>
                          setAdminNotes((prev) => ({ ...prev, [request.id]: event.target.value }))
                        }
                        className={`${ADMIN_INPUT} mt-2`}
                      />
                    </div>
                  </div>
                ) : null}

                {request.admin_note ? (
                  <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {request.admin_note}
                  </p>
                ) : null}

                {isPending ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={processingId === request.id}
                      onClick={() => void handleDecision(request, "approve")}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Approve refund
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={processingId === request.id}
                      onClick={() => void handleDecision(request, "reject")}
                      className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                ) : request.status === "completed" ? (
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed {request.refunded_at ? `· ${formatDate(request.refunded_at)}` : ""}
                  </p>
                ) : request.status === "pending" ? (
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
                    <Clock className="h-4 w-4" />
                    Pending review
                  </p>
                ) : null}
              </div>
            );
          })}
        </section>
      )}
    </AdminPageShell>
  );
}
