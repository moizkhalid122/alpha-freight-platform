"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useMarketCurrency } from "@/hooks/useMarketCurrency";
import type { LoadCancellationRequest } from "@/lib/load-cancellation";

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

function getStatusStyle(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (normalized === "pending" || normalized === "processing")
    return "bg-amber-50 text-amber-700 border-amber-100";
  if (normalized === "rejected" || normalized === "failed")
    return "bg-rose-50 text-rose-700 border-rose-100";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function getShortCode(loadId: string) {
  return `AF-${loadId.slice(0, 8).toUpperCase()}`;
}

export default function SupplierRefundsPage() {
  const market = useMarketCurrency("supplier");
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<LoadCancellationRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true);
        setError(null);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setRequests([]);
          return;
        }

        const response = await fetch("/api/supplier/cancellations", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const payload = (await response.json()) as {
          error?: string;
          requests?: LoadCancellationRequest[];
        };

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load refund history.");
        }

        setRequests(payload.requests || []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load refund history.");
      } finally {
        setLoading(false);
      }
    }

    void fetchRequests();
  }, []);

  const stats = useMemo(() => {
    const pending = requests.filter((item) =>
      ["pending", "processing", "approved"].includes(item.status)
    ).length;
    const completed = requests.filter((item) => item.status === "completed").length;
    const refundedTotal = requests
      .filter((item) => item.status === "completed" && Number(item.refund_amount || 0) > 0)
      .reduce((sum, item) => sum + Number(item.refund_amount || 0), 0);
    return { pending, completed, refundedTotal };
  }, [requests]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">
          Payments
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Refunds &amp; Cancellations
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Track cancellation requests, refund status, and disputes for your loads. Policy details are
          in our{" "}
          <Link href="/refund-cancellation-policy" className="text-violet-700 hover:underline">
            Refund &amp; Cancellation Policy
          </Link>
          .
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pending review</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Completed</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.completed}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total refunded</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{market.formatMoney(stats.refundedTotal)}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
          <p className="mt-3 text-sm text-slate-500">Loading refund history…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
          <RotateCcw className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-base font-semibold text-slate-900">No cancellation requests yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Cancel a load from{" "}
            <Link href="/supplier/my-posts" className="text-violet-700 hover:underline">
              My Posts
            </Link>{" "}
            to see refund status here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{getShortCode(request.load_id)}</p>
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${getStatusStyle(request.status)}`}
                    >
                      {request.status.replace("_", " ")}
                    </span>
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-600">
                      {request.request_type}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 capitalize">
                    Reason: {request.reason.replace(/_/g, " ")}
                  </p>
                  {request.reason_detail ? (
                    <p className="mt-1 text-sm text-slate-500">{request.reason_detail}</p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-slate-400">Submitted {formatDate(request.created_at)}</p>
                </div>

                <div className="min-w-[180px] space-y-2 text-sm">
                  {request.original_amount != null ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Original paid</span>
                      <span className="font-semibold text-slate-900">
                        {market.formatMoney(request.original_amount)}
                      </span>
                    </div>
                  ) : null}
                  {request.refund_amount != null ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Refund amount</span>
                      <span className="font-semibold text-emerald-700">
                        {market.formatMoney(request.refund_amount)}
                      </span>
                    </div>
                  ) : null}
                  {Number(request.deduction_amount || 0) > 0 ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Deduction</span>
                      <span className="font-semibold text-rose-700">
                        -{market.formatMoney(Number(request.deduction_amount))}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {request.admin_note ? (
                <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">Admin note:</span> {request.admin_note}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                {request.status === "completed" && request.refunded_at ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Refunded {formatDate(request.refunded_at)}
                  </span>
                ) : request.status === "pending" ? (
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <Clock className="h-3.5 w-3.5" />
                    Awaiting Alpha Freight review
                  </span>
                ) : null}
                <Link
                  href="/refund-cancellation-policy"
                  className="inline-flex items-center gap-1 text-violet-700 hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  View policy
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
