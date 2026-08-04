"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Clock,
  Fuel,
  Gauge,
  LayoutDashboard,
  MapPin,
  Navigation,
  Route,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  Truck,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";

gsap.registerPlugin(ScrollTrigger);

const outcomes = [
  { label: "Fuel reduction", value: "14%", note: "average fleet saving" },
  { label: "Miles saved", value: "22 mi", note: "per multi-stop run" },
  { label: "On-time ETA", value: "96%", note: "prediction accuracy" },
];

const optimizerSignals = [
  {
    title: "Stop sequencing",
    desc: "AI reorders pickups and drops to minimize total distance and waiting time.",
    icon: Route,
    weight: "30%",
  },
  {
    title: "Traffic intelligence",
    desc: "Live congestion, roadworks, and closure data reroute drivers before delays stack up.",
    icon: Navigation,
    weight: "24%",
  },
  {
    title: "Fuel modeling",
    desc: "Terrain, payload, and vehicle profile inform cost-per-mile and eco routing.",
    icon: Fuel,
    weight: "18%",
  },
  {
    title: "HOS windows",
    desc: "Driver hours, break rules, and depot cut-offs stay inside compliant schedules.",
    icon: Clock,
    weight: "16%",
  },
  {
    title: "Empty-mile cut",
    desc: "Backhaul suggestions and lane chaining reduce deadhead between jobs.",
    icon: TrendingDown,
    weight: "12%",
  },
];

const workflow = [
  {
    step: "01",
    title: "Import stops",
    desc: "Pull live loads, manifests, or multi-drop jobs from Alpha Freight or your TMS.",
  },
  {
    step: "02",
    title: "AI optimizes route",
    desc: "The engine sequences stops, models fuel, and simulates traffic-aware ETAs in seconds.",
  },
  {
    step: "03",
    title: "Dispatch & adapt",
    desc: "Push the plan to drivers — then auto-reroute when conditions change mid-journey.",
  },
];

const routeStops = [
  { city: "London", code: "LDN", time: "06:40", status: "Departed" },
  { city: "Milton Keynes", code: "MK", time: "08:05", status: "Optimized" },
  { city: "Birmingham", code: "BHM", time: "09:20", status: "Drop 1" },
  { city: "Manchester", code: "MAN", time: "11:10", status: "Drop 2" },
  { city: "Leeds", code: "LDS", time: "12:35", status: "Final" },
];

const compareRows = [
  { label: "Total distance", before: "312 mi", after: "268 mi", delta: "-14%" },
  { label: "Drive time", before: "6h 48m", after: "5h 52m", delta: "-14%" },
  { label: "Fuel estimate", before: "£186", after: "£159", delta: "-£27" },
  { label: "Idle waiting", before: "47 min", after: "19 min", delta: "-60%" },
];

const sidebarNav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Routes", icon: Route },
  { label: "Fleet", icon: Truck },
  { label: "Fuel", icon: Fuel },
  { label: "Live map", icon: MapPin },
];

const routePathPoints = [
  { cx: 48, cy: 220 },
  { cx: 160, cy: 150 },
  { cx: 280, cy: 110 },
  { cx: 400, cy: 88 },
  { cx: 520, cy: 58 },
];

const routePathD = "M 48 220 C 90 180, 120 160, 160 150 S 240 120, 280 110 S 360 95, 400 88 S 480 72, 520 58";
const routeProgressByStop = [0, 0.2, 0.46, 0.72, 1];

