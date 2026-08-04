"use client";

import { AnimatePresence, motion } from "framer-motion";
import LeaveSubmittedLottie from "@/components/employee/LeaveSubmittedLottie";

type LeaveSubmittedOverlayProps = {
  open: boolean;
  days: number;
  leaveLabel: string;
  onClose: () => void;
};

export default function LeaveSubmittedOverlay({
  open,
  days,
  leaveLabel,
  onClose,
}: LeaveSubmittedOverlayProps) {
  return (
    <AnimatePresence>
      {open ? (
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
              <LeaveSubmittedLottie className="h-44 w-44" />
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Leave request submitted</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              We&apos;ll miss you! Your <strong className="text-slate-700">{leaveLabel}</strong> request for{" "}
              <strong className="text-slate-700">
                {days} day{days !== 1 ? "s" : ""}
              </strong>{" "}
              has been sent to your manager. Check request history for approval status.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-sm font-bold text-white shadow-sm shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-blue-500"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
