"use client";

import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PUBLIC_AI_GUEST_LIMIT } from "@/lib/public-ai-rate-limit";

interface LimitReachedModalProps {
  open: boolean;
  onClose: () => void;
  variant?: "guest" | "member";
  dashboardHref?: string;
}

export default function LimitReachedModal({
  open,
  onClose,
  variant = "guest",
  dashboardHref = "/auth/select",
}: LimitReachedModalProps) {
  const isGuest = variant === "guest";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="fixed left-1/2 top-1/2 z-[101] w-[min(420px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-[#999] hover:bg-[#f4f4f4]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-4 text-center text-3xl">{isGuest ? "🚀" : "⏳"}</div>
            <h2 className="text-center text-xl font-semibold text-[#0d0d0d]">
              {isGuest ? "Sign up to keep chatting" : "Hourly limit reached"}
            </h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-[#666]">
              {isGuest
                ? `You've used your ${PUBLIC_AI_GUEST_LIMIT} free AI questions. Create a free account to continue chatting, save history, and access live loads.`
                : "You've reached your hourly AI message limit. Please wait a bit and try again, or continue from your dashboard."}
            </p>
            <div className="mt-6 space-y-2">
              {isGuest ? (
                <>
                  <Link
                    href="/auth/select"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d0d0d] py-3 text-sm font-semibold text-white hover:bg-[#333]"
                  >
                    Sign up free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/find-loads"
                    className="flex w-full items-center justify-center rounded-xl border border-[#e5e5e5] py-3 text-sm font-medium text-[#444] hover:bg-[#f7f7f8]"
                  >
                    Browse load board
                  </Link>
                </>
              ) : (
                <Link
                  href={dashboardHref}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d0d0d] py-3 text-sm font-semibold text-white hover:bg-[#333]"
                >
                  Go to dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
