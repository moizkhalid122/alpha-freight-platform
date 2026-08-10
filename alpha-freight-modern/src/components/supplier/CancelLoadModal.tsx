"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, AlertTriangle, X } from "lucide-react";
import {
  CANCELLATION_REASONS,
  DISPUTE_REASONS,
  type LoadCancellationFields,
} from "@/lib/load-cancellation";

type CancelLoadModalProps = {
  open: boolean;
  load: LoadCancellationFields & {
    id: string;
    origin?: string | null;
    destination?: string | null;
    price?: number | string | null;
  };
  mode: "cancel" | "dispute";
  policyMessage: string;
  autoRefund?: boolean;
  onClose: () => void;
  onConfirm: (payload: { reason: string; reasonDetail?: string }) => Promise<void>;
};

export default function CancelLoadModal({
  open,
  load,
  mode,
  policyMessage,
  autoRefund = false,
  onClose,
  onConfirm,
}: CancelLoadModalProps) {
  const [reason, setReason] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reasons = mode === "dispute" ? DISPUTE_REASONS : CANCELLATION_REASONS;
  const shortCode = `AF-${load.id.slice(0, 8).toUpperCase()}`;

  const handleSubmit = async () => {
    if (!reason) {
      setError("Please select a reason.");
      return;
    }
    if (!agreed) {
      setError("Please confirm you agree to the Refund & Cancellation Policy.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({
        reason,
        reasonDetail: reasonDetail.trim() || undefined,
      });
      setReason("");
      setReasonDetail("");
      setAgreed(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-900/45 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {shortCode}
            </p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">
              {mode === "dispute" ? "Raise payment dispute" : "Cancel load"}
            </h3>
            {(load.origin || load.destination) && (
              <p className="mt-1 text-sm text-slate-500 capitalize">
                {load.origin || "Origin"} → {load.destination || "Destination"}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-900">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{policyMessage}</p>
            </div>
            {autoRefund ? (
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                Eligible for automatic full refund to your original payment method.
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-[12px] font-semibold text-slate-700">Reason</label>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400"
            >
              <option value="">Select a reason</option>
              {reasons.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-slate-700">
              Additional details (optional)
            </label>
            <textarea
              value={reasonDetail}
              onChange={(event) => setReasonDetail(event.target.value)}
              rows={3}
              placeholder="Provide any relevant context for our review team."
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400"
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-1"
            />
            <span>
              I agree to the{" "}
              <Link href="/refund-cancellation-policy" className="text-violet-700 hover:underline">
                Refund &amp; Cancellation Policy
              </Link>
              .
            </span>
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Keep load
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "dispute" ? "Submit dispute" : "Confirm cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
}
