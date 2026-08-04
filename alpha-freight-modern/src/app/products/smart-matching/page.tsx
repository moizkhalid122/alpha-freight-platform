"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Code2,
  FileText,
  Gauge,
  HandCoins,
  LayoutDashboard,
  Loader2,
  Package,
  Rocket,
  Route,
  Sparkles,
  Target,
  Truck,
  Workflow,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";

gsap.registerPlugin(ScrollTrigger);

type PublicLoad = {
  id: string;
  code: string;
  origin: string;
  destination: string;
  price: number;
  equipment: string;
};

const matchSignals = [
  {
    title: "Lane fit",
    desc: "Matches loads to carriers already running similar origin–destination patterns.",
    icon: Route,
    weight: "32%",
  },
  {
    title: "Equipment match",
    desc: "Refrigerated, flatbed, curtain-side, and payload rules are scored before surfacing a load.",
    icon: Truck,
    weight: "24%",
  },
  {
    title: "Capacity & timing",
    desc: "Pickup windows, fleet availability, and deadhead reduction influence ranking.",
    icon: Gauge,
    weight: "21%",
  },
  {
    title: "Carrier reliability",
    desc: "Completion rate, POD quality, bid acceptance, and verification status improve trust.",
    icon: CheckCircle2,
    weight: "15%",
  },
  {
    title: "Rate intelligence",
    desc: "Market pricing signals help carriers focus on profitable lanes, not noise.",
    icon: Sparkles,
    weight: "8%",
  },
];

const workflow = [
  {
    step: "01",
    title: "Load posted",
    desc: "Suppliers publish lane, equipment, commodity, and timing into the Alpha marketplace.",
  },
  {
    step: "02",
    title: "AI scores carriers",
    desc: "Our engine ranks verified carriers by fit, capacity, reliability, and route efficiency.",
  },
  {
    step: "03",
    title: "Best match surfaced",
    desc: "Carriers see the highest-value opportunities first — then bid or accept in seconds.",
  },
];

const outcomes = [
  { label: "Faster assignment", value: "3.2x", note: "vs manual load boards" },
  { label: "Less deadhead", value: "18%", note: "average reduction" },
  { label: "Match confidence", value: "94%", note: "top-ranked lane fit" },
];

const matchingUseCases = [
  {
    title: "Carrier fleets",
    desc: "Rank available loads by equipment fit, lane familiarity, and pickup timing so drivers spend less time on boards and more time moving freight.",
    image: "/back 1.avif",
    variant: "stacked" as const,
    stackedSteps: ["Load ranking", "Smart bidding", "Fleet fit"],
  },
  {
    title: "Supplier logistics",
    desc: "Post once and let Alpha route each load to verified carriers with the strongest operational fit — not just whoever clicks first.",
    image: "/back 2.avif",
    variant: "workflow" as const,
    workflowItems: [
      { icon: FileText, title: "Load brief", subtitle: "Lane requirements received" },
      { icon: Code2, title: "Carrier matching", subtitle: "AI scoring in progress" },
      { icon: Rocket, title: "Assignment", subtitle: "Ready for carrier handoff" },
      { icon: CheckCircle2, title: "Load booked", subtitle: "Carrier confirmed pickup", faded: true },
    ],
  },
  {
    title: "Broker operations",
    desc: "Match live capacity to open freight faster with transparent lane scoring, fewer manual calls, and confidence on every handoff.",
    image: "/back 3.avif",
    variant: "activity" as const,
    activityItems: [
      { initials: "JB", action: "James matched London → Manchester lane" },
      { initials: "NZ", action: "Nadia confirmed refrigerated load bid" },
      { initials: "AL", action: "Alex ranked 12 carriers for AF-2041" },
      { initials: "LR", action: "Laura closed Birmingham → Leeds deal" },
      { initials: "EP", action: "Ethan updated lane scoring rules" },
      { initials: "MC", action: "Maya assigned curtain-side carrier", faded: true },
    ],
  },
];

