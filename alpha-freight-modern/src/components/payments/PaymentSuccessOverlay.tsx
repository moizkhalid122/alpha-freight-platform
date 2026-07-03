"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import PaymentSuccessLottie from "./PaymentSuccessLottie";

type PaymentSuccessOverlayProps = {
  open: boolean;
  amountLabel: string;
  onClose?: () => void;
};

export default function PaymentSuccessOverlay({
  open,
  amountLabel,
  onClose,
}: PaymentSuccessOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm"
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
              <PaymentSuccessLottie className="h-48 w-48" />
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Payment complete</h2>
            <p className="mt-2 text-sm text-slate-500">
              {amountLabel} received. Your load is now active on the marketplace.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                href="/supplier/my-posts"
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#6d28d9] px-5 text-sm font-semibold text-white transition hover:bg-[#5b21b6]"
              >
                View My Posts
              </Link>
              <Link
                href="/supplier/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Dashboard
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