function RouteMapMockup({ activeStop }: { activeStop: number }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const progress = routeProgressByStop[activeStop] ?? 0;

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    setPathLength(path.getTotalLength());
  }, []);

  const truckPoint = useMemo(() => {
    const path = pathRef.current;
    if (!path || pathLength <= 0) {
      return routePathPoints[activeStop] ?? routePathPoints[0];
    }
    const point = path.getPointAtLength(pathLength * progress);
    return { cx: point.x, cy: point.y };
  }, [activeStop, pathLength, progress]);

  const truckRotation = useMemo(() => {
    const path = pathRef.current;
    if (!path || pathLength <= 0) return -28;
    const start = path.getPointAtLength(Math.max(pathLength * progress - 12, 0));
    const end = path.getPointAtLength(Math.min(pathLength * progress + 12, pathLength));
    return (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;
  }, [pathLength, progress]);

  return (
    <div className="relative h-[260px] w-full overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#eef2ff_0%,#f8fafc_100%)] sm:h-[280px]">
      <svg viewBox="0 0 560 240" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="routeGlowOptimizer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="55%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#BFFF07" />
          </linearGradient>
          <filter id="routeStopGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#BFFF07" floodOpacity="0.55" />
          </filter>
        </defs>

        {[80, 130, 180].map((y) => (
          <line
            key={y}
            x1="20"
            y1={y}
            x2="540"
            y2={y}
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="4 8"
            opacity="0.45"
          />
        ))}

        <path ref={pathRef} d={routePathD} fill="none" stroke="#e2e8f0" strokeWidth="7" strokeLinecap="round" />

        {pathLength > 0 ? (
          <motion.path
            d={routePathD}
            fill="none"
            stroke="url(#routeGlowOptimizer)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray={pathLength}
            animate={{ strokeDashoffset: pathLength * (1 - progress) }}
            transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : null}

        {routePathPoints.map((point, index) => {
          const isActive = index === activeStop;
          const isComplete = index < activeStop;

          return (
            <g key={index}>
              {isActive ? (
                <motion.circle
                  cx={point.cx}
                  cy={point.cy}
                  r={14}
                  fill="none"
                  stroke="#BFFF07"
                  strokeWidth="2"
                  opacity={0.35}
                  animate={{ r: [14, 22, 14], opacity: [0.35, 0.08, 0.35] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : null}
              <motion.circle
                cx={point.cx}
                cy={point.cy}
                animate={{
                  r: isActive ? 10 : isComplete ? 7.5 : 7,
                  fill: isComplete || isActive ? "#0f172a" : "#ffffff",
                }}
                stroke={isActive ? "#BFFF07" : isComplete ? "#64748b" : "#94a3b8"}
                strokeWidth={isActive ? 2.5 : 2}
                filter={isActive ? "url(#routeStopGlow)" : undefined}
                transition={{ duration: 0.45, ease: "easeOut" }}
              />
            </g>
          );
        })}

        <motion.g
          animate={{ x: truckPoint.cx, y: truckPoint.cy, rotate: truckRotation }}
          transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.g
            animate={{ y: [0, -2.5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx={0} cy={1} r={17} fill="#0f172a" opacity={0.14} />
            <circle cx={0} cy={0} r={15} fill="#0f172a" />
            <foreignObject x={-8} y={-8} width={16} height={16}>
              <div className="flex h-4 w-4 items-center justify-center">
                <Truck className="h-3.5 w-3.5 text-[#BFFF07]" strokeWidth={2.25} />
              </div>
            </foreignObject>
          </motion.g>
        </motion.g>
      </svg>

      <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/70 bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700 shadow-sm backdrop-blur-sm">
        Live route preview
      </div>

      <motion.div
        className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-violet-700 shadow-sm"
        key={activeStop}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        Stop {activeStop + 1} of {routePathPoints.length}
      </motion.div>
    </div>
  );
}

function RouteOptimizerDashboard({ activeStop, onSelectStop }: { activeStop: number; onSelectStop: (i: number) => void }) {
  return (
    <div className="relative w-full min-w-0 rounded-[1.6rem] bg-gradient-to-br from-white/40 via-white/22 to-white/10 p-1.5 shadow-[0_28px_70px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.75)] ring-1 ring-white/50 backdrop-blur-2xl sm:rounded-[1.75rem] sm:p-2">
      <div className="relative overflow-hidden rounded-[1.25rem] border border-white/75 bg-white/94 shadow-[0_12px_40px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:rounded-[1.35rem]">
        <div className="flex min-h-[560px] w-full lg:min-h-[620px]">
          <aside className="hidden w-[228px] shrink-0 border-r border-slate-100/90 bg-gradient-to-b from-slate-50/40 to-white p-5 lg:block">
            <div className="mb-8 flex items-center gap-2.5 px-1">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
                <Image src="/logo.png" alt="Alpha Freight" fill sizes="32px" className="object-contain p-1" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Route AI</span>
            </div>
            <div className="space-y-1">
              {sidebarNav.map((item, index) => {
                const Icon = item.icon;
                const isActive = index === 1;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm ${
                      isActive
                        ? "bg-slate-100/95 font-medium text-slate-900 shadow-sm ring-1 ring-slate-200/70"
                        : "font-medium text-slate-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0 flex-1 p-5 sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">Fleet route planner</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl lg:text-[1.65rem]">
                  London → Leeds multi-stop run
                </h3>
              </div>
              <div className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
                Optimized · -44 mi
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Distance", value: "268 mi" },
                { label: "Fuel saved", value: "£27" },
                { label: "ETA accuracy", value: "96%" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 sm:px-5 sm:py-5">
                  <p className="text-[11px] font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 w-full">
              <RouteMapMockup activeStop={activeStop} />
            </div>

            <div className="mt-5 w-full space-y-2">
              {routeStops.map((stop, index) => (
                <button
                  key={stop.code}
                  type="button"
                  onClick={() => onSelectStop(index)}
                  className={`grid w-full grid-cols-[56px_minmax(0,1fr)_72px_88px] items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition sm:grid-cols-[64px_minmax(0,1fr)_80px_96px] sm:px-4 sm:py-3.5 ${
                    index === activeStop ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="font-semibold">{stop.code}</span>
                  <span className="truncate">{stop.city}</span>
                  <span className={index === activeStop ? "text-white/70" : "text-slate-500"}>{stop.time}</span>
                  <span className={`truncate text-right ${index === activeStop ? "text-[#BFFF07]" : "text-violet-600"}`}>
                    {stop.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RouteOptimizerPage() {
  useMarketingSmoothScroll();
  const [activeStop, setActiveStop] = useState(2);
  const [mode, setMode] = useState<"optimized" | "manual">("optimized");

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStop((current) => (current + 1) % routeStops.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".optimizer-reveal", {
        y: 48,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".optimizer-reveal-wrap",
          start: "top 78%",
        },
      });
    });
    return () => ctx.revert();
  }, []);

  const activeMetrics = useMemo(
    () => (mode === "optimized" ? compareRows : compareRows.map((row) => ({ ...row, after: row.before, delta: "—" }))),
    [mode],
  );

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-[#fafafa] pt-28 pb-12 sm:pb-16 lg:pb-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_20%_20%,rgba(109,40,217,0.12),transparent_42%),radial-gradient(circle_at_80%_10%,rgba(191,255,7,0.14),transparent_35%)]" />

          <div className="relative z-10 mx-auto max-w-[920px] px-6 text-center lg:px-10">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600">Fleet intelligence</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
                Route Optimizer
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                AI-driven sequencing for multi-stop UK freight. Cut fuel spend, shrink deadhead miles, and deliver
                precise ETAs — without rebuilding your dispatch workflow.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Book a demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/docs?tab=tracking"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400"
                >
                  View documentation
                </Link>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, delay: 0.12 }}
            className="relative z-10 mx-auto mt-10 w-full max-w-[1240px] px-4 sm:mt-12 sm:px-6 lg:px-10"
          >
            <RouteOptimizerDashboard activeStop={activeStop} onSelectStop={setActiveStop} />
          </motion.div>

          <div className="relative z-10 mx-auto mt-10 grid max-w-[920px] grid-cols-1 gap-4 px-6 sm:grid-cols-3 lg:px-10">
            {outcomes.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold tracking-tight text-slate-900">{item.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-1 text-[11px] text-slate-400">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="optimizer-reveal-wrap border-y border-slate-200/80 bg-white py-20">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="optimizer-reveal mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600">Scoring engine</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">What the optimizer weighs</h2>
              <p className="mt-4 text-slate-600">
                Every route is scored against distance, timing, compliance, and cost — then rebalanced when live conditions shift.
              </p>
            </div>
            <div className="optimizer-reveal mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {optimizerSignals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <div
                    key={signal.title}
                    className="rounded-[1.5rem] border border-slate-200/80 bg-[#fafafa] p-6 transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-[#BFFF07]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-bold text-violet-600">{signal.weight}</span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-slate-900">{signal.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{signal.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600">Before vs after</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">See the savings instantly</h2>
                <p className="mt-4 text-slate-600">
                  Toggle between manual planning and AI optimization to compare distance, fuel, and idle time on the same run.
                </p>
                <div className="mt-6 inline-flex rounded-full border border-slate-200 bg-white p-1">
                  {(["manual", "optimized"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMode(option)}
                      className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${
                        mode === option ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">London → Leeds · 5 stops</h3>
                  <span className="rounded-full bg-[#BFFF07]/30 px-3 py-1 text-xs font-bold text-slate-800">
                    {mode === "optimized" ? "AI plan active" : "Manual plan"}
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    {activeMetrics.map((row) => (
                      <div
                        key={row.label}
                        className="grid grid-cols-[1fr_0.7fr_0.7fr_0.5fr] items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-slate-700">{row.label}</span>
                        <span className="text-slate-400 line-through">{row.before}</span>
                        <span className="font-semibold text-slate-900">{row.after}</span>
                        <span className={`font-bold ${mode === "optimized" ? "text-emerald-600" : "text-slate-400"}`}>
                          {row.delta}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200/80 bg-slate-950 py-20 text-white">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#BFFF07]">How it works</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From stops to smart dispatch</h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {workflow.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <p className="text-sm font-bold text-[#BFFF07]">{step.step}</p>
                  <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/65">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div className="optimizer-reveal rounded-[1.75rem] border border-slate-200/80 bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-violet-600" />
                  <h3 className="text-2xl font-bold tracking-tight">Built for UK freight ops</h3>
                </div>
                <ul className="mt-6 space-y-4 text-[15px] leading-7 text-slate-600">
                  {[
                    "Multi-drop sequencing for pallet, curtain-side, and refrigerated fleets",
                    "Traffic-aware rerouting with driver-friendly turn-by-turn handoff",
                    "Fuel and CO₂ modeling tied to vehicle class and payload",
                    "Works with Alpha loads, carrier dashboards, and partner TMS feeds",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <Target className="mt-1 h-4 w-4 shrink-0 text-violet-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="optimizer-reveal grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Gauge, title: "Fleet efficiency", value: "+17%" },
                  { icon: Timer, title: "Dispatch time", value: "-42%" },
                  { icon: Zap, title: "Reroute speed", value: "< 8 sec" },
                  { icon: MapPin, title: "Live stops", value: "Unlimited" },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.title}
                      className="rounded-[1.5rem] border border-slate-200/80 bg-[#fafafa] p-6 text-center"
                    >
                      <Icon className="mx-auto h-6 w-6 text-slate-700" />
                      <p className="mt-4 text-3xl font-bold tracking-tight">{card.value}</p>
                      <p className="mt-2 text-sm text-slate-500">{card.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <CinematicCTA
          title="Optimize every mile"
          subtitle="Cut fuel, save time, and dispatch with confidence across your fleet."
          buttonText="Talk to sales"
          buttonHref="/contact"
        />
      </main>

      <Footer />
    </div>
  );
}
