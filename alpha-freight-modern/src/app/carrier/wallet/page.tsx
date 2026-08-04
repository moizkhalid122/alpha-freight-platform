"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import BankLottie from "@/components/ui/BankLottie";
import { readCarrierExtras } from "@/lib/profile-extras";
import { readCarrierPaymentOrders } from "@/lib/carrier-payments";
import { readCarrierPodUploads } from "@/lib/carrier-pod-uploads";
import {
  readCarrierWalletPayouts,
  saveCarrierWalletPayout,
} from "@/lib/carrier-wallet-payouts";
import {
  deriveCarrierWalletPayoutTotals,
  deriveCarrierWalletRevenue,
} from "@/lib/carrier-wallet-metrics";
import {
  Wallet,
  ArrowUpRight,
  CreditCard,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Clock,
  Landmark,
  CheckCircle2,
  FileText,
  RefreshCcw,
  CircleDollarSign,
  X,
  AlertCircle,
  Banknote,
  PiggyBank,
} from "lucide-react";

const OVERLAY_CLASS =
  "fixed inset-0 z-[200] min-h-[100dvh] w-screen bg-slate-900/45 backdrop-blur-[6px]";

type WalletTransaction = {
  id: string;
  type: "payout";
  amount: number;
  title: string;
  date: string;
  status: string;
  destination: string;
  route: string;
  arriveBy: string;
};

