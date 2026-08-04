"use client";

import type { CopilotMetric } from "@/lib/chat-types";
import { resolveMetricIcon } from "@/lib/ai-metric-icons";

type AiMetricPillsProps = {
  metrics: CopilotMetric[];
};

export default function AiMetricPills({ metrics }: AiMetricPillsProps) {
  if (!metrics.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {metrics.map((metric) => {
        const Icon = resolveMetricIcon(metric.label, metric.icon);
        return (
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
            <Icon className="h-3.5 w-3.5 shrink-0 text-[#7a9900]" strokeWidth={2.25} />
            <span className="font-semibold">{metric.label}:</span>
            <span>{metric.value}</span>
          </div>
        );
      })}
    </div>
  );
}
