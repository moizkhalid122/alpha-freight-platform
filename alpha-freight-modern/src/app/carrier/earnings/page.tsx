"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp,
  DollarSign,
  Target,
  Award,
  ArrowRight,
  Download,
  Loader2,
  Package,
  Clock,
  CheckCircle2,
  BarChart3,
  Wallet,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TimeRange = "week" | "month" | "year";

type LoadRecord = {
  id: string;
  price: number | string | null;
  status: string | null;
  created_at: string | null;
  delivery_date?: string | null;
};

type CarrierPodUploadRecord = {
  uploadedAt?: string | null;
};

type EarningsSummary = {
  totalEarnings: number;
  activeRevenue: number;
  growth: number;
  avgPerLoad: number;
  completedCount: number;
  highestPayout: number;
  activeLoadsCount: number;
  completionRate: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
};

type ChartPoint = {
  name: string;
  revenue: number;
};

const COMPLETED_STATUSES = new Set(["completed", "delivered"]);
const ACTIVE_STATUSES = new Set(["in-transit", "loading", "booked", "assigned", "active", "pending"]);
const POD_UPLOADS_STORAGE_KEY = "alpha-carrier-pod-uploads";

function normalizeStatus(status: string | null | undefined) {
  return String(status || "").trim().toLowerCase();
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getRangeStart(range: TimeRange) {
  const now = new Date();
  if (range === "week") return startOfDay(addDays(now, -6));
  if (range === "month") return startOfDay(addDays(now, -29));
  return startOfMonth(addMonths(now, -11));
}

function getPreviousRange(range: TimeRange) {
  const currentStart = getRangeStart(range);
  const currentEnd = new Date();

  if (range === "week") {
    const previousEnd = addDays(currentStart, -1);
    const previousStart = startOfDay(addDays(previousEnd, -6));
    return { previousStart, previousEnd };
  }

  if (range === "month") {
    const previousEnd = addDays(currentStart, -1);
    const previousStart = startOfDay(addDays(previousEnd, -29));
    return { previousStart, previousEnd };
  }

  const previousEnd = addDays(currentStart, -1);
  const previousStart = startOfMonth(addMonths(currentStart, -12));
  return { previousStart, previousEnd };
}

function formatMoney(value: number, compact = false) {
  if (compact && value >= 1000) {
    return `£${(value / 1000).toFixed(1)}k`;
  }
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function readCarrierPodUploads(): Record<string, CarrierPodUploadRecord> {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(POD_UPLOADS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getCompletedLoadDate(
  load: LoadRecord,
  podUploads: Record<string, CarrierPodUploadRecord>
) {
  const effectiveDate =
    podUploads[load.id]?.uploadedAt || load.delivery_date || load.created_at;
  return effectiveDate ? new Date(effectiveDate) : null;
}

function buildChartData(
  loads: LoadRecord[],
  timeRange: TimeRange,
  podUploads: Record<string, CarrierPodUploadRecord>
) {
  const completedLoads = loads.filter((load) => COMPLETED_STATUSES.has(normalizeStatus(load.status)));
  const buckets: ChartPoint[] = [];
  const now = new Date();

  if (timeRange === "year") {
    for (let index = 11; index >= 0; index -= 1) {
      const bucketDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const nextMonth = new Date(bucketDate.getFullYear(), bucketDate.getMonth() + 1, 1);
      const revenue = completedLoads
        .filter((load) => {
          const completedAt = getCompletedLoadDate(load, podUploads);
          return completedAt && completedAt >= bucketDate && completedAt < nextMonth;
        })
        .reduce((sum, load) => sum + toNumber(load.price), 0);

      buckets.push({
        name: bucketDate.toLocaleDateString("en-GB", { month: "short" }),
        revenue,
      });
    }

    return buckets;
  }

  const totalDays = timeRange === "week" ? 7 : 30;
  for (let index = totalDays - 1; index >= 0; index -= 1) {
    const bucketDate = startOfDay(addDays(now, -index));
    const nextDay = addDays(bucketDate, 1);
    const revenue = completedLoads
      .filter((load) => {
        const completedAt = getCompletedLoadDate(load, podUploads);
        return completedAt && completedAt >= bucketDate && completedAt < nextDay;
      })
      .reduce((sum, load) => sum + toNumber(load.price), 0);

    buckets.push({
      name:
        timeRange === "week"
          ? bucketDate.toLocaleDateString("en-GB", { weekday: "short" })
          : bucketDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      revenue,
    });
  }

  return buckets;
}

function deriveSummary(
  loads: LoadRecord[],
  timeRange: TimeRange,
  podUploads: Record<string, CarrierPodUploadRecord>
): EarningsSummary {
  const currentStart = getRangeStart(timeRange);
  const currentEnd = new Date();
  const { previousStart, previousEnd } = getPreviousRange(timeRange);
  const currentMonthStart = startOfMonth(new Date());
  const previousMonthStart = startOfMonth(addMonths(new Date(), -1));

  const completedLoads = loads.filter((load) => COMPLETED_STATUSES.has(normalizeStatus(load.status)));
  const activeLoads = loads.filter((load) => ACTIVE_STATUSES.has(normalizeStatus(load.status)));
  const currentRangeCompleted = completedLoads.filter((load) => {
    const completedAt = getCompletedLoadDate(load, podUploads);
    return completedAt && completedAt >= currentStart && completedAt <= currentEnd;
  });
  const previousRangeCompleted = completedLoads.filter((load) => {
    const completedAt = getCompletedLoadDate(load, podUploads);
    return completedAt && completedAt >= previousStart && completedAt <= previousEnd;
  });

  const totalEarnings = currentRangeCompleted.reduce((sum, load) => sum + toNumber(load.price), 0);
  const previousTotal = previousRangeCompleted.reduce((sum, load) => sum + toNumber(load.price), 0);
  const activeRevenue = activeLoads.reduce((sum, load) => sum + toNumber(load.price), 0);
  const currentMonthRevenue = completedLoads
    .filter((load) => {
      const completedAt = getCompletedLoadDate(load, podUploads);
      return completedAt && completedAt >= currentMonthStart;
    })
    .reduce((sum, load) => sum + toNumber(load.price), 0);
  const previousMonthRevenue = completedLoads
    .filter((load) => {
      const completedAt = getCompletedLoadDate(load, podUploads);
      return completedAt && completedAt >= previousMonthStart && completedAt < currentMonthStart;
    })
    .reduce((sum, load) => sum + toNumber(load.price), 0);

  const growth =
    previousTotal > 0 ? Number((((totalEarnings - previousTotal) / previousTotal) * 100).toFixed(1)) : 0;

  return {
    totalEarnings,
    activeRevenue,
    growth,
    avgPerLoad: currentRangeCompleted.length > 0 ? totalEarnings / currentRangeCompleted.length : 0,
    completedCount: currentRangeCompleted.length,
    highestPayout: currentRangeCompleted.reduce((max, load) => Math.max(max, toNumber(load.price)), 0),
    activeLoadsCount: activeLoads.length,
    completionRate:
      loads.length > 0 ? Math.round((completedLoads.length / Math.max(loads.length, 1)) * 100) : 0,
    currentMonthRevenue,
    previousMonthRevenue,
  };
}

export default function EarningsPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [loads, setLoads] = useState<LoadRecord[]>([]);
  const [podUploads, setPodUploads] = useState<Record<string, CarrierPodUploadRecord>>({});

  useEffect(() => {
    async function fetchEarningsData() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoads([]);
          return;
        }

        const { data, error } = await supabase
          .from("loads")
          .select("id, price, status, created_at, delivery_date")
          .eq("carrier_id", user.id)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setLoads((data ?? []) as LoadRecord[]);
        setPodUploads(readCarrierPodUploads());
      } catch (err) {
        console.error("Error fetching earnings:", err);
        setLoads([]);
        setPodUploads({});
      } finally {
        setLoading(false);
      }
    }

    fetchEarningsData();
  }, []);

  const stats = useMemo(() => deriveSummary(loads, timeRange, podUploads), [loads, podUploads, timeRange]);
  const chartData = useMemo(
    () => buildChartData(loads, timeRange, podUploads),
    [loads, podUploads, timeRange]
  );
  const monthGoalBase = Math.max(stats.previousMonthRevenue, stats.currentMonthRevenue, 1);
  const monthGoalTarget = Math.max(Math.round(monthGoalBase * 1.15), 1000);
  const monthGoalProgress = Math.min((stats.currentMonthRevenue / monthGoalTarget) * 100, 100);

  const statCards = [
    {
      label: "Gross revenue",
      value: formatMoney(stats.totalEarnings),
      sub: stats.growth === 0 ? "No change vs prior period" : `${stats.growth > 0 ? "+" : ""}${stats.growth}% vs prior`,
      icon: DollarSign,
      tone: stats.growth >= 0 ? "text-emerald-600" : "text-rose-600",
    },
    {
      label: "Active revenue",
      value: formatMoney(stats.activeRevenue),
      sub: `${stats.activeLoadsCount} live loads`,
      icon: Clock,
      tone: "text-blue-600",
    },
    {
      label: "Avg. per load",
      value: formatMoney(stats.avgPerLoad),
      sub: timeRange === "year" ? "12 month window" : timeRange === "month" ? "30 day window" : "7 day window",
      icon: Target,
      tone: "text-amber-600",
    },
    {
      label: "Completed loads",
      value: stats.completedCount.toLocaleString(),
      sub: `${stats.completionRate}% completion rate`,
      icon: Package,
      tone: "text-violet-600",
    },
  ];

  const liveMetrics = [
    {
      title: "Highest completed load",
      value: formatMoney(stats.highestPayout),
      note: timeRange === "year" ? "Best in 12 months" : `Best in selected ${timeRange}`,
    },
    {
      title: "Active loads",
      value: stats.activeLoadsCount.toLocaleString(),
      note: "Currently in motion",
    },
    {
      title: "Completion rate",
      value: `${stats.completionRate}%`,
      note: "Of all assigned loads",
    },
  ];

  const rangeLabel =
    timeRange === "year" ? "Last 12 months" : timeRange === "month" ? "Last 30 days" : "Last 7 days";

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <div className="rounded-md bg-slate-900 p-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Revenue analytics
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Earnings</h1>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Completed revenue, active pipeline, and performance across your carrier account
            </p>
          </div>

          <div className="flex gap-1 rounded-lg bg-slate-100/80 p-1">
            {(["week", "month", "year"] as TimeRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`rounded-md px-4 py-1.5 text-[11px] font-semibold capitalize transition ${
                  timeRange === range
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl bg-slate-50/80 py-16 text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-slate-400" />
            <p className="text-[13px] text-slate-500">Loading earnings data…</p>
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60 sm:p-6">
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
              <div className="flex flex-col gap-5 pl-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    {rangeLabel} · gross revenue
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    {formatMoney(stats.totalEarnings)}
                  </p>
                  <p
                    className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      stats.growth > 0
                        ? "bg-emerald-50 text-emerald-700"
                        : stats.growth < 0
                          ? "bg-rose-50 text-rose-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {stats.growth === 0
                      ? "Flat vs prior period"
                      : `${stats.growth > 0 ? "+" : ""}${stats.growth}% vs prior period`}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[280px]">
                  {[
                    { label: "This month", value: formatMoney(stats.currentMonthRevenue) },
                    { label: "Last month", value: formatMoney(stats.previousMonthRevenue) },
                    { label: "Top load", value: formatMoney(stats.highestPayout) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-[10px] text-slate-500">{item.label}</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 pl-3">
                <div className="mb-1.5 flex justify-between text-[10px] text-slate-500">
                  <span>Monthly goal progress</span>
                  <span>
                    {formatMoney(stats.currentMonthRevenue)} / {formatMoney(monthGoalTarget)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${monthGoalProgress}%` }}
                    className="h-full rounded-full bg-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {statCards.map((item) => (
                <div key={item.label} className="rounded-xl bg-slate-50/80 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <item.icon className={`h-3.5 w-3.5 ${item.tone}`} />
                    <p className="text-[11px] text-slate-500">{item.label}</p>
                  </div>
                  <p className="mt-1 text-xl font-bold text-slate-900">{item.value}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{item.sub}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {!loading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60 sm:p-5"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-400" />
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Revenue stream</h2>
                  <p className="text-[12px] text-slate-500">
                    {timeRange === "year" ? "Monthly completed revenue" : "Daily completed revenue"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                aria-label="Download chart"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>

            <div className="h-[320px] w-full">
              {chartData.some((point) => point.revenue > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickFormatter={(value) => formatMoney(Number(value), true)}
                      width={48}
                    />
                    <Tooltip
                      formatter={(value) => [formatMoney(Number(value ?? 0)), "Revenue"]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0f172a"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <CheckCircle2 className="h-9 w-9 text-slate-300" />
                  <p className="mt-3 text-[15px] font-semibold text-slate-900">
                    No completed earnings in this range
                  </p>
                  <p className="mt-1 max-w-md text-[13px] text-slate-500">
                    Deliver and complete loads — revenue trends will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50/80 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-violet-600" />
                <h3 className="text-[13px] font-bold text-slate-900">Performance snapshot</h3>
              </div>
              <div className="space-y-3">
                {liveMetrics.map((metric) => (
                  <div
                    key={metric.title}
                    className="flex items-center justify-between gap-3 border-b border-slate-200/60 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-[12px] font-semibold text-slate-800">{metric.title}</p>
                      <p className="text-[11px] text-slate-500">{metric.note}</p>
                    </div>
                    <p className="text-[13px] font-bold text-slate-900">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50/80 p-4">
              <p className="text-[11px] text-slate-500">Month-to-date target</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {Math.round(monthGoalProgress)}%
              </p>
              <p className="mt-1 text-[12px] text-slate-500">
                {formatMoney(stats.currentMonthRevenue)} earned toward {formatMoney(monthGoalTarget)} goal
              </p>
            </div>

            <Link
              href="/carrier/wallet"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800"
            >
              <Wallet className="h-4 w-4" />
              Open wallet
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
