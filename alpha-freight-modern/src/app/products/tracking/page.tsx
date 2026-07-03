"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  Globe,
  LayoutDashboard,
  MapPin,
  Navigation,
  Package,
  Radio,
  Share2,
  ShieldCheck,
  Signal,
  Sparkles,
  Thermometer,
  Truck,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";

type TrackingTab = "live" | "shipments" | "alerts" | "history";

const trackingTabs: Record<
  TrackingTab,
  {
    label: string;
    loadId: string;
    lane: string;
    status: string;
    eta: string;
    progress: number;
    speed: string;
    milestones: { time: string; label: string; done: boolean; current?: boolean }[];
    alerts: string[];
  }
> = {
  live: {
    label: "Live map",
    loadId: "AF-2041",
    lane: "London → Manchester",
    status: "In transit",
    eta: "14:22 GMT",
    progress: 68,
    speed: "54 mph",
    milestones: [
      { time: "06:40", label: "Collected — London depot", done: true },
      { time: "08:15", label: "Departed M1 corridor", done: true },
      { time: "11:05", label: "Near Birmingham hub", done: true, current: true },
      { time: "14:22", label: "ETA Manchester delivery", done: false },
    ],
    alerts: ["Geofence OK · on planned corridor", "Reefer temp stable at 4°C"],
  },
  shipments: {
    label: "Shipments",
    loadId: "AF-1988",
    lane: "Birmingham → Leeds",
    status: "Pickup scheduled",
    eta: "16:10 GMT",
    progress: 12,
    speed: "—",
    milestones: [
      { time: "05:30", label: "Load confirmed", done: true },
      { time: "09:00", label: "Carrier assigned", done: true, current: true },
      { time: "12:45", label: "Pickup window opens", done: false },
      { time: "16:10", label: "ETA Leeds", done: false },
    ],
    alerts: ["Driver en route to pickup · 18 min away"],
  },
  alerts: {
    label: "Alerts",
    loadId: "AF-2110",
    lane: "Bristol → Glasgow",
    status: "Exception review",
    eta: "Delayed +42m",
    progress: 54,
    speed: "38 mph",
    milestones: [
      { time: "07:10", label: "Departed Bristol", done: true },
      { time: "10:40", label: "Traffic delay flagged", done: true, current: true },
      { time: "13:20", label: "Revised ETA issued", done: false },
      { time: "18:05", label: "Updated Glasgow ETA", done: false },
    ],
    alerts: ["Delay detected on M5 · customer notified", "Auto-reroute suggestion available"],
  },
  history: {
    label: "History",
    loadId: "AF-1872",
    lane: "Manchester → London",
    status: "Delivered",
    eta: "Completed",
    progress: 100,
    speed: "—",
    milestones: [
      { time: "04:50", label: "Collected Manchester", done: true },
      { time: "08:30", label: "In transit", done: true },
      { time: "11:45", label: "POD uploaded", done: true },
      { time: "11:46", label: "Delivery confirmed", done: true, current: true },
    ],
    alerts: ["Digital POD verified · payment released"],
  },
};

const outcomes = [
  { label: "Location accuracy", value: "<15m", note: "GPS precision" },
  { label: "ETA refresh", value: "Live", note: "traffic-aware updates" },
  { label: "Customer visibility", value: "24/7", note: "branded tracking links" },
];

const features = [
  {
    icon: MapPin,
    title: "Live GPS map",
    desc: "Track vehicles and shipments on an interactive map with lane context and milestone markers.",
  },
  {
    icon: Bell,
    title: "Smart alerts",
    desc: "Geofence breaches, delays, temperature drift, and missing POD events surface instantly.",
  },
  {
    icon: Share2,
    title: "Customer tracking links",
    desc: "Share white-label shipment visibility with shippers and consignees — no login required.",
  },
  {
    icon: Thermometer,
    title: "IoT cargo monitoring",
    desc: "Reefer temperature, door events, and sensor telemetry for sensitive freight.",
  },
  {
    icon: Navigation,
    title: "Traffic-aware ETA",
    desc: "Dynamic arrival predictions that adapt as routes and congestion change.",
  },
  {
    icon: ShieldCheck,
    title: "Audit-ready trail",
    desc: "Timestamped location history tied to POD, assignments, and compliance records.",
  },
];

