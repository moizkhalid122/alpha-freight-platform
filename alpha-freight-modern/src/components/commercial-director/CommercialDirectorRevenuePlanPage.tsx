"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Circle,
  CircleDollarSign,
  Layers,
  Target,
  TrendingUp,
} from "lucide-react";
import CommercialPageShell from "@/components/commercial-director/CommercialPageShell";
import { commercialDirectorRoute } from "@/lib/commercial-director-path";
import type { CommercialMetricsPayload } from "@/lib/commercial-director-metrics";
import {
  buildStreamPlanRows,
  DAILY_EFFORT_TARGETS,
  formatRevenueGbp,
  getCurrentMonthExecution,
  getCurrentMonthForecast,
  getCurrentPlanMonth,
  getPlanMonthLabel,
  getProgressPct,
  getTargetScenario,
  parseCommissionMtd,
  REVENUE_MONTHLY_FORECAST,
  STREAM_MONTHLY_TARGETS_TOTAL,
} from "@/lib/commercial-director-revenue-plan";
import { REVENUE_TYPE_LABELS, type RevenueStreamType } from "@/lib/revenue-model-content";
import { useCommercialMetrics } from "@/lib/use-commercial-metrics";

const TYPE_BADGE: Record<RevenueStreamType, string> = {
  transaction: "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
  recurring: "bg-blue-50 text-blue-900 ring-1 ring-blue-200",
  "one-time": "bg-violet-50 text-violet-900 ring-1 ring-violet-200",
  affiliate: "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200",
  b2b: "bg-slate-800 text-white",
};

const STATUS_STYLE = {
  live: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  launching: "bg-blue-50 text-blue-700 ring-blue-200",
  scheduled: "bg-gray-50 text-gray-500 ring-gray-200",
} as const;

function ProgressBar({ value, tone = "bg-blue-600" }: { value: number; tone?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Target;
}) {
  return (
    <div className="cd-kpi rounded-[20px] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <Icon className="h-4 w-4 text-blue-600" />
      </div>
      <p className="air-font-display text-2xl font-medium text-gray-900">{value}</p>
      {sub ? <p className="mt-1 text-[11px] text-gray-500">{sub}</p> : null}
    </div>
  );
}

