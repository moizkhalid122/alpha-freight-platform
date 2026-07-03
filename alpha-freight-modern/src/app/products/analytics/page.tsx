"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Download,
  Gauge,
  Globe,
  LayoutDashboard,
  LineChart,
  PieChart,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";

type AnalyticsTab = "operations" | "financial" | "carriers" | "lanes";

const tabConfig: Record<
  AnalyticsTab,
  {
    label: string;
    headline: string;
    kpis: { label: string; value: string; delta: string; positive: boolean }[];
    bars: number[];
    line: number[];
    highlights: string[];
  }
> = {
  operations: {
    label: "Operations",
    headline: "Network performance overview",
    kpis: [
      { label: "On-time delivery", value: "98.4%", delta: "+2.1%", positive: true },
      { label: "Active loads", value: "1,284", delta: "+8.4%", positive: true },
      { label: "Avg assignment", value: "47m", delta: "-12%", positive: true },
    ],
    bars: [42, 68, 55, 82, 74, 91, 88, 96],
    line: [32, 48, 44, 62, 58, 71, 68, 84, 80, 92],
    highlights: [
      "Live load lifecycle visibility across pickup, transit, and POD",
      "Exception alerts for delayed milestones and missing documents",
      "Daily throughput trends by region and equipment type",
    ],
  },
  financial: {
    label: "Financial",
    headline: "Revenue & spend intelligence",
    kpis: [
      { label: "Gross freight value", value: "£2.4M", delta: "+11%", positive: true },
      { label: "Platform margin", value: "14.2%", delta: "+0.8%", positive: true },
      { label: "Outstanding payables", value: "£186k", delta: "-6%", positive: true },
    ],
    bars: [58, 64, 72, 69, 78, 85, 92, 88],
    line: [40, 52, 49, 61, 66, 74, 70, 82, 86, 94],
    highlights: [
      "Invoice, payout, and wallet reconciliation in one view",
      "Lane profitability and cost-per-mile breakdowns",
      "Export-ready financial reports for finance teams",
    ],
  },
  carriers: {
    label: "Carriers",
    headline: "Carrier scorecard analytics",
    kpis: [
      { label: "Elite carriers", value: "84%", delta: "+3%", positive: true },
      { label: "Avg POD quality", value: "96%", delta: "+1.4%", positive: true },
      { label: "Bid win rate", value: "31%", delta: "+5%", positive: true },
    ],
    bars: [36, 52, 61, 58, 70, 76, 83, 79],
    line: [28, 38, 42, 49, 55, 63, 60, 72, 78, 86],
    highlights: [
      "Performance tiers based on completion, POD, and reliability",
      "Fleet utilization and response-time benchmarking",
      "Compliance and insurance status at carrier level",
    ],
  },
  lanes: {
    label: "Lanes",
    headline: "Lane optimization insights",
    kpis: [
      { label: "Top lane volume", value: "LDN→MAN", delta: "+18%", positive: true },
      { label: "Cost reduction", value: "15%", delta: "AI routed", positive: true },
      { label: "Deadhead cut", value: "22 mi", delta: "avg/run", positive: true },
    ],
    bars: [48, 55, 63, 71, 67, 74, 81, 90],
    line: [34, 41, 47, 53, 58, 66, 62, 75, 81, 89],
    highlights: [
      "Historical rate bands and demand heatmaps by corridor",
      "Backhaul opportunity detection and lane chaining",
      "Seasonal trend forecasting for capacity planning",
    ],
  },
};

const outcomes = [
  { label: "Decision speed", value: "4.6x", note: "vs spreadsheet reporting" },
  { label: "Report generation", value: "<30s", note: "custom exports" },
  { label: "Data freshness", value: "Real-time", note: "live platform sync" },
];

const modules = [
  {
    icon: BarChart3,
    title: "Executive KPI bento",
    desc: "Surface the metrics leadership teams need — OTD, margin, volume, and network health in one view.",
  },
  {
    icon: ShieldCheck,
    title: "Carrier scorecards",
    desc: "Rank carriers by reliability, POD quality, bid behavior, and compliance status.",
  },
  {
    icon: Globe,
    title: "Lane intelligence",
    desc: "Analyze corridor demand, rate bands, deadhead, and profitability across your network.",
  },
  {
    icon: Wallet,
    title: "Financial reporting",
    desc: "Track freight value, payouts, receivables, and margin with export-ready summaries.",
  },
  {
    icon: LineChart,
    title: "Trend forecasting",
    desc: "AI-assisted projections for volume, capacity pressure, and on-time performance.",
  },
  {
    icon: Download,
    title: "Custom exports",
    desc: "Schedule CSV/PDF reports or push data to BI tools via API and webhooks.",
  },
];

