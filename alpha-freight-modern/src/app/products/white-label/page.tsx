"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  Layers,
  LayoutDashboard,
  Mail,
  Package,
  Palette,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";

gsap.registerPlugin(ScrollTrigger);

type BrandPreset = {
  id: string;
  name: string;
  primary: string;
  accent: string;
  soft: string;
  domain: string;
  tagline: string;
};

const brandPresets: BrandPreset[] = [
  {
    id: "atlas",
    name: "Atlas Logistics",
    primary: "#0f172a",
    accent: "#BFFF07",
    soft: "#f8fafc",
    domain: "portal.atlaslogistics.co.uk",
    tagline: "Your freight network. Your brand.",
  },
  {
    id: "ocean",
    name: "Ocean Haul Group",
    primary: "#0c4a6e",
    accent: "#38bdf8",
    soft: "#f0f9ff",
    domain: "freight.oceanhaul.com",
    tagline: "Coastal capacity. Enterprise control.",
  },
  {
    id: "crimson",
    name: "Crimson Freight",
    primary: "#7f1d1d",
    accent: "#fb7185",
    soft: "#fff1f2",
    domain: "hub.crimsonfreight.io",
    tagline: "Premium lanes. Branded experience.",
  },
  {
    id: "forest",
    name: "ForestLine Transport",
    primary: "#14532d",
    accent: "#4ade80",
    soft: "#f0fdf4",
    domain: "connect.forestline.uk",
    tagline: "Sustainable logistics platform.",
  },
];

const outcomes = [
  { label: "Time to launch", value: "6–8 wks", note: "vs 12+ months in-house" },
  { label: "Brand control", value: "100%", note: "logo, colors, domain" },
  { label: "Platform uptime", value: "99.9%", note: "managed infrastructure" },
];

const modules = [
  {
    icon: LayoutDashboard,
    title: "Branded dashboards",
    desc: "Supplier, carrier, and admin portals styled to your identity with role-based access.",
  },
  {
    icon: Package,
    title: "Load marketplace",
    desc: "Post, bid, assign, and track freight under your own marketplace experience.",
  },
  {
    icon: Truck,
    title: "Fleet & driver tools",
    desc: "Vehicle records, driver panels, POD uploads, and wallet flows in your environment.",
  },
  {
    icon: Palette,
    title: "Theme studio",
    desc: "Configure primary palette, accent, typography, and email templates from one panel.",
  },
  {
    icon: Globe,
    title: "Custom domain",
    desc: "Launch on your URL with SSL, branded login screens, and customer-facing tracking links.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance layer",
    desc: "Verification, insurance checks, audit trails, and GDPR-ready data handling built in.",
  },
];

const audiences = [
  {
    icon: Building2,
    title: "Freight brokers",
    desc: "Launch a digital brokerage under your brand without rebuilding marketplace infrastructure.",
  },
  {
    icon: Layers,
    title: "3PL operators",
    desc: "Give shippers and carriers a unified portal while Alpha runs the platform backbone.",
  },
  {
    icon: Users,
    title: "Enterprise shippers",
    desc: "Offer private capacity networks to preferred carriers with full white-label visibility.",
  },
];

const compareRows = [
  { label: "Engineering team required", build: "8–15 engineers", whiteLabel: "None — managed" },
  { label: "Initial launch timeline", build: "12–18 months", whiteLabel: "6–8 weeks" },
  { label: "Compliance & payments", build: "Build + maintain", whiteLabel: "Included" },
  { label: "Ongoing platform updates", build: "Your roadmap", whiteLabel: "Alpha releases" },
];

const launchSteps = [
  {
    step: "01",
    title: "Brand configuration",
    desc: "Upload logo, set colors, configure domain, and define portal roles for your operation.",
    icon: Palette,
  },
  {
    step: "02",
    title: "Workflow mapping",
    desc: "Align load posting, bidding, POD, and payout flows to your commercial model.",
    icon: Settings,
  },
  {
    step: "03",
    title: "Go live",
    desc: "Invite carriers and suppliers into your branded environment with full Alpha infrastructure.",
    icon: Rocket,
  },
];

