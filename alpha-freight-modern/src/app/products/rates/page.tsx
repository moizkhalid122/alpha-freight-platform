"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Fuel,
  LineChart,
  MapPin,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";

type RateTab = "general" | "refrigerated" | "flatbed" | "curtain";

const rateTabs: Record<
  RateTab,
  {
    label: string;
    index: string;
    delta: string;
    positive: boolean;
    lanes: { lane: string; miles: string; rate: string; rpm: string; trend: "up" | "down" | "flat" }[];
  }
> = {
  general: {
    label: "General haulage",
    index: "£2.18",
    delta: "+4.2%",
    positive: true,
    lanes: [
      { lane: "London → Manchester", miles: "204 mi", rate: "£445", rpm: "£2.18", trend: "up" },
      { lane: "Birmingham → Leeds", miles: "118 mi", rate: "£248", rpm: "£2.10", trend: "flat" },
      { lane: "Bristol → Glasgow", miles: "386 mi", rate: "£812", rpm: "£2.11", trend: "down" },
      { lane: "Southampton → Edinburgh", miles: "462 mi", rate: "£998", rpm: "£2.16", trend: "up" },
    ],
  },
  refrigerated: {
    label: "Refrigerated",
    index: "£2.54",
    delta: "+6.1%",
    positive: true,
    lanes: [
      { lane: "Felixstowe → Coventry", miles: "156 mi", rate: "£412", rpm: "£2.64", trend: "up" },
      { lane: "London → Cardiff", miles: "151 mi", rate: "£378", rpm: "£2.50", trend: "up" },
      { lane: "Manchester → Aberdeen", miles: "340 mi", rate: "£864", rpm: "£2.54", trend: "flat" },
      { lane: "Dover → Nottingham", miles: "198 mi", rate: "£502", rpm: "£2.54", trend: "down" },
    ],
  },
  flatbed: {
    label: "Flatbed",
    index: "£2.31",
    delta: "-1.4%",
    positive: false,
    lanes: [
      { lane: "Sheffield → Hull", miles: "82 mi", rate: "£198", rpm: "£2.41", trend: "down" },
      { lane: "Newport → Newcastle", miles: "310 mi", rate: "£702", rpm: "£2.26", trend: "flat" },
      { lane: "Liverpool → Plymouth", miles: "286 mi", rate: "£648", rpm: "£2.27", trend: "up" },
      { lane: "Leicester → Exeter", miles: "196 mi", rate: "£452", rpm: "£2.31", trend: "down" },
    ],
  },
  curtain: {
    label: "Curtain-side",
    index: "£2.12",
    delta: "+2.8%",
    positive: true,
    lanes: [
      { lane: "London → Birmingham", miles: "118 mi", rate: "£252", rpm: "£2.14", trend: "up" },
      { lane: "Leeds → London", miles: "196 mi", rate: "£418", rpm: "£2.13", trend: "flat" },
      { lane: "Glasgow → Manchester", miles: "215 mi", rate: "£448", rpm: "£2.08", trend: "down" },
      { lane: "Cambridge → Belfast", miles: "418 mi", rate: "£892", rpm: "£2.13", trend: "up" },
    ],
  },
};

const features = [
  {
    icon: LineChart,
    title: "Live lane indices",
    desc: "Rate-per-mile benchmarks refreshed from marketplace activity across the UK network.",
  },
  {
    icon: Fuel,
    title: "Fuel-adjusted pricing",
    desc: "Indices factor diesel movement so quotes stay aligned with real operating costs.",
  },
  {
    icon: MapPin,
    title: "Regional intelligence",
    desc: "Compare corridors by equipment type, seasonality, and capacity pressure.",
  },
  {
    icon: BarChart3,
    title: "Historical trends",
    desc: "30/90-day lane history helps suppliers price competitively and carriers bid with confidence.",
  },
];

const outcomes = [
  { label: "Lanes tracked", value: "850+", note: "UK corridors" },
  { label: "Refresh cadence", value: "15 min", note: "market updates" },
  { label: "Pricing accuracy", value: "±6%", note: "vs closed loads" },
];

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-rose-600" />;
  return <span className="h-1.5 w-3.5 rounded-full bg-slate-300" />;
}