const sidebarNav = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Live map", icon: MapPin, active: false },
  { label: "Shipments", icon: Package, active: false },
  { label: "Alerts", icon: Bell, active: false },
  { label: "IoT sensors", icon: Radio, active: false },
];

const mapPathD = "M 52 210 C 100 170, 140 155, 180 140 S 280 105, 340 88 S 430 62, 500 48";

function LiveMapPanel({ progress, activeTab }: { progress: number; activeTab: TrackingTab }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    const path = pathRef.current;
    if (path) setPathLength(path.getTotalLength());
  }, []);

  const truckPoint = useMemo(() => {
    const path = pathRef.current;
    if (!path || pathLength <= 0) return { x: 52, y: 210 };
    const point = path.getPointAtLength(pathLength * (progress / 100));
    return { x: point.x, y: point.y };
  }, [pathLength, progress]);

  const statusColor =
    activeTab === "alerts" ? "#f59e0b" : activeTab === "history" ? "#10b981" : "#7c3aed";

  return (
    <div className="relative h-[280px] w-full overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-sky-50 via-white to-violet-50 sm:h-[300px]">
      <svg viewBox="0 0 560 240" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
        {[70, 120, 170].map((y) => (
          <line key={y} x1="20" y1={y} x2="540" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 8" />
        ))}
        <path ref={pathRef} d={mapPathD} fill="none" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
        {pathLength > 0 ? (
          <motion.path
            d={mapPathD}
            fill="none"
            stroke={statusColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={pathLength}
            animate={{ strokeDashoffset: pathLength * (1 - progress / 100) }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : null}
        {[
          { x: 52, y: 210 },
          { x: 180, y: 140 },
          { x: 340, y: 88 },
          { x: 500, y: 48 },
        ].map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={index === 0 || progress >= (index / 3) * 100 ? 7 : 6}
            fill={progress >= (index / 3) * 100 ? statusColor : "#fff"}
            stroke="#94a3b8"
            strokeWidth="2"
          />
        ))}
        <motion.g animate={{ x: truckPoint.x, y: truckPoint.y }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}>
          <circle cx={0} cy={0} r={14} fill="#0f172a" />
          <foreignObject x={-7} y={-7} width={14} height={14}>
            <div className="flex h-3.5 w-3.5 items-center justify-center">
              <Truck className="h-3 w-3 text-[#BFFF07]" strokeWidth={2.5} />
            </div>
          </foreignObject>
        </motion.g>
      </svg>
      <div className="absolute left-3 top-3 rounded-full border border-white/80 bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700 shadow-sm">
        GPS live
      </div>
      <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Signal strong
      </div>
    </div>
  );
}

