"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, CheckCheck } from "lucide-react";

export default function CarrierPayoutSetupCompletedPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F6] px-4 py-6 text-slate-900 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl text-center"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 shadow-[0_18px_50px_rgba(16,185,129,0.12)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <BadgeCheck className="h-8 w-8 text-emerald-700" />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <p className="text-[11px] font-black uppercase tracking-[0.34em] text-emerald-700">
              Setup Completed
            </p>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-[46px]">
              Your payout method is ready
            </h1>
            <p className="mx-auto max-w-xl text-base font-medium leading-8 text-slate-500">
              Your bank payout setup has been saved successfully. Carrier withdrawals and wallet
              payouts can now move through your selected account details.
            </p>
            <p className="mx-auto max-w-lg text-sm font-medium leading-7 text-slate-400">
              You can return any time to update payout information, change bank details, or review
              wallet activity from your finance workspace.
            </p>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/carrier/wallet"
              className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full bg-emerald-700 px-8 py-3.5 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-emerald-800"
            >
              <CheckCheck className="h-4 w-4" />
              Go To Wallet
            </Link>
            <Link
              href="/carrier/dashboard"
              className="inline-flex min-w-[220px] items-center justify-center rounded-full border border-emerald-200 bg-white px-8 py-3.5 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 transition hover:bg-emerald-50"
            >
              Go To Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