function UseCaseVisualPanel({ useCase }: { useCase: (typeof matchingUseCases)[number] }) {
  if (useCase.variant === "stacked") {
    return (
      <div className="w-full max-w-[310px] rounded-[1.75rem] border border-white/40 bg-white/10 p-2.5 shadow-[0_20px_60px_rgba(15,23,42,0.22)] backdrop-blur-2xl sm:max-w-[348px] sm:p-3">
        {useCase.stackedSteps?.map((step, index) => {
          const isLast = index === (useCase.stackedSteps?.length ?? 0) - 1;

          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: isLast ? 0.72 : 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 + index * 0.1, ease: "easeOut" }}
              className={`rounded-[1.15rem] bg-white px-5 py-8 text-center text-sm font-semibold text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:py-9 sm:text-base ${
                index > 0 ? "mt-4" : ""
              } ${isLast ? "blur-[0.35px]" : ""}`}
            >
              {step}
            </motion.div>
          );
        })}
      </div>
    );
  }

  if (useCase.variant === "workflow") {
    return (
      <div className="w-full max-w-[310px] rounded-[1.75rem] border border-white/40 bg-white/10 p-2.5 shadow-[0_20px_60px_rgba(15,23,42,0.22)] backdrop-blur-2xl sm:max-w-[348px] sm:p-3">
        <div className="relative overflow-hidden rounded-[1.35rem] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="space-y-4 sm:space-y-5">
            {useCase.workflowItems?.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: item.faded ? 0.45 : 1, x: 0 }}
                  transition={{ duration: 0.38, delay: 0.06 + index * 0.09, ease: "easeOut" }}
                  className={`flex items-start gap-4 ${item.faded ? "blur-[0.4px]" : ""}`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white shadow-sm">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[15px] font-semibold text-slate-900 sm:text-base">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">{item.subtitle}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/90 to-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[310px] rounded-[1.75rem] border border-white/40 bg-white/10 p-2.5 shadow-[0_20px_60px_rgba(15,23,42,0.22)] backdrop-blur-2xl sm:max-w-[348px] sm:p-3">
      <div className="relative overflow-hidden rounded-[1.35rem] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="divide-y divide-slate-100">
          {useCase.activityItems?.map((item, index) => (
            <motion.div
              key={`${item.initials}-${index}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: item.faded ? 0.45 : 1, x: 0 }}
              transition={{ duration: 0.36, delay: 0.05 + index * 0.07, ease: "easeOut" }}
              className={`flex items-center gap-3.5 py-4 first:pt-0 last:pb-0 sm:py-4.5 ${item.faded ? "blur-[0.4px]" : ""}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
                {item.initials}
              </span>
              <p className="text-sm leading-snug text-slate-700 sm:text-[15px]">{item.action}</p>
            </motion.div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent" />
      </div>
    </div>
  );
}

function getCity(value: string) {
  return value.split(",")[0]?.trim() || value;
}

function buildDemoScore(load: PublicLoad, index: number) {
  const base = 78 + ((load.id.charCodeAt(0) + index * 11) % 18);
  return Math.min(base, 97);
}

const sidebarNav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Matching", icon: Sparkles },
  { label: "Loads", icon: Package },
  { label: "Carriers", icon: Truck },
  { label: "Bids", icon: HandCoins },
  { label: "Automations", icon: Workflow },
];

function SmartMatchingHeroDashboard({
  loads,
  activeIndex,
  onSelect,
}: {
  loads: PublicLoad[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const activeLoad = loads[activeIndex] ?? loads[0];
  const activeScore = activeLoad ? buildDemoScore(activeLoad, activeIndex) : 92;

  const tableRows = loads.map((load, index) => ({
    lane: `${getCity(load.origin)} → ${getCity(load.destination)}`,
    status: index === activeIndex ? "Top match" : index === 0 ? "Matched" : "Review",
    priority: `${buildDemoScore(load, index)}%`,
    equipment: load.equipment,
  }));

  return (
    <div className="relative w-full rounded-[1.6rem] bg-gradient-to-br from-white/40 via-white/22 to-white/10 p-1.5 shadow-[0_28px_70px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.75)] ring-1 ring-white/50 backdrop-blur-2xl sm:rounded-[1.75rem] sm:p-2">
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/30 via-transparent to-white/5" />
      <div className="relative overflow-hidden rounded-[1.25rem] border border-white/75 bg-white/94 shadow-[0_12px_40px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:rounded-[1.35rem]">
      <div className="flex min-h-[520px]">
        <aside className="hidden w-[220px] shrink-0 border-r border-slate-100/90 bg-gradient-to-b from-slate-50/40 to-white p-5 md:block">
          <div className="mb-8 flex items-center gap-2.5 px-1">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
              <Image
                src="/logo.png"
                alt="Alpha Freight"
                fill
                sizes="32px"
                className="object-contain p-1"
              />
            </div>
            <span className="text-sm font-semibold text-slate-800">Alpha Match</span>
          </div>
          <div className="space-y-1">
            {sidebarNav.map((item, index) => {
              const Icon = item.icon;
              const isActive = index === 1;

              return (
                <div
                  key={item.label}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-slate-100/95 font-medium text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70"
                      : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? "bg-white text-slate-700 shadow-sm ring-1 ring-slate-100"
                        : "text-slate-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={isActive ? 2.25 : 2} />
                  </span>
                  {item.label}
                </div>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0 flex-1 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Good morning, Alex</p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                Here&apos;s today&apos;s freight matching overview
              </h3>
            </div>
            <div className="rounded-full bg-[#BFFF07]/25 px-3 py-1 text-xs font-semibold text-slate-800">
              AI ranking live
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Active matches", value: String(loads.length || 24) },
              { label: "Loads ranked", value: "128" },
              { label: "Match efficiency", value: `${activeScore}%` },
              { label: "Fleet utilization", value: "+17%" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]"
              >
                <p className="text-[11px] font-medium text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[1.25rem] border border-slate-200/80 bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">Matching activity</h4>
                <span className="text-xs text-slate-400">Live lane scoring</span>
              </div>
              <div className="space-y-2">
                {tableRows.map((row, index) => (
                  <button
                    key={`${row.lane}-${index}`}
                    type="button"
                    onClick={() => onSelect(index)}
                    className={`grid w-full grid-cols-[1.4fr_0.7fr_0.5fr] items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      index === activeIndex ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{row.lane}</p>
                      <p className={`mt-0.5 text-xs ${index === activeIndex ? "text-white/60" : "text-slate-400"}`}>
                        {row.equipment}
                      </p>
                    </div>
                    <span className="text-xs font-medium">{row.status}</span>
                    <span className="text-xs font-semibold">{row.priority}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-slate-200/80 bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <Bot className="h-4 w-4 text-violet-600" />
                <h4 className="text-sm font-semibold text-slate-900">AI Matching Assistant</h4>
              </div>
              <div className="space-y-3">
                {[
                  "Suggested carrier for London → Manchester lane",
                  "Recommended bid range based on market rate",
                  "Next best load for your refrigerated fleet",
                ].map((item) => (
                  <div key={item} className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
              {activeLoad ? (
                <div className="mt-4 rounded-xl border border-[#BFFF07]/30 bg-[#BFFF07]/10 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Top match
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {getCity(activeLoad.origin)} → {getCity(activeLoad.destination)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {activeScore}% fit · £{Math.round(activeLoad.price).toLocaleString("en-GB")}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function SmartMatchingPage() {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const [loads, setLoads] = useState<PublicLoad[]>([]);
  const [loadsLoading, setLoadsLoading] = useState(true);
  const [activeDemo, setActiveDemo] = useState(0);
  const [activeUseCase, setActiveUseCase] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/public/loads");
        const payload = await response.json();
        setLoads((payload.loads ?? []).slice(0, 4));
      } catch {
        setLoads([]);
      } finally {
        setLoadsLoading(false);
      }
    })();
  }, []);

  const demoLoads = useMemo(() => {
    if (loads.length) return loads;
    return [
      {
        id: "demo-1",
        code: "AF-DEMO01",
        origin: "London, UK",
        destination: "Manchester, UK",
        price: 1250,
        equipment: "Curtain-side",
      },
      {
        id: "demo-2",
        code: "AF-DEMO02",
        origin: "Birmingham, UK",
        destination: "Leeds, UK",
        price: 980,
        equipment: "Refrigerated",
      },
      {
        id: "demo-3",
        code: "AF-DEMO03",
        origin: "Bristol, UK",
        destination: "Glasgow, UK",
        price: 1840,
        equipment: "Flatbed",
      },
    ];
  }, [loads]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveDemo((current) => (current + 1) % demoLoads.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [demoLoads.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveUseCase((current) => (current + 1) % matchingUseCases.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".match-hero-item", {
        y: 40,
        opacity: 0,
        duration: 0.95,
        stagger: 0.1,
        ease: "power4.out",
      });

      gsap.from(".match-reveal", {
        scrollTrigger: { trigger: ".match-reveal-grid", start: "top 80%" },
        y: 50,
        opacity: 0,
        duration: 0.85,
        stagger: 0.08,
        ease: "power3.out",
      });

      gsap.from(".use-case-reveal", {
        scrollTrigger: { trigger: ".use-cases-section", start: "top 78%" },
        y: 44,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);


  const currentUseCase = matchingUseCases[activeUseCase];

  return (
    <div
      ref={pageRef}
      className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black"
    >
      <Navbar variant="dark" />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-[#fafafa] pt-28 pb-8 sm:pb-12 lg:pb-16">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(191,255,7,0.14),transparent_70%)]" />

          <div className="relative z-10 mx-auto max-w-[920px] px-6 text-center lg:px-10">
            <p className="match-hero-item text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-600">
              Smart AI Matching
            </p>

            <h1 className="match-hero-item mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
              AI-powered workspace for freight matching
            </h1>

            <p className="match-hero-item mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
              Rank loads by lane fit, equipment, timing, and carrier reliability — so the right
              freight surfaces first for every fleet.
            </p>

            <div className="match-hero-item mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth/signup?role=carrier"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Automate your matching
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Contact us
              </Link>
            </div>
          </div>

          <div className="match-hero-item relative z-10 mx-auto mt-12 max-w-[1180px] px-4 sm:px-6 lg:mt-14 lg:px-10">
            <div className="relative min-h-[620px] overflow-hidden rounded-[2.25rem] sm:min-h-[700px]">
              <div className="pointer-events-none absolute inset-0">
                <Image
                  src="/back.avif"
                  alt=""
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 1180px) 100vw, 1180px"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(circle_at_80%_40%,rgba(168,85,247,0.10),transparent_50%),radial-gradient(circle_at_50%_100%,rgba(251,146,60,0.10),transparent_55%)]" />
              </div>
              <div className="relative flex min-h-[620px] items-center justify-center px-4 py-16 sm:min-h-[700px] sm:px-8 sm:py-20">
                {loadsLoading ? (
                  <div className="w-full rounded-[1.6rem] bg-gradient-to-br from-white/40 via-white/22 to-white/10 p-1.5 shadow-[0_28px_70px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.75)] ring-1 ring-white/50 backdrop-blur-2xl sm:rounded-[1.75rem] sm:p-2">
                    <div className="flex min-h-[520px] w-full items-center justify-center rounded-[1.25rem] border border-white/75 bg-white/94 sm:rounded-[1.35rem]">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                  </div>
                ) : (
                  <SmartMatchingHeroDashboard
                    loads={demoLoads}
                    activeIndex={activeDemo}
                    onSelect={setActiveDemo}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="use-cases-section border-b border-slate-200/70 bg-white py-24 sm:py-28">
          <div className="mx-auto grid max-w-[1400px] gap-12 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16 lg:px-10">
            <div>
              <p className="use-case-reveal text-[11px] font-semibold uppercase tracking-[0.24em] text-fuchsia-600">
                Use Cases
              </p>
              <h2 className="use-case-reveal mt-4 max-w-lg text-4xl font-bold tracking-tight text-slate-900 sm:text-[2.65rem] sm:leading-[1.08]">
                Built for teams managing freight operations
              </h2>
              <p className="use-case-reveal mt-5 max-w-lg text-base leading-relaxed text-slate-500">
                From carrier fleets to supplier desks and broker teams, Alpha matching keeps every
                workflow aligned around the loads that fit best.
              </p>

              <div className="use-case-reveal mt-10 space-y-3">
                {matchingUseCases.map((item, index) => {
                  const isActive = index === activeUseCase;

                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setActiveUseCase(index)}
                      className={`w-full rounded-[1.25rem] border px-5 py-4 text-left transition-all duration-300 ${
                        isActive
                          ? "border-slate-200 bg-slate-50/90 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                          : "border-transparent bg-transparent hover:border-slate-100 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span
                          className={`text-base font-semibold transition-colors ${
                            isActive ? "text-slate-900" : "text-slate-800"
                          }`}
                        >
                          {item.title}
                        </span>
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full transition-colors duration-300 ${
                            isActive ? "bg-fuchsia-500" : "bg-slate-200"
                          }`}
                        />
                      </div>
                      <div
                        className={`grid transition-all duration-300 ${
                          isActive ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <p className="overflow-hidden text-sm leading-relaxed text-slate-500">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="use-case-reveal flex justify-center lg:justify-end">
              <div className="relative min-h-[460px] w-full max-w-[500px] overflow-hidden rounded-[2rem] bg-slate-800 shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:min-h-[520px] sm:max-w-[540px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentUseCase.image}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={currentUseCase.image}
                    alt=""
                    fill
                    className="object-cover opacity-70"
                    sizes="(max-width: 1024px) 100vw, 540px"
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-slate-900/35" />

              <div className="absolute inset-0 flex items-center justify-center p-3.5 sm:p-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeUseCase}
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.98 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="flex w-full justify-center"
                  >
                    <UseCaseVisualPanel useCase={currentUseCase} />
                  </motion.div>
                </AnimatePresence>
              </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200/70 bg-white py-20">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-6 sm:grid-cols-3 lg:px-10">
            {outcomes.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50 px-6 py-8"
              >
                <p className="text-4xl font-bold tracking-tight text-slate-900">{item.value}</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 text-sm text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="match-reveal-grid bg-white py-24 text-slate-900">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                Matching engine
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                How Alpha pairs loads with carriers
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Every load is scored against operational fit — not just the closest postcode. That
                means fewer empty miles, faster bookings, and better margins.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {workflow.map((step) => (
                <article
                  key={step.step}
                  className="match-reveal rounded-[1.75rem] border border-slate-200 bg-slate-50 p-7"
                >
                  <p className="text-sm font-bold text-[#7da600]">{step.step}</p>
                  <h3 className="mt-3 text-2xl font-bold tracking-tight">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F8FAFC] py-24">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                  Scoring model
                </p>
                <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                  What the AI evaluates
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-slate-600">
                Weightings adapt by lane, equipment, and marketplace conditions — but transparency
                stays built in.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {matchSignals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <article
                    key={signal.title}
                    className="match-reveal rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#BFFF07]/20 text-slate-900">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                        {signal.weight}
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-slate-900">{signal.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{signal.desc}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-black py-24">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#BFFF07]">
                  For carriers
                </p>
                <h2 className="mt-3 text-4xl font-bold tracking-tight">
                  Loads that actually fit your fleet
                </h2>
                <ul className="mt-6 space-y-4 text-sm text-white/65">
                  {[
                    "See ranked opportunities instead of scrolling endless boards",
                    "Match by equipment, lane familiarity, and pickup timing",
                    "Bid faster with confidence on rate and route quality",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Target className="mt-0.5 h-4 w-4 shrink-0 text-[#BFFF07]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Sample ranked loads</h3>
                  {loadsLoading ? <Loader2 className="h-4 w-4 animate-spin text-[#BFFF07]" /> : null}
                </div>
                <div className="space-y-3">
                  {demoLoads.map((load, index) => (
                    <div
                      key={load.id}
                      className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/30 px-4 py-4"
                    >
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                          #{index + 1} match
                        </p>
                        <p className="mt-1 font-semibold">
                          {getCity(load.origin)} → {getCity(load.destination)}
                        </p>
                        <p className="mt-1 text-xs text-white/45">{load.equipment}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#BFFF07]">{buildDemoScore(load, index)}%</p>
                        <p className="text-xs text-white/45">£{Math.round(load.price).toLocaleString("en-GB")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-24 text-slate-900">
          <div className="mx-auto grid max-w-[1400px] gap-10 px-6 lg:grid-cols-2 lg:px-10">
            <article className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8">
              <Brain className="h-8 w-8 text-[#7da600]" />
              <h3 className="mt-5 text-2xl font-bold">For suppliers</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Post once and let Alpha route your load to carriers with the best operational fit,
                not just the fastest click.
              </p>
              <Link
                href="/auth/signup?role=supplier"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900"
              >
                Post loads with smart matching
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8">
              <Zap className="h-8 w-8 text-[#7da600]" />
              <h3 className="mt-5 text-2xl font-bold">Inside the platform</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Carriers see smart-ranked loads in Available Loads, Smart Loads, and the AI
                assistant workflow — one matching layer across the marketplace.
              </p>
              <Link
                href="/carrier/smart-loads"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900"
              >
                Open carrier smart loads
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </section>

        <CinematicCTA
          title="Put AI matching to work"
          subtitle="Join Alpha Freight and let the platform surface the loads and carriers that fit best."
          buttonText="Create free account"
          buttonHref="/auth/signup"
        />
      </main>

      <Footer />
    </div>
  );
}
