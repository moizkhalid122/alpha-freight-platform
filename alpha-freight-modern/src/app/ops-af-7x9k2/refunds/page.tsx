"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, Clock, RotateCcw } from "lucide-react";
import { adminFetch } from "@/lib/admin-data-client";
import { adminRoute } from "@/lib/admin-path";
import type { LoadCancellationRequest } from "@/lib/load-cancellation";

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
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
          Refunds &amp; Cancellations
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
          Supplier refund review queue
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Review cancellation requests submitted after carrier acceptance, payment disputes, and manual
          refund cases.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              Pending review
            </p>
            <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">{pendingCount}</p>
          </div>
          <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              Total requests
            </p>
            <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">{requests.length}</p>
          </div>
          <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              Policy
            </p>
            <Link
              href="/refund-cancellation-policy"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700 hover:underline"
            >
              <RotateCcw className="h-4 w-4" />
              View refund policy
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[32px] border border-slate-200 bg-white py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-lg font-black text-slate-900">No cancellation requests yet</p>
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
              <div
                key={request.id}
                className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={adminRoute(`/loads/${request.load_id}`)}
                        className="text-lg font-black tracking-tight text-slate-900 hover:text-violet-700"
                      >
                        {getShortCode(request.load_id)}
                      </Link>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                        {request.status}
                      </span>
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">
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
                      <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
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
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
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
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Admin note
                      </label>
                      <input
                        type="text"
                        placeholder="Optional note to supplier"
                        onChange={(event) =>
                          setAdminNotes((prev) => ({ ...prev, [request.id]: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
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
                    <button
                      type="button"
                      disabled={processingId === request.id}
                      onClick={() => void handleDecision(request, "approve")}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Approve refund
                    </button>
                    <button
                      type="button"
                      disabled={processingId === request.id}
                      onClick={() => void handleDecision(request, "reject")}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
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
    </div>
  );
}
