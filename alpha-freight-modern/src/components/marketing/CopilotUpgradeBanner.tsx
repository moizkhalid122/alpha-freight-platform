"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

interface CopilotUpgradeBannerProps {
  role: "carrier" | "supplier" | "admin" | string;
}

export default function CopilotUpgradeBanner({ role }: CopilotUpgradeBannerProps) {
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
    <div className="shrink-0 border-b border-[#d4f4c4] bg-[#f6ffe8] px-4 py-2.5">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-[#3d5a1e]">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            You&apos;re signed in — unlock <strong>loads, wallet, bids &amp; unlimited AI</strong>
          </span>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#0d0d0d] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#333]"
        >
          {label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
