"use client";

import type { CopilotMetric } from "@/lib/chat-types";

type AiMetricPillsProps = {
  metrics: CopilotMetric[];
};

export default function AiMetricPills({ metrics }: AiMetricPillsProps) {
  if (!metrics.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {metrics.map((metric) => (
        <div
          key={`${metric.label}-${metric.value}`}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
            metric.tone === "positive"
              ? "border-[#BFFF07]/50 bg-[#f7ffe8] text-[#3d4d00]"
              : metric.tone === "warning"
                ? "border-[#fcd34d]/60 bg-[#fffbeb] text-[#78350f]"
                : "border-[#ececec] bg-[#f7f7f8] text-[#444]"
          }`}
        >
          {metric.icon ? <span aria-hidden>{metric.icon}</span> : null}
          <span className="font-semibold">{metric.label}:</span>
          <span>{metric.value}</span>
        </div>
      ))}
    </div>
  );
}
