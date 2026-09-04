"use client";

import {
  formatRevenueGbp,
  REVENUE_TYPE_COLORS,
  REVENUE_TYPE_LABELS,
  STREAM_MONTHLY_TARGETS,
  STREAM_MONTHLY_TARGETS_TOTAL,
  type RevenueStreamType,
} from "@/lib/revenue-model-content";

const TYPE_STYLES: Record<RevenueStreamType, string> = {
  transaction: "bg-neutral-900 text-white",
  recurring: "bg-neutral-100 text-neutral-900 ring-1 ring-neutral-900",
  "one-time": "bg-white text-neutral-800 ring-1 ring-neutral-400",
  affiliate: "bg-neutral-50 text-neutral-700 ring-1 ring-neutral-300",
  b2b: "bg-neutral-800 text-white",
};

export default function RevenueStreamsTargetBox() {
  return (
    <div className="border-4 border-neutral-900 bg-white">
      <div className="border-b-4 border-neutral-900 bg-neutral-900 px-6 py-8 text-white sm:px-10 sm:py-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-neutral-400">44 revenue streams</p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="revenue-plan-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Monthly earning targets
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-neutral-300">
              Month-12 target per stream · full-effort scenario · har stream se kitna kamana hai (1 mahina)
            </p>
          </div>
          <div className="border-2 border-white px-6 py-4 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Combined M12</p>
            <p className="revenue-plan-display mt-1 text-4xl font-semibold">{formatRevenueGbp(STREAM_MONTHLY_TARGETS_TOTAL)}</p>
            <p className="text-xs text-neutral-400">/ month</p>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {STREAM_MONTHLY_TARGETS.map((stream) => (
          <div key={stream.id} className="flex flex-col bg-white p-5 transition hover:bg-neutral-50">
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-xs font-bold text-neutral-300">{String(stream.id).padStart(2, "0")}</span>
              <span className={`inline-flex px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] ${TYPE_STYLES[stream.type]}`}>
                {REVENUE_TYPE_LABELS[stream.type]}
              </span>
            </div>
            <p className="mt-3 min-h-[2.5rem] text-sm font-semibold leading-snug text-neutral-900">{stream.name}</p>
            <div className="mt-auto pt-4">
              <p className="revenue-plan-display text-2xl font-semibold tracking-tight text-neutral-900">
                {formatRevenueGbp(stream.m12Monthly)}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">/ month target</p>
              {stream.note ? <p className="mt-2 text-xs text-neutral-500">{stream.note}</p> : null}
              <p className="mt-2 font-mono text-[10px] text-neutral-400">Launch M{stream.launchMonth}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-px border-t-4 border-neutral-900 bg-neutral-900 sm:grid-cols-5">
        {(Object.keys(REVENUE_TYPE_LABELS) as RevenueStreamType[]).map((type) => {
          const streams = STREAM_MONTHLY_TARGETS.filter((s) => s.type === type);
          const subtotal = streams.reduce((sum, s) => sum + s.m12Monthly, 0);
          return (
            <div key={type} className="bg-white px-5 py-4">
              <span className={`inline-flex px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${REVENUE_TYPE_COLORS[type]}`}>
                {REVENUE_TYPE_LABELS[type]}
              </span>
              <p className="revenue-plan-display mt-2 text-xl font-semibold">{formatRevenueGbp(subtotal)}</p>
              <p className="text-[10px] text-neutral-500">{streams.length} streams</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