function RatesDashboardMock({ activeTab }: { activeTab: RateTab }) {
  const data = rateTabs[activeTab];

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full min-w-0 rounded-[1.6rem] bg-gradient-to-br from-white/40 via-white/22 to-white/10 p-1.5 shadow-[0_28px_70px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.75)] ring-1 ring-white/50 backdrop-blur-2xl sm:rounded-[1.75rem] sm:p-2"
    >
      <div className="overflow-hidden rounded-[1.25rem] border border-white/75 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] sm:rounded-[1.35rem]">
        <div className="flex min-h-[560px] flex-col lg:min-h-[620px] lg:flex-row">
          <aside className="border-b border-slate-100 bg-gradient-to-b from-emerald-50/60 to-white p-5 lg:w-[240px] lg:border-b-0 lg:border-r">
            <div className="mb-8 flex items-center gap-2.5">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
                <Image src="/logo.png" alt="Alpha Freight" fill sizes="32px" className="object-contain p-1" />
              </div>
              <span className="text-sm font-semibold text-slate-800">RatePulse</span>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Market index</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{data.index}</p>
              <p className="text-sm text-slate-500">avg £/mile</p>
              <div
                className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  data.positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
              >
                {data.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {data.delta} vs last week
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1 p-5 sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Live market rates</p>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{data.label}</h3>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Updated 4m ago</span>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-slate-200">
              <div className="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_0.4fr] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                <span>Lane</span>
                <span>Distance</span>
                <span>Spot rate</span>
                <span>£/mile</span>
                <span>Trend</span>
              </div>
              {data.lanes.map((lane, index) => (
                <div
                  key={lane.lane}
                  className={`grid grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_0.4fr] gap-3 px-4 py-4 text-sm ${
                    index < data.lanes.length - 1 ? "border-b border-slate-100" : ""
                  }`}
                >
                  <span className="font-semibold text-slate-900">{lane.lane}</span>
                  <span className="text-slate-500">{lane.miles}</span>
                  <span className="font-semibold text-slate-900">{lane.rate}</span>
                  <span className="text-slate-700">{lane.rpm}</span>
                  <span className="flex items-center">
                    <TrendIcon trend={lane.trend} />
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Capacity pressure", value: "Moderate", note: "M1 corridor" },
                { label: "Fuel surcharge", value: "+8.4%", note: "rolling index" },
                { label: "Best value lane", value: data.lanes[0]?.lane.split(" → ")[0] ?? "—", note: "this week" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
                  <p className="text-[11px] font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-lg font-bold tracking-tight text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{stat.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function MarketRatesProductPage() {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<RateTab>("general");
  const tabs = useMemo(() => Object.keys(rateTabs) as RateTab[], []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveTab((current) => {
        const index = tabs.indexOf(current);
        return tabs[(index + 1) % tabs.length] ?? "general";
      });
    }, 5500);
    return () => window.clearInterval(interval);
  }, [tabs]);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".rates-hero-item", {
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
      className="min-h-screen overflow-x-hidden bg-[#fafafa] font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black"
    >
      <Navbar variant="dark" />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-[#fafafa] pt-28 pb-12 sm:pb-16 lg:pb-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.14),transparent_70%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.10),transparent_40%)]" />

          <div className="relative z-10 mx-auto max-w-[980px] px-6 text-center lg:px-10">
            <p className="rates-hero-item text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-600">
              Market Rates
            </p>
            <h1 className="rates-hero-item mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.45rem] lg:leading-[1.06]">
              Live freight market pricing
            </h1>
            <p className="rates-hero-item mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
              Price loads with confidence using lane-level indices, equipment-specific benchmarks, and fuel-adjusted
              intelligence from the Alpha Freight marketplace.
            </p>
            <div className="rates-hero-item mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/available-loads"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Browse live loads
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Post a load
              </Link>
            </div>
          </div>

          <div className="rates-hero-item relative z-10 mx-auto mt-10 w-full max-w-[1240px] px-4 sm:mt-12 sm:px-6 lg:px-10">
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    activeTab === tab
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {rateTabs[tab].label}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <RatesDashboardMock activeTab={activeTab} />
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

        <section className="py-20">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto grid max-w-[1180px] gap-10 px-6 lg:grid-cols-2 lg:px-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-600">How teams use it</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Price smarter on every lane</h2>
              <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
                {[
                  "Suppliers benchmark posted rates before publishing to the marketplace",
                  "Carriers spot profitable lanes before bidding on available loads",
                  "Brokers defend margins with corridor-level rate-per-mile visibility",
                  "Finance teams export indices for forecasting and customer quotes",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-[#fafafa] p-8">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-emerald-600" />
                <h3 className="text-xl font-bold">Connected to marketplace activity</h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                RatePulse indices are derived from verified load activity, accepted bids, and corridor demand across the
                Alpha Freight network — not generic industry averages.
              </p>
              <Link
                href="/products/smart-matching"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                See smart matching
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-20 text-white">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Truck, label: "Equipment types", value: "4+" },
                { icon: LineChart, label: "History", value: "90 days" },
                { icon: Fuel, label: "Fuel index", value: "Live" },
                { icon: MapPin, label: "UK lanes", value: "850+" },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-center">
                    <Icon className="mx-auto h-6 w-6 text-[#BFFF07]" />
                    <p className="mt-4 text-2xl font-bold">{card.value}</p>
                    <p className="mt-2 text-sm text-white/50">{card.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <CinematicCTA
          title="Quote with market confidence"
          subtitle="See live rates inside your Alpha Freight workspace."
          buttonText="Get started free"
          buttonHref="/auth/signup"
        />
      </main>

      <Footer />
    </div>
  );
}
