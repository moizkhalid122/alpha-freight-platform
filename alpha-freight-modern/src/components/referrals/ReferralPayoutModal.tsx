"use client";

import { useMemo, useState } from "react";
import { Loader2, Wallet, X } from "lucide-react";
import { getAvailableReferralBalance, saveReferralPayout } from "@/lib/referral-payouts";

type ReferralPayoutModalProps = {
  open: boolean;
  onClose: () => void;
  userId: string;
  role: "carrier" | "supplier";
  totalEarned: number;
  onPayoutComplete: () => void;
};

function formatMoney(value: number) {
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReferralPayoutModal({
  open,
  onClose,
  userId,
  role,
  totalEarned,
  onPayoutComplete,
}: ReferralPayoutModalProps) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = useMemo(
    () => getAvailableReferralBalance(userId, totalEarned),
    [userId, totalEarned, open]
  );

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const payoutAmount = Number(amount);
    if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
      setError("Enter a valid payout amount.");
      return;
    }

    if (payoutAmount > available) {
      setError(`You can payout up to ${formatMoney(available)}.`);
      return;
    }

    setSubmitting(true);
    try {
      saveReferralPayout({
        id: `ref-payout-${Date.now()}`,
        userId,
        role,
        amount: payoutAmount,
        createdAt: new Date().toISOString(),
        status: "completed",
      });
      setAmount("");
      onPayoutComplete();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Referral payout</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Withdraw referral rewards</h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Available balance: <span className="font-semibold text-slate-900">{formatMoney(available)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Payout amount (£)</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder={available > 0 ? available.toFixed(2) : "0.00"}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-slate-300 focus:bg-white"
            />
          </label>

          <button
            type="button"
            onClick={() => setAmount(available > 0 ? available.toFixed(2) : "")}
            className="text-[12px] font-semibold text-blue-600 hover:text-blue-700"
          >
            Use full available balance
          </button>

          {error ? <p className="text-[13px] font-medium text-rose-600">{error}</p> : null}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting || available <= 0}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              Confirm payout
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
