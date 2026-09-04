import {
  DAILY_EFFORT_TARGETS,
  formatRevenueGbp,
  REVENUE_MONTHLY_FORECAST,
  REVENUE_SCENARIOS,
  STREAM_MONTHLY_TARGETS,
  STREAM_MONTHLY_TARGETS_TOTAL,
  TWELVE_MONTH_EXECUTION,
  type StreamMonthlyTarget,
} from "@/lib/revenue-model-content";

/** Plan epoch — month 1 starts August 2026. */
export const COMMERCIAL_PLAN_START = new Date(2026, 7, 1);

export function getCurrentPlanMonth(now = new Date()): number {
  const months =
    (now.getFullYear() - COMMERCIAL_PLAN_START.getFullYear()) * 12 +
    (now.getMonth() - COMMERCIAL_PLAN_START.getMonth()) +
    1;
  return Math.min(12, Math.max(1, months));
}

export function getPlanMonthLabel(month: number) {
  return REVENUE_MONTHLY_FORECAST.find((row) => row.month === month)?.label ?? `Month ${month}`;
}

export function getCurrentMonthForecast(month = getCurrentPlanMonth()) {
  return REVENUE_MONTHLY_FORECAST.find((row) => row.month === month) ?? REVENUE_MONTHLY_FORECAST[0];
}

export function getCurrentMonthExecution(month = getCurrentPlanMonth()) {
  return TWELVE_MONTH_EXECUTION.find((plan) => plan.month === month) ?? TWELVE_MONTH_EXECUTION[0];
}

export function getStreamStatus(stream: StreamMonthlyTarget, planMonth = getCurrentPlanMonth()) {
  if (stream.launchMonth < planMonth) return "live" as const;
  if (stream.launchMonth === planMonth) return "launching" as const;
  return "scheduled" as const;
}

/** Proportional share of this month's total target for one stream. */
export function getStreamMonthTarget(stream: StreamMonthlyTarget, planMonth = getCurrentPlanMonth()) {
  const monthTotal = getCurrentMonthForecast(planMonth).target;
  if (STREAM_MONTHLY_TARGETS_TOTAL <= 0) return 0;
  return Math.round((stream.m12Monthly / STREAM_MONTHLY_TARGETS_TOTAL) * monthTotal);
}

export function getProgressPct(actual: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((actual / target) * 100));
}

export function getTargetScenario() {
  return REVENUE_SCENARIOS.find((s) => s.id === "target") ?? REVENUE_SCENARIOS[1];
}

export type StreamPlanRow = StreamMonthlyTarget & {
  status: "live" | "launching" | "scheduled";
  monthTarget: number;
};

export function buildStreamPlanRows(planMonth = getCurrentPlanMonth()): StreamPlanRow[] {
  return STREAM_MONTHLY_TARGETS.map((stream) => ({
    ...stream,
    status: getStreamStatus(stream, planMonth),
    monthTarget: getStreamMonthTarget(stream, planMonth),
  }));
}

export function parseCommissionMtd(metrics?: { sections?: { revenue?: { metrics?: Array<{ label: string; value: string }> } } }) {
  const raw = metrics?.sections?.revenue?.metrics?.find((m) => m.label === "Commission MTD")?.value ?? "£0";
  const digits = raw.replace(/[^0-9.]/g, "");
  return Number(digits) || 0;
}

export {
  DAILY_EFFORT_TARGETS,
  formatRevenueGbp,
  REVENUE_MONTHLY_FORECAST,
  STREAM_MONTHLY_TARGETS_TOTAL,
  TWELVE_MONTH_EXECUTION,
} from "@/lib/revenue-model-content";