function TrackingDashboardMock({ activeTab }: { activeTab: TrackingTab }) {
  const data = trackingTabs[activeTab];

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
              <span className="text-sm font-semibold text-slate-800">TrackLive</span>
            </div>
            <div className="space-y-1">
              {sidebarNav.map((item) => {
                const Icon = item.icon;
                const isActive = item.active;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm ${
                      isActive
                        ? "bg-white font-semibold text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/80"
                        : "font-medium text-slate-500"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        isActive ? "bg-sky-100 text-sky-700" : "text-slate-400"
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
                <p className="text-sm font-medium text-slate-500">Real-time tracking</p>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {data.loadId} · {data.lane}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {data.status}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share link
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {[
                { label: "ETA", value: data.eta, icon: Clock },
                { label: "Progress", value: `${data.progress}%`, icon: Signal },
                { label: "Speed", value: data.speed, icon: Navigation },
                { label: "Accuracy", value: "<15m", icon: MapPin },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Icon className="h-3.5 w-3.5" />
                      <p className="text-[11px] font-medium">{stat.label}</p>
                    </div>
                    <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Live map</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">Vehicle position</p>
                  </div>
                  <Globe className="h-5 w-5 text-sky-600" />
                </div>
                <LiveMapPanel progress={data.progress} activeTab={activeTab} />
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${data.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.35rem] border border-slate-200 bg-gradient-to-br from-sky-50/80 to-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Milestones</p>
                  <div className="mt-4 space-y-3">
                    {data.milestones.map((step) => (
                      <div key={step.label} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={`flex h-3 w-3 rounded-full ${
                              step.current
                                ? "bg-violet-500 ring-4 ring-violet-100"
                                : step.done
                                  ? "bg-emerald-500"
                                  : "bg-slate-200"
                            }`}
                          />
                          <span className="mt-1 w-px flex-1 bg-slate-200" />
                        </div>
                        <div className="pb-3">
                          <p className="text-xs font-semibold text-slate-500">{step.time}</p>
                          <p className={`text-sm ${step.current ? "font-bold text-slate-900" : "text-slate-600"}`}>
                            {step.label}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Live alerts</p>
                  <div className="mt-3 space-y-2">
                    {data.alerts.map((alert) => (
                      <div key={alert} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
                        <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" />
                        {alert}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function RealTimeTrackingPage() {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TrackingTab>("live");

  const tabs = useMemo(() => Object.keys(trackingTabs) as TrackingTab[], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((current) => {
        const index = tabs.indexOf(current);
        return tabs[(index + 1) % tabs.length] ?? "live";
      });
    }, 5500);
    return () => clearInterval(interval);
  }, [tabs]);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".track-hero-item", {
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
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(56,189,248,0.14),transparent_70%),radial-gradient(circle_at_80%_20%,rgba(109,40,217,0.10),transparent_40%)]" />

          <div className="relative z-10 mx-auto max-w-[980px] px-6 text-center lg:px-10">
            <p className="track-hero-item text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-600">
              Real-time Tracking
            </p>
            <h1 className="track-hero-item mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.45rem] lg:leading-[1.06]">
              GPS & IoT cargo monitoring
            </h1>
            <p className="track-hero-item mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
              See every shipment move in real time — live maps, milestone alerts, geofencing, and branded customer
              tracking links powered by Alpha Freight.
            </p>
            <div className="track-hero-item mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Request tracking demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs?tab=tracking"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                View tracking docs
              </Link>
            </div>
          </div>

          <div className="track-hero-item relative z-10 mx-auto mt-10 w-full max-w-[1240px] px-4 sm:mt-12 sm:px-6 lg:px-10">
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition ${
                    activeTab === tab
                      ? "border-sky-600 bg-sky-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {trackingTabs[tab].label}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <TrackingDashboardMock activeTab={activeTab} />
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600">Tracking capabilities</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Visibility that moves with the load</h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.55, delay: index * 0.06 }}
                    className="rounded-[1.5rem] border border-slate-200/80 bg-[#fafafa] p-6 transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-bold text-slate-900">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{feature.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200/70 bg-white py-20">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600">How it works</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From assignment to proof of delivery</h2>
                <ul className="mt-8 space-y-5">
                  {[
                    { step: "01", title: "Assign & activate", desc: "Tracking starts when a carrier accepts the load." },
                    { step: "02", title: "Monitor live", desc: "GPS, milestones, and IoT telemetry stream into one map." },
                    { step: "03", title: "Alert & share", desc: "Teams and customers get updates via links and notifications." },
                    { step: "04", title: "Close with POD", desc: "Location history locks to digital proof of delivery." },
                  ].map((item) => (
                    <li key={item.step} className="flex gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-[#BFFF07]">
                        {item.step}
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-900">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-[#fafafa] p-8">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-violet-600" />
                  <h3 className="text-xl font-bold">Built for UK freight operations</h3>
                </div>
                <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
                  {[
                    "Supplier and carrier dashboards with the same live shipment view",
                    "Geofenced pickup and delivery zones with automatic status updates",
                    "Reefer and sensitive cargo monitoring through IoT integrations",
                    "White-label tracking pages for end customers and consignees",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-20 text-white">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Zap, label: "Update frequency", value: "Every 30s" },
                { icon: Globe, label: "Tracking links", value: "Branded" },
                { icon: ShieldCheck, label: "Audit trail", value: "Immutable" },
                { icon: Radio, label: "IoT ready", value: "API + webhooks" },
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
          title="Give every shipment a live pulse"
          subtitle="See Alpha real-time tracking in action."
          buttonText="Book a demo"
          buttonHref="/contact"
        />
      </main>

      <Footer />
    </div>
  );
}
