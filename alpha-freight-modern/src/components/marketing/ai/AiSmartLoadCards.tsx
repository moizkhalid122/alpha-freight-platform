"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Truck } from "lucide-react";
import type { CopilotPlatformResult } from "@/lib/chat-types";

type AiSmartLoadCardsProps = {
  result: CopilotPlatformResult;
};

export default function AiSmartLoadCards({ result }: AiSmartLoadCardsProps) {
  if (!result.loads?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 space-y-3"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-[#0d0d0d]">
        <Truck className="h-4 w-4 text-[#7a9900]" />
        {result.title}
        {typeof result.totalCount === "number" ? (
          <span className="rounded-full bg-[#f7ffe8] px-2 py-0.5 text-[11px] font-medium text-[#5a7000]">
            {result.totalCount} matches
          </span>
        ) : null}
      </div>
      {result.subtitle ? <p className="text-xs text-[#888]">{result.subtitle}</p> : null}

      <div className="space-y-3">
        {result.loads.map((load, index) => (
          <motion.div
            key={load.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
            className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white/90 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#f0f0f0] px-4 py-3.5">
              <div>
                <p className="flex items-center gap-1.5 text-[15px] font-semibold text-[#0d0d0d]">
                  <MapPin className="h-3.5 w-3.5 text-[#7a9900]" />
                  {load.title}
                </p>
                <p className="mt-0.5 text-xs text-[#888]">{load.subtitle}</p>
              </div>
              {typeof load.score === "number" ? (
                <span className="shrink-0 rounded-full border border-[#BFFF07]/50 bg-[#f7ffe8] px-2.5 py-1 text-[11px] font-semibold text-[#5a7000]">
                  🚚 {load.score}/100
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-2 px-4 py-3">
              {load.metrics.map((metric) => (
                <div
                  key={`${load.id}-${metric.label}`}
                  className={`rounded-xl px-3 py-2 text-center ${
                    metric.tone === "positive"
                      ? "bg-[#f7ffe8] text-[#3d4d00]"
                      : metric.tone === "warning"
                        ? "bg-[#fffbeb] text-[#78350f]"
                        : "bg-[#f7f7f8] text-[#333]"
                  }`}
                >
                  <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">
                    {metric.icon ? `${metric.icon} ` : ""}
                    {metric.label}
                  </p>
                  <p className="mt-0.5 text-sm font-bold">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[#f0f0f0] px-4 py-3">
              {load.primaryAction?.href ? (
                <Link
                  href={load.primaryAction.href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#111] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#333]"
                >
                  {load.primaryAction.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
              {load.secondaryActions?.map((action) =>
                action.href ? (
                  <Link
                    key={`${load.id}-${action.label}`}
                    href={action.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-xs font-semibold text-[#333] transition hover:bg-[#fafafa]"
                  >
                    {action.label}
                  </Link>
                ) : null
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
