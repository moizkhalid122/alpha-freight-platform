"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles, X } from "lucide-react";

const SHOW_DELAY_MS = 10_000;
const VISIBLE_MS = 8_000;
const STORAGE_KEY = "af-ai-upgrade-banner-seen";

interface CopilotUpgradeBannerProps {
  role: "carrier" | "supplier" | "admin" | string;
}

export default function CopilotUpgradeBanner({ role }: CopilotUpgradeBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;

    const showTimer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(STORAGE_KEY, "1");
    }, VISIBLE_MS);

    return () => window.clearTimeout(hideTimer);
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  };

  const href =
    role === "supplier"
      ? "/supplier/ai-assistant"
      : role === "carrier"
        ? "/carrier/ai-assistant"
        : "/auth/select";

  const label =
    role === "supplier"
      ? "Open Supplier Co-Pilot"
      : role === "carrier"
        ? "Open Carrier Co-Pilot"
        : "Open full co-pilot";

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="pointer-events-none fixed left-0 right-0 top-3 z-[100] px-4 md:top-4"
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-auto mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-[#c8e6a0]/80 bg-[#f6ffe8]/95 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.1)] backdrop-blur-md">
            <Sparkles className="h-4 w-4 shrink-0 text-[#5a7300]" />
            <p className="min-w-0 flex-1 text-sm text-[#3d5a1e]">
              You&apos;re signed in — unlock <strong>loads, wallet, bids &amp; unlimited AI</strong>
            </p>
            <Link
              href={href}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#0d0d0d] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#333]"
            >
              {label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="shrink-0 rounded-lg p-1 text-[#7a9900] transition hover:bg-[#e8f5c8]"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