function WhiteLabelDashboardMock({ brand }: { brand: BrandPreset }) {
  const sidebarItems = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Loads", icon: Package },
    { label: "Carriers", icon: Truck },
    { label: "Users", icon: Users },
    { label: "Branding", icon: Palette, active: true },
    { label: "Settings", icon: Settings },
  ];

  return (
    <motion.div
      key={brand.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full min-w-0 rounded-[1.6rem] bg-gradient-to-br from-white/40 via-white/22 to-white/10 p-1.5 shadow-[0_28px_70px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.75)] ring-1 ring-white/50 backdrop-blur-2xl sm:rounded-[1.75rem] sm:p-2"
    >
      <div className="overflow-hidden rounded-[1.25rem] border border-white/75 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:rounded-[1.35rem]">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <p className="truncate text-xs font-medium text-slate-500">{brand.domain}</p>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-900"
            style={{ backgroundColor: `${brand.accent}33` }}
          >
            Live preview
          </span>
        </div>

        <div className="flex min-h-[580px] w-full lg:min-h-[640px]">
          <aside
            className="hidden w-[228px] shrink-0 border-r border-slate-100 p-5 lg:block"
            style={{ background: `linear-gradient(180deg, ${brand.soft} 0%, #ffffff 100%)` }}
          >
            <div className="mb-8 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black text-white shadow-sm"
                style={{ backgroundColor: brand.primary }}
              >
                {brand.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{brand.name}</p>
                <p className="truncate text-[11px] text-slate-500">White label portal</p>
              </div>
            </div>
            <div className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.active;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm ${
                      isActive ? "font-semibold text-slate-900 shadow-sm" : "font-medium text-slate-500"
                    }`}
                    style={isActive ? { backgroundColor: `${brand.accent}22`, boxShadow: `inset 0 0 0 1px ${brand.accent}44` } : undefined}
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
              <div>
                <p className="text-sm font-medium text-slate-500">Brand studio</p>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Configure your marketplace identity
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{brand.tagline}</p>
              </div>
              <button
                type="button"
                className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-900"
                style={{ backgroundColor: brand.accent }}
              >
                Publish theme
              </button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Theme tokens</p>
                <div className="mt-4 space-y-4">
                  {[
                    { label: "Primary brand", value: brand.primary },
                    { label: "Accent highlight", value: brand.accent },
                    { label: "Surface background", value: brand.soft },
                  ].map((token) => (
                    <div key={token.label} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{token.label}</p>
                        <p className="text-xs text-slate-500">{token.value}</p>
                      </div>
                      <span
                        className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 shadow-inner"
                        style={{ backgroundColor: token.value }}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">Logo & favicon</p>
                  <p className="mt-1 text-xs text-slate-500">SVG or PNG · auto-scaled across portals</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black text-white"
                      style={{ backgroundColor: brand.primary }}
                    >
                      {brand.name.slice(0, 1)}
                    </div>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                    >
                      Upload assets
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 p-5" style={{ backgroundColor: brand.soft }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Login screen</p>
                  <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg text-sm font-black text-white" style={{ backgroundColor: brand.primary }}>
                      {brand.name.slice(0, 1)}
                    </div>
                    <p className="mt-3 text-center text-sm font-bold text-slate-900">Sign in to {brand.name}</p>
                    <div className="mt-4 space-y-2">
                      <div className="h-9 rounded-lg bg-slate-100" />
                      <div className="h-9 rounded-lg bg-slate-100" />
                      <div className="h-9 rounded-lg text-center text-xs font-bold leading-9 text-slate-900" style={{ backgroundColor: brand.accent }}>
                        Continue
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Customer email</p>
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <p className="text-sm font-semibold text-slate-800">Load confirmed — {brand.name}</p>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Your shipment is now live on the {brand.name} marketplace with branded tracking updates.
                    </p>
                    <span
                      className="mt-3 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-900"
                      style={{ backgroundColor: brand.accent }}
                    >
                      Track shipment
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Active users", value: "1,284" },
                { label: "Branded portals", value: "3" },
                { label: "Custom domain", value: "Enabled" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-[11px] font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function WhiteLabelPage() {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const [activeBrand, setActiveBrand] = useState(0);

  const brand = brandPresets[activeBrand] ?? brandPresets[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBrand((current) => (current + 1) % brandPresets.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".wl-hero-item", {
        y: 42,
        opacity: 0,
        duration: 0.95,
        stagger: 0.1,
        ease: "power4.out",
      });

      gsap.from(".wl-reveal", {
        scrollTrigger: { trigger: ".wl-reveal-grid", start: "top 80%" },
        y: 44,
        opacity: 0,
        duration: 0.85,
        stagger: 0.08,
        ease: "power3.out",
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pageRef}
      className="min-h-screen overflow-x-hidden bg-[#050505] font-sans text-white selection:bg-[#BFFF07] selection:text-black"
    >
      <Navbar variant="light" />

      <main>
        <section className="relative overflow-hidden border-b border-white/10 pt-28 pb-12 sm:pb-16 lg:pb-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(109,40,217,0.22),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(191,255,7,0.12),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(56,189,248,0.10),transparent_40%)]" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.18]" />
          </div>

          <div className="relative z-10 mx-auto max-w-[980px] px-6 text-center lg:px-10">
            <p className="wl-hero-item text-[11px] font-semibold uppercase tracking-[0.28em] text-[#BFFF07]">
              White Label Platform
            </p>
            <h1 className="wl-hero-item mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.6rem] lg:leading-[1.06]">
              Your brand.
              <span className="block bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                Our freight infrastructure.
              </span>
            </h1>
            <p className="wl-hero-item mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
              Launch a fully branded marketplace — custom domain, dashboards, emails, and mobile-ready
              experiences — powered by Alpha Freight&apos;s proven logistics engine.
            </p>
            <div className="wl-hero-item mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-[#BFFF07]"
              >
                Request white label demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs?tab=api-auth"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View integration docs
              </Link>
            </div>
          </div>

          <div className="wl-hero-item relative z-10 mx-auto mt-10 w-full max-w-[1240px] px-4 sm:mt-12 sm:px-6 lg:px-10">
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
              {brandPresets.map((preset, index) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setActiveBrand(index)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    index === activeBrand
                      ? "border-white/30 bg-white text-slate-900"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.accent }} />
                  {preset.name}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <WhiteLabelDashboardMock brand={brand} />
            </AnimatePresence>
          </div>

          <div className="relative z-10 mx-auto mt-10 grid max-w-[920px] grid-cols-1 gap-4 px-6 sm:grid-cols-3 lg:px-10">
            {outcomes.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur-sm"
              >
                <p className="text-2xl font-bold tracking-tight text-white">{item.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/50">{item.label}</p>
                <p className="mt-1 text-[11px] text-white/35">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#0a0a0a] py-20">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#BFFF07]">Platform modules</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Everything under your brand</h2>
              <p className="mt-4 text-white/55">
                Not just a skin — a complete freight operating system configured for your commercial model.
              </p>
            </div>
            <div className="wl-reveal-grid mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <div
                    key={module.title}
                    className="wl-reveal rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-bold">{module.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/55">{module.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200/70 bg-[#fafafa] py-20 text-slate-900">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600">Build vs buy</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Why white label wins</h2>
                <p className="mt-4 text-slate-600">
                  Skip multi-year platform builds. Launch faster with Alpha infrastructure, then scale your brand
                  without carrying the entire engineering burden.
                </p>
                <div className="mt-8 space-y-3">
                  {audiences.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-[#BFFF07]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-900">{item.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
                <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] gap-3 border-b border-slate-100 pb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <span>Capability</span>
                  <span>Build in-house</span>
                  <span className="text-violet-600">White label</span>
                </div>
                <div className="mt-2 space-y-2">
                  {compareRows.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[1.2fr_0.9fr_0.9fr] gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-slate-700">{row.label}</span>
                      <span className="text-slate-400">{row.build}</span>
                      <span className="font-semibold text-slate-900">{row.whiteLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-black py-20">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#BFFF07]">Launch path</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Live in weeks, not years</h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {launchSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[#BFFF07]">{step.step}</p>
                      <Icon className="h-5 w-5 text-white/50" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/60">{step.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 text-slate-900">
          <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
            <div className="rounded-[2rem] border border-slate-200 bg-[#fafafa] p-8 sm:p-10 lg:p-12">
              <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-violet-600" />
                    <h2 className="text-3xl font-bold tracking-tight">Enterprise-ready from day one</h2>
                  </div>
                  <ul className="mt-6 space-y-4 text-[15px] leading-7 text-slate-600">
                    {[
                      "Dedicated onboarding manager and solution architect",
                      "SSO, role permissions, and audit logging",
                      "Branded supplier, carrier, and admin environments",
                      "API access for TMS/ERP integration",
                      "SLA-backed uptime with UK/EU data residency options",
                    ].map((item) => (
                      <li key={item} className="flex gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { icon: Zap, title: "Go-live speed", value: "6–8 weeks" },
                    { icon: Globe, title: "Custom domains", value: "Unlimited" },
                    { icon: ShieldCheck, title: "Compliance", value: "GDPR ready" },
                    { icon: Rocket, title: "Release cycle", value: "Continuous" },
                  ].map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-center">
                        <Icon className="mx-auto h-6 w-6 text-slate-700" />
                        <p className="mt-4 text-2xl font-bold tracking-tight">{card.value}</p>
                        <p className="mt-2 text-sm text-slate-500">{card.title}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <CinematicCTA
          title="Launch your branded freight platform"
          subtitle="Book a strategy session with our white label team."
          buttonText="Talk to sales"
          buttonHref="/contact"
        />
      </main>

      <Footer />
    </div>
  );
}
