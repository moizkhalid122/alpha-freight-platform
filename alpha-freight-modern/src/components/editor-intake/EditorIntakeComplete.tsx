"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function EditorIntakeComplete() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.08 }}
        className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30"
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 16, delay: 0.2 }}
        >
          <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.5} />
        </motion.div>
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-emerald-300"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.45, opacity: 0 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
        />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-8 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
      >
        Complete
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.4 }}
        className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-600"
      >
        Thank you. Your details, photo, and ID have been received. Alpha Freight will contact you shortly.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mt-8 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"
      >
        Submission successful
      </motion.div>
    </motion.div>
  );
}
