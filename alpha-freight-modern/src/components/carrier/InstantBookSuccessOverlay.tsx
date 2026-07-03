"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import InstantBookLottie from "./InstantBookLottie";

type InstantBookSuccessOverlayProps = {
  open: boolean;
  loadCode: string;
  routeLabel: string;
  amountLabel: string;
  onClose: () => void;
};

export default function InstantBookSuccessOverlay({
  open,
  loadCode,
  routeLabel,
  amountLabel,
  onClose,
}: InstantBookSuccessOverlayProps) {
  if (!open) return null;

  return (
    <motion.div
      key="instant-book-success"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-900/50 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex justify-center">
          <InstantBookLottie className="h-52 w-52" />
        </div>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
          Ready, set, go!
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">Load booked instantly</h2>
        <p className="mt-2 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{loadCode}</span> · {routeLabel}
        </p>
        <p className="mt-1 text-sm font-semibold text-emerald-600">{amountLabel} secured</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/carrier/my-loads"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            My shipments
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Browse more
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