export default function CommercialDirectorRevenuePlanPage({
  initialMetrics,
}: {
  initialMetrics?: CommercialMetricsPayload;
}) {
  const planMonth = getCurrentPlanMonth();
  const monthForecast = getCurrentMonthForecast(planMonth);
  const monthExecution = getCurrentMonthExecution(planMonth);
  const targetScenario = getTargetScenario();
  const streamRows = useMemo(() => buildStreamPlanRows(planMonth), [planMonth]);

  const { data: metrics } = useCommercialMetrics({ initialMetrics });
  const actualMtd = parseCommissionMtd(metrics ?? initialMetrics);
  const monthTarget = monthForecast.target;
  const progress = getProgressPct(actualMtd, monthTarget);
  const gap = Math.max(0, monthTarget - actualMtd);

  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});
  const allActions = [
    ...monthExecution.salesActions.map((text) => ({ id: `s-${text}`, text, group: "Sales" as const })),
    ...monthExecution.productActions.map((text) => ({ id: `p-${text}`, text, group: "Product" as const })),
    ...monthExecution.kpis.map((text) => ({ id: `k-${text}`, text, group: "KPI" as const })),
  ];
  const completedCount = allActions.filter((a) => checkedActions[a.id]).length;

  const liveStreams = streamRows.filter((s) => s.status === "live").length;
  const launchingStreams = streamRows.filter((s) => s.status === "launching").length;

  return (
    <CommercialPageShell
      eyebrow="44 Revenue System"
      title="Revenue Command Center"
      description="Plan, actions, and monthly targets — execute the 44-stream strategy and track revenue attainment."
      actions={
        <>
          <Link
            href={commercialDirectorRoute("/tasks")}
            className="rounded-lg border border-gray-200 px-3.5 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
          >
            Tasks
          </Link>
          <Link
            href={commercialDirectorRoute("/leads")}
            className="rounded-lg bg-gray-900 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-gray-800"
          >
            Leads & Sales
          </Link>
        </>
      }
    >
      <div className="air-card rounded-[24px] border border-blue-100 bg-gradient-to-r from-blue-50/80 to-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
              <Calendar className="h-3.5 w-3.5" />
              {getPlanMonthLabel(planMonth)} · Plan month {planMonth} of 12
            </p>
            <h2 className="air-font-display mt-2 text-xl font-medium text-gray-900 sm:text-2xl">{monthExecution.title}</h2>
            <p className="mt-1 text-[13px] text-gray-600">{monthForecast.focus}</p>
          </div>
          <div className="shrink-0 rounded-2xl border border-blue-100 bg-white px-5 py-4 text-right shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">This month target</p>
            <p className="air-font-display text-3xl font-semibold text-gray-900">{formatRevenueGbp(monthTarget)}</p>
            <p className="text-[11px] text-gray-500">M12 run-rate · {formatRevenueGbp(targetScenario.m12Monthly)}/mo</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue MTD (tracked)"
          value={formatRevenueGbp(actualMtd)}
          sub={`${progress}% of ${formatRevenueGbp(monthTarget)} target`}
          icon={CircleDollarSign}
        />
        <KpiCard
          label="Gap to target"
          value={formatRevenueGbp(gap)}
          sub={gap === 0 ? "On or ahead of plan" : "Commission + streams still to close"}
          icon={TrendingUp}
        />
        <KpiCard
          label="Loads target"
          value={String(monthForecast.loadsCompleted)}
          sub={`${monthForecast.newSignups} new signups target`}
          icon={Layers}
        />
        <KpiCard
          label="Streams live"
          value={`${liveStreams + launchingStreams}/44`}
          sub={`${launchingStreams} launching this month`}
          icon={Target}
        />
      </div>

      <div className="cd-kpi rounded-[20px] p-4">
        <div className="mb-2 flex items-center justify-between text-[12px]">
          <span className="font-semibold text-gray-700">Monthly revenue progress</span>
          <span className="font-mono text-gray-500">
            {formatRevenueGbp(actualMtd)} / {formatRevenueGbp(monthTarget)}
          </span>
        </div>
        <ProgressBar value={progress} tone={progress >= 100 ? "bg-emerald-600" : progress >= 50 ? "bg-blue-600" : "bg-amber-500"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="air-card rounded-[24px] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">This month&apos;s action plan</h2>
              <p className="text-[11px] text-gray-500">
                {completedCount}/{allActions.length} items checked · assign via Tasks
              </p>
            </div>
            <Link
              href={commercialDirectorRoute("/tasks")}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-800"
            >
              Open tasks <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-4">
            {(["Sales", "Product", "KPI"] as const).map((group) => {
              const items = allActions.filter((a) => a.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">{group}</p>
                  <ul className="space-y-2">
                    {items.map((item) => {
                      const done = checkedActions[item.id];
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => setCheckedActions((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                            className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-[13px] transition ${
                              done ? "border-emerald-100 bg-emerald-50/60 text-gray-500" : "border-gray-100 bg-gray-50/70 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {done ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                            )}
                            <span className={done ? "line-through" : ""}>{item.text}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Daily effort</p>
            <ul className="mt-2 space-y-1.5 text-[12px] text-gray-600">
              {Object.values(DAILY_EFFORT_TARGETS).map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-blue-500">→</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="air-card overflow-hidden rounded-[24px]">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">12-month roadmap</h2>
            <p className="text-[11px] text-gray-500">Target scenario · full effort</p>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="min-w-full text-left text-[12px]">
              <thead className="cd-table-head sticky top-0 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-4 py-2.5">Month</th>
                  <th className="px-4 py-2.5 text-right">Target</th>
                  <th className="hidden px-4 py-2.5 text-right sm:table-cell">Loads</th>
                </tr>
              </thead>
              <tbody>
                {REVENUE_MONTHLY_FORECAST.map((row) => {
                  const active = row.month === planMonth;
                  return (
                    <tr
                      key={row.month}
                      className={`border-b border-gray-50 ${active ? "bg-blue-50/60 font-semibold" : "hover:bg-gray-50/70"}`}
                    >
                      <td className="px-4 py-2.5 text-gray-800">
                        {row.label}
                        {active ? (
                          <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                            Now
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-700">{formatRevenueGbp(row.target)}</td>
                      <td className="hidden px-4 py-2.5 text-right font-mono text-gray-500 sm:table-cell">{row.loadsCompleted}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50 font-semibold">
                <tr>
                  <td className="px-4 py-3 text-gray-800">Year 1 total</td>
                  <td className="px-4 py-3 text-right font-mono">{formatRevenueGbp(targetScenario.yearCumulative)}</td>
                  <td className="hidden sm:table-cell" />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-[24px] border-2 border-gray-900 bg-white">
        <div className="border-b-2 border-gray-900 bg-gray-900 px-5 py-6 text-white sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">44 Revenue System</p>
              <h2 className="air-font-display mt-2 text-2xl font-medium">Every stream · monthly target</h2>
              <p className="mt-1 max-w-xl text-[13px] text-gray-300">
                M12 full target per stream · this month&apos;s share scaled to {formatRevenueGbp(monthTarget)} total
              </p>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-800 px-5 py-3 text-right">
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Combined M12</p>
              <p className="air-font-display text-2xl font-semibold">{formatRevenueGbp(STREAM_MONTHLY_TARGETS_TOTAL)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-gray-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {streamRows.map((stream) => (
            <div key={stream.id} className="flex flex-col bg-white p-4 hover:bg-gray-50/80">
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[10px] font-bold text-gray-300">{String(stream.id).padStart(2, "0")}</span>
                <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ring-1 ${STATUS_STYLE[stream.status]}`}>
                  {stream.status}
                </span>
              </div>
              <p className="mt-2 min-h-[2.5rem] text-[13px] font-semibold leading-snug text-gray-900">{stream.name}</p>
              <span className={`mt-2 inline-flex w-fit px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${TYPE_BADGE[stream.type]}`}>
                {REVENUE_TYPE_LABELS[stream.type]}
              </span>
              <div className="mt-auto space-y-1 pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">This month</p>
                  <p className="air-font-display text-lg font-semibold text-blue-700">{formatRevenueGbp(stream.monthTarget)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">M12 target</p>
                  <p className="font-mono text-[12px] font-semibold text-gray-700">{formatRevenueGbp(stream.m12Monthly)}</p>
                </div>
                {stream.note ? <p className="text-[11px] text-gray-500">{stream.note}</p> : null}
                <p className="font-mono text-[10px] text-gray-400">Launch M{stream.launchMonth}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Leads & Sales", href: commercialDirectorRoute("/leads"), icon: TrendingUp, desc: "Pipeline & outreach" },
          { label: "Tasks & Follow-ups", href: commercialDirectorRoute("/tasks"), icon: Briefcase, desc: "Assign daily actions" },
          { label: "Revenue view", href: commercialDirectorRoute("/revenue"), icon: CircleDollarSign, desc: "Commission MTD" },
        ].map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="cd-kpi group flex items-center gap-3 rounded-[20px] p-4 transition hover:border-blue-200"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-900">{link.label}</p>
                <p className="text-[11px] text-gray-500">{link.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </CommercialPageShell>
  );
}