const sidebarNav = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Operations", icon: Gauge, active: false },
  { label: "Financial", icon: Wallet, active: false },
  { label: "Carriers", icon: Truck, active: false },
  { label: "Lanes", icon: Globe, active: false },
  { label: "Reports", icon: PieChart, active: false },
];

function AnimatedBars({ values, accent = "#BFFF07" }: { values: number[]; accent?: string }) {
  return (
    <div className="flex h-36 items-end gap-2">
      {values.map((height, index) => (
        <motion.div
          key={`${height}-${index}`}
          className="flex-1 rounded-t-lg"
          style={{ background: `linear-gradient(180deg, ${accent} 0%, ${accent}66 100%)` }}
          initial={{ height: 0 }}
          animate={{ height: `${height}%` }}
          transition={{ duration: 0.7, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  );
}

function AnimatedLine({ values }: { values: number[] }) {
  const width = 420;
  const height = 120;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (value / 100) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full" aria-hidden="true">
      <defs>
        <linearGradient id="analyticsLineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 6" />
      <motion.polyline
        points={points}
        fill="none"
        stroke="#6d28d9"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#analyticsLineFill)" />
    </svg>
  );
}

function AnalyticsDashboardMock({ activeTab }: { activeTab: AnalyticsTab }) {
  const data = tabConfig[activeTab];

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full min-w-0 rounded-[1.6rem] bg-gradient-to-br from-white/40 via-white/22 to-white/10 p-1.5 shadow-[0_28px_70px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.75)] ring-1 ring-white/50 backdrop-blur-2xl sm:rounded-[1.75rem] sm:p-2"
    >
      <div className="overflow-hidden rounded-[1.25rem] border border-white/75 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] sm:rounded-[1.35rem]">
        <div className="flex min-h-[600px] w-full lg:min-h-[660px]">
          <aside className="hidden w-[228px] shrink-0 border-r border-slate-100 bg-gradient-to-b from-slate-50/70 to-white p-5 lg:block">
            <div className="mb-8 flex items-center gap-2.5">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
                <Image src="/logo.png" alt="Alpha Freight" fill sizes="32px" className="object-contain p-1" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Alpha Insights</span>
            </div>
            <div className="space-y-1">
              {sidebarNav.map((item) => {
                const Icon = item.icon;
                const isActive = item.active;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                      isActive
                        ? "bg-white font-semibold text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/80"
                        : "font-medium text-slate-500 hover:bg-white/70 hover:text-slate-700"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        isActive ? "bg-violet-100 text-violet-700" : "text-slate-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </div>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0 flex-1 p-5 sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Analytics command center</p>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{data.headline}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Live sync
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {data.kpis.map((kpi) => (
                <div key={kpi.label} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 sm:px-5 sm:py-5">
                  <p className="text-[11px] font-medium text-slate-500">{kpi.label}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">{kpi.value}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        kpi.positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {kpi.delta}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.35rem] border border-slate-200 bg-gradient-to-br from-violet-50/80 via-white to-white p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Performance trend</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">Weekly throughput index</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-5 rounded-xl border border-slate-100 bg-white/80 p-4">
                  <AnimatedBars values={data.bars} accent="#7c3aed" />
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Aggregated telemetry from loads, bids, assignments, and POD events across your network.
                </p>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Forecast curve</p>
                <p className="mt-1 text-lg font-bold text-slate-900">AI projection</p>
                <div className="mt-4">
                  <AnimatedLine values={data.line} />
                </div>
                <div className="mt-3 space-y-2">
                  {data.highlights.slice(0, 2).map((item) => (
                    <div key={item} className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
                <p className="text-sm font-semibold text-slate-900">Insight feed</p>
                <div className="mt-3 space-y-2">
                  {data.highlights.map((item, index) => (
                    <div key={item} className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-6 text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-[#fafafa] p-4">
                <p className="text-sm font-semibold text-slate-900">Top segments</p>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Refrigerated", value: "34%" },
                    { label: "Curtain-side", value: "28%" },
                    { label: "Flatbed", value: "19%" },
                  ].map((segment) => (
                    <div key={segment.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">{segment.label}</span>
                        <span className="font-bold text-slate-900">{segment.value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <motion.div
                          className="h-full rounded-full bg-violet-600"
                          initial={{ width: 0 }}
                          animate={{ width: segment.value }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AnalyticsDashboardPage() {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("operations");

  const tabs = useMemo(() => Object.keys(tabConfig) as AnalyticsTab[], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((current) => {
        const index = tabs.indexOf(current);
        return tabs[(index + 1) % tabs.length] ?? "operations";
      });
    }, 5500);
    return () => clearInterval(interval);
  }, [tabs]);

  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".analytics-hero-item", {
        y: 42,
        opacity: 0,
        duration: 0.95,
        stagger: 0.1,
        ease: "power4.out",
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pageRef}
      className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black"
    >
      <Navbar variant="dark" />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-[#fafafa] pt-28 pb-12 sm:pb-16 lg:pb-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(109,40,217,0.12),transparent_70%),radial-gradient(circle_at_80%_20%,rgba(191,255,7,0.10),transparent_40%)]" />

          <div className="relative z-10 mx-auto max-w-[980px] px-6 text-center lg:px-10">
            <p className="analytics-hero-item text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-600">
              Analytics Dashboard
            </p>
            <h1 className="analytics-hero-item mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.45rem] lg:leading-[1.06]">
              Data-driven shipping intelligence
            </h1>
            <p className="analytics-hero-item mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
              Transform live freight telemetry into executive KPIs, carrier scorecards, lane insights, and
              financial reporting — all in one premium analytics workspace.
            </p>
            <div className="analytics-hero-item mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Request analytics demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin/analytics"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Explore admin analytics
              </Link>
            </div>
          </div>

          <div className="analytics-hero-item relative z-10 mx-auto mt-10 w-full max-w-[1240px] px-4 sm:mt-12 sm:px-6 lg:px-10">
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition ${
                    activeTab === tab
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {tabConfig[tab].label}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <AnalyticsDashboardMock activeTab={activeTab} />
            </AnimatePresence>
          </div>

          <div className="relative z-10 mx-auto mt-10 grid max-w-[920px] grid-cols-1 gap-4 px-6 sm:grid-cols-3 lg:px-10">
            {outcomes.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 text-center backdrop-blur-sm"
              >
                <p className="text-2xl font-bold tracking-tight text-slate-900">{item.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-1 text-[11px] text-slate-400">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-slate-200/70 bg-white py-20">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600">Intelligence modules</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">One dashboard. Every signal.</h2>
              <p className="mt-4 text-slate-600">
                From operations to finance, Alpha analytics connects live platform data with the reporting layers
                your teams actually use.
              </p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module, index) => {
                const Icon = module.icon;
                return (
                  <motion.div
                    key={module.title}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-[1.5rem] border border-slate-200/80 bg-[#fafafa] p-6 transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-[#BFFF07]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-bold text-slate-900">{module.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{module.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200/70 bg-slate-950 py-20 text-white">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#BFFF07]">Bento intelligence</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Built for operators and executives</h2>
                <p className="mt-4 text-white/60">
                  Dispatch teams monitor live exceptions. Leadership tracks margin and network health. Finance exports
                  reconciliations — without switching tools.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    "Real-time sync with loads, bids, POD, and wallet events",
                    "Role-based views for admin, supplier, and carrier teams",
                    "Predictive alerts before delays become disputes",
                    "API + webhook feeds for Power BI, Looker, and Tableau",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-white/70">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#BFFF07]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Users, label: "Teams enabled", value: "Admin · Supplier · Carrier" },
                  { icon: Target, label: "KPI categories", value: "40+ tracked metrics" },
                  { icon: Sparkles, label: "AI insights", value: "Auto-generated" },
                  { icon: Gauge, label: "Refresh rate", value: "Sub-minute" },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.label}
                      className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
                    >
                      <Icon className="h-5 w-5 text-[#BFFF07]" />
                      <p className="mt-4 text-sm font-semibold text-white/50">{card.label}</p>
                      <p className="mt-2 text-lg font-bold tracking-tight">{card.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="rounded-[2rem] border border-slate-200 bg-[#fafafa] p-8 sm:p-10 lg:p-12">
              <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-violet-600" />
                    <h2 className="text-3xl font-bold tracking-tight">From telemetry to action</h2>
                  </div>
                  <p className="mt-4 text-slate-600">
                    Alpha Analytics doesn&apos;t just visualize history — it helps teams intervene earlier, price smarter,
                    and allocate capacity with confidence.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { title: "Detect", desc: "Spot lane pressure and carrier drift early" },
                    { title: "Decide", desc: "Compare scenarios with live KPI context" },
                    { title: "Dispatch", desc: "Act on recommendations inside Alpha" },
                    { title: "Deliver", desc: "Measure outcomes and refine continuously" },
                  ].map((step) => (
                    <div key={step.title} className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
                      <p className="text-sm font-bold text-violet-600">{step.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <CinematicCTA
          title="Turn freight data into advantage"
          subtitle="See how Alpha Analytics fits your operation."
          buttonText="Book a demo"
          buttonHref="/contact"
        />
      </main>

      <Footer />
    </div>
  );
}