function formatMoney(value: number) {
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getTransactionStatusMeta(status: string) {
  if (status === "completed") {
    return { label: "Completed", pill: "bg-emerald-50 text-emerald-700", accent: "from-emerald-500 to-teal-500" };
  }
  if (status === "on_hold") {
    return { label: "On hold", pill: "bg-amber-50 text-amber-700", accent: "from-amber-500 to-orange-500" };
  }
  if (status === "failed") {
    return { label: "Rejected", pill: "bg-rose-50 text-rose-700", accent: "from-rose-500 to-red-500" };
  }
  return { label: "Processing", pill: "bg-sky-50 text-sky-700", accent: "from-sky-500 to-blue-500" };
}

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [incomingBalance, setIncomingBalance] = useState(0);
  const [grossRevenue, setGrossRevenue] = useState(0);
  const [completedLoadsCount, setCompletedLoadsCount] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [activityTab, setActivityTab] = useState<"payouts" | "all_activity">("all_activity");
  const [payoutReady, setPayoutReady] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccessMessage, setPayoutSuccessMessage] = useState("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [payoutSummary, setPayoutSummary] = useState<{
    method: string;
    bankName: string;
    accountHolder: string;
    accountSuffix: string;
  } | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    async function getWalletData() {
      try {
        setLoading(true);
        setPayoutSuccessMessage("");
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const extras = readCarrierExtras(user.id);
          const hasBankSetup = Boolean(
            extras.payoutSetupComplete &&
              extras.payoutMethod === "Bank" &&
              extras.bankAccountHolderName &&
              extras.bankName &&
              extras.bankCountry &&
              extras.bankSortCode &&
              extras.bankAccountNumber
          );

          setPayoutReady(hasBankSetup);
          setPayoutSummary(
            hasBankSetup
              ? {
                  method: extras.payoutMethod || "Bank",
                  bankName: extras.bankName || "Bank account",
                  accountHolder: extras.bankAccountHolderName || "Account holder",
                  accountSuffix: String(extras.bankAccountNumber || "").slice(-4) || "0000",
                }
              : null
          );

          const { data: loads } = await supabase
            .from("loads")
            .select("id, price, created_at, origin, destination, status")
            .eq("carrier_id", user.id)
            .in("status", ["completed", "delivered"]);

          if (loads) {
            const savedPayouts = readCarrierWalletPayouts(user.id).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            const paymentOrders = readCarrierPaymentOrders().filter((order) => order.carrierId === user.id);
            const podUploads = readCarrierPodUploads();
            const revenueSummary = deriveCarrierWalletRevenue(loads, paymentOrders, podUploads);
            const payoutTotals = deriveCarrierWalletPayoutTotals(savedPayouts);

            setGrossRevenue(revenueSummary.grossCompletedRevenue);
            setCompletedLoadsCount(revenueSummary.completedLoadsCount);
            setIncomingBalance(revenueSummary.incomingRevenue);
            setBalance(Math.max(revenueSummary.availableRevenue - payoutTotals.totalRequestedPayouts, 0));
            setTransactions(
              savedPayouts.map((item) => ({
                id: item.id,
                type: "payout" as const,
                amount: item.amount,
                title: `Manual payout to ${item.bankName}`,
                date: new Date(item.createdAt).toLocaleDateString("en-GB"),
                status: item.status,
                destination: `${item.bankName} • • • • ${item.accountSuffix}`,
                route: item.internalNote?.trim() || "Carrier initiated payout request",
                arriveBy: new Date(item.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                }),
              }))
            );
          } else {
            setGrossRevenue(0);
            setCompletedLoadsCount(0);
            setBalance(0);
            setIncomingBalance(0);
            setTransactions([]);
          }
        }
      } catch (err) {
        console.error("Error fetching wallet data:", err);
      } finally {
        setLoading(false);
      }
    }
    void getWalletData();
  }, []);

  useEffect(() => {
    const hasOverlay = isPayoutModalOpen;
    if (!hasOverlay) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPayoutModalOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPayoutModalOpen]);

  const handleOpenPayoutModal = () => {
    setPayoutAmount(balance > 0 ? balance.toFixed(2) : "");
    setInternalNote("");
    setPayoutError(
      balance <= 0
        ? "Insufficient balance. Complete more delivered loads before requesting a payout."
        : ""
    );
    setIsPayoutModalOpen(true);
  };

  const handleSubmitPayout = async () => {
    const requestedAmount = Number(payoutAmount);

    if (!payoutSummary) {
      setPayoutError("Add a payout method first before sending funds.");
      return;
    }

    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      setPayoutError("Enter a valid payout amount greater than zero.");
      return;
    }

    if (requestedAmount > balance) {
      setPayoutError(
        `Insufficient balance. You currently have ${formatMoney(balance)} available to withdraw.`
      );
      return;
    }

    try {
      setIsSubmittingPayout(true);
      setPayoutError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPayoutError("Session expired. Please sign in again to continue.");
        return;
      }

      const payoutRecord = {
        id: crypto.randomUUID(),
        carrierId: user.id,
        amount: Number(requestedAmount.toFixed(2)),
        internalNote: internalNote.trim(),
        statementDescriptor: "ALPHA FREIGHT SOLUTION",
        bankName: payoutSummary.bankName,
        accountHolder: payoutSummary.accountHolder,
        accountSuffix: payoutSummary.accountSuffix,
        createdAt: new Date().toISOString(),
        status: "processing" as const,
      };

      saveCarrierWalletPayout(payoutRecord);

      const nextTransaction: WalletTransaction = {
        id: payoutRecord.id,
        type: "payout",
        amount: payoutRecord.amount,
        title: `Manual payout to ${payoutRecord.bankName}`,
        date: new Date(payoutRecord.createdAt).toLocaleDateString("en-GB"),
        status: payoutRecord.status,
        destination: `${payoutRecord.bankName} • • • • ${payoutRecord.accountSuffix}`,
        route: payoutRecord.internalNote || "Carrier initiated payout request",
        arriveBy: new Date(payoutRecord.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
      };

      setBalance((current) => Math.max(current - payoutRecord.amount, 0));
      setTransactions((current) => [nextTransaction, ...current]);
      setPayoutSuccessMessage(
        `Payout request for ${formatMoney(payoutRecord.amount)} submitted to ${payoutRecord.bankName}.`
      );
      setIsPayoutModalOpen(false);
      setInternalNote("");
      setPayoutAmount("");
    } catch (error) {
      setPayoutError(error instanceof Error ? error.message : "Unable to submit payout right now.");
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-slate-50/80 py-16 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-slate-400" />
          <p className="text-[13px] text-slate-500">Loading wallet…</p>
        </div>
      </div>
    );
  }

  if (!payoutReady) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-[1400px] items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full max-w-lg flex-col items-center text-center"
        >
          <BankLottie className="mb-4 h-48 w-48 sm:h-52 sm:w-52" />
          <div className="mb-1.5 flex items-center gap-2">
            <div className="rounded-md bg-slate-900 p-1.5">
              <Wallet className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Wallet setup
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Set up your bank payout first
          </h1>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-slate-500">
            Complete bank payout setup to unlock withdrawals and full wallet access for this carrier
            account.
          </p>
          <Link
            href="/carrier/wallet/payout-setup"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800"
          >
            <Landmark className="h-4 w-4" />
            Setup wallet
          </Link>
        </motion.div>
      </div>
    );
  }

  const availableBalance = balance;
  const avgPerLoad = grossRevenue / (completedLoadsCount || 1);
  const pendingPayoutsTotal = transactions
    .filter((tx) => tx.status === "processing" || tx.status === "on_hold")
    .reduce((total, item) => total + item.amount, 0);
  const currentMonthReport = new Date().toLocaleString("en-GB", { month: "long", year: "numeric" });
  const bankTail = payoutSummary
    ? `${payoutSummary.bankName} · ${payoutSummary.accountHolder}`
    : "No payout account connected";
  const maskedPayoutDestination = payoutSummary
    ? `${payoutSummary.bankName} · · · · ${payoutSummary.accountSuffix}`
    : "Connected bank account";
  const payoutErrorIsBalance = payoutError.toLowerCase().includes("insufficient balance");
  const availablePercent =
    availableBalance + incomingBalance > 0
      ? Math.round((availableBalance / (availableBalance + incomingBalance)) * 100)
      : 100;

  const payoutModal = isPayoutModalOpen ? (
    <div className={OVERLAY_CLASS} onClick={() => setIsPayoutModalOpen(false)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        className="fixed left-1/2 top-1/2 z-[201] max-h-[min(92dvh,720px)] w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pay out to bank</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Send available funds to your connected recipient.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPayoutModalOpen(false)}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {payoutError ? (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                    {payoutErrorIsBalance ? "Insufficient balance" : "Payout error"}
                  </p>
                  <p className="mt-0.5 text-[13px] text-rose-700">{payoutError}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] text-slate-500">Available balance</p>
            <p className="text-xl font-bold text-slate-900">{formatMoney(availableBalance)}</p>
          </div>

          <div>
            <label htmlFor="payout-amount" className="mb-1.5 block text-[11px] font-semibold text-slate-600">
              Amount to pay out (£)
            </label>
            <input
              id="payout-amount"
              value={payoutAmount}
              onChange={(event) => setPayoutAmount(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-[14px] font-semibold outline-none focus:border-slate-400"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="payout-note" className="mb-1.5 block text-[11px] font-semibold text-slate-600">
              Internal note (optional)
            </label>
            <input
              id="payout-note"
              value={internalNote}
              onChange={(event) => setInternalNote(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-[13px] outline-none focus:border-slate-400"
              placeholder="Optional reference"
            />
          </div>

          <div className="rounded-xl border border-slate-200 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Send to
            </p>
            <p className="mt-1 text-[13px] font-semibold text-slate-900">{maskedPayoutDestination}</p>
            <p className="text-[12px] text-slate-500">{payoutSummary?.accountHolder}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setIsPayoutModalOpen(false)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmitPayout()}
            disabled={isSubmittingPayout || availableBalance <= 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {isSubmittingPayout ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Pay out {formatMoney(Number(payoutAmount) || 0)}
          </button>
        </div>
      </motion.div>
    </div>
  ) : null;

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
        <AnimatePresence>
          {payoutSuccessMessage ? (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="fixed left-1/2 top-24 z-[120] -translate-x-1/2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 shadow-lg"
            >
              <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <span>{payoutSuccessMessage}</span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <div className="rounded-md bg-slate-900 p-1.5">
                  <Wallet className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Finance
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Wallet</h1>
              <p className="mt-0.5 text-[13px] text-slate-500">
                Available funds, payout activity, and connected bank details
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleOpenPayoutModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-800"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Pay out
              </button>
              <Link
                href="/carrier/wallet/payout-setup"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Manage payouts
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60 sm:p-6">
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
            <div className="flex flex-col gap-6 pl-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Available balance
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {formatMoney(availableBalance)}
                </p>
                <p className="mt-2 text-[12px] text-slate-500">
                  {formatMoney(incomingBalance)} incoming · {completedLoadsCount} completed loads
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[320px]">
                {[
                  { label: "Gross revenue", value: formatMoney(grossRevenue) },
                  { label: "Pending payouts", value: formatMoney(pendingPayoutsTotal) },
                  { label: "Avg / load", value: formatMoney(avgPerLoad) },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] text-slate-500">{item.label}</p>
                    <p className="mt-0.5 text-[13px] font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 pl-3">
              <div className="mb-1.5 flex justify-between text-[10px] text-slate-500">
                <span>Available vs incoming</span>
                <span>{availablePercent}% available</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.max(8, availablePercent)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Available", value: formatMoney(availableBalance), icon: Banknote },
              { label: "Incoming", value: formatMoney(incomingBalance), icon: Clock },
              { label: "Pending", value: formatMoney(pendingPayoutsTotal), icon: PiggyBank },
              { label: "Payout requests", value: String(transactions.length), icon: TrendingUp },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-slate-50/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <stat.icon className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-[11px] text-slate-500">{stat.label}</p>
                </div>
                <p className="mt-1 text-lg font-bold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50/60 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <p className="text-[13px] font-semibold text-emerald-900">Payout recipient connected</p>
              <p className="text-[12px] text-emerald-700/80">{bankTail}</p>
            </div>
          </div>
          <Link
            href="/carrier/wallet/payout-setup"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <RefreshCcw className="h-3 w-3" />
            Update details
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold text-slate-900">Recent activity</h2>
              <div className="flex gap-1 rounded-lg bg-slate-100/80 p-1">
                {[
                  { id: "all_activity" as const, label: "All" },
                  { id: "payouts" as const, label: "Payouts" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActivityTab(tab.id)}
                    className={`rounded-md px-3 py-1 text-[11px] font-semibold transition ${
                      activityTab === tab.id
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {transactions.length > 0 ? (
                transactions.slice(0, 8).map((tx, index) => {
                  const statusMeta = getTransactionStatusMeta(tx.status);
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="group relative overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60 transition hover:shadow-md hover:ring-slate-300/80"
                    >
                      <div className={`absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${statusMeta.accent}`} />
                      <div className="grid gap-3 p-4 pl-5 sm:grid-cols-[140px_minmax(0,1fr)_100px] sm:items-center">
                        <div>
                          <p className="text-lg font-bold text-slate-900">{formatMoney(tx.amount)}</p>
                          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusMeta.pill}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-900">{tx.destination}</p>
                          <p className="truncate text-[12px] text-slate-500">{tx.route}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">{tx.date}</p>
                        </div>
                        <p className="text-right text-[12px] font-medium text-slate-500 sm:text-left">
                          ETA {tx.arriveBy}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="px-4 py-14 text-center">
                  <CircleDollarSign className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-[15px] font-semibold text-slate-900">No payout activity yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">
                    Completed deliveries that settle into your wallet will appear here once payouts are
                    requested.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50/80 p-4">
              <h3 className="text-[13px] font-bold text-slate-900">Payout method</h3>
              {payoutSummary ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-white p-2 text-slate-600 shadow-sm">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">{payoutSummary.method}</p>
                      <p className="text-[11px] text-slate-500">{bankTail}</p>
                    </div>
                  </div>
                  <Link
                    href="/carrier/wallet/payout-setup"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Manage setup
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl bg-slate-50/80 p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <h3 className="text-[13px] font-bold text-slate-900">Balance report</h3>
              </div>
              <p className="mt-1 text-[12px] text-slate-500">{currentMonthReport}</p>
              <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
                Manual payouts only — withdraw the exact amount you choose, whenever you are ready.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenPayoutModal}
              disabled={availableBalance <= 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowUpRight className="h-4 w-4" />
              Request payout
            </button>
          </div>
        </div>
      </div>

      {portalReady &&
        createPortal(
          <AnimatePresence>{payoutModal}</AnimatePresence>,
          document.body
        )}
    </>
  );
}
