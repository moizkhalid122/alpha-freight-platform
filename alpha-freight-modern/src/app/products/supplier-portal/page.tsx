"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Loader2,
  Package,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";

gsap.registerPlugin(ScrollTrigger);

const outcomes = [
  { label: "Faster carrier assignment", value: "3.1x", note: "vs manual broker calls" },
  { label: "Bid response time", value: "<2h", note: "average on active lanes" },
  { label: "Shipment visibility", value: "100%", note: "live status + POD trail" },
];

const features = [
  {
    icon: Package,
    title: "Post loads in minutes",
    desc: "Publish lane, equipment, commodity, pickup windows, and rate expectations from one guided flow.",
  },
  {
    icon: Users,
    title: "Compare carrier bids",
    desc: "Review verified carriers side-by-side with fit scores, history, and transparent bid activity.",
  },
  {
    icon: Truck,
    title: "Track every shipment",
    desc: "Monitor assigned loads, milestones, and delivery progress without switching tools.",
  },
  {
    icon: CheckCircle2,
    title: "POD review built in",
    desc: "Approve proof of delivery, resolve exceptions, and close jobs from the same command center.",
  },
  {
    icon: CreditCard,
    title: "Flexible payments",
    desc: "Pay instantly or on terms with supplier wallet flows tied directly to load status.",
  },
  {
    icon: Bot,
    title: "AI assistant onboard",
    desc: "Get help posting loads, reading bids, and understanding marketplace rules in natural language.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Post your freight",
    desc: "Add lane details once and broadcast to verified carriers across the Alpha marketplace.",
  },
  {
    step: "02",
    title: "Review ranked bids",
    desc: "Smart matching surfaces the best-fit carriers first — then you choose with confidence.",
  },
  {
    step: "03",
    title: "Manage to delivery",
    desc: "Track assignment, POD, and payment from a single supplier dashboard.",
  },
];

const sidebarNav = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Post load", icon: Package, active: false },
  { label: "My posts", icon: ClipboardList, active: false },
  { label: "Bids", icon: Users, active: false },
  { label: "Payments", icon: CreditCard, active: false },
  { label: "Settings", icon: Settings, active: false },
];

const demoLoads = [
  { lane: "London → Manchester", status: "Bidding", bids: "6 bids", price: "£1,250" },
  { lane: "Birmingham → Leeds", status: "Assigned", bids: "Carrier confirmed", price: "£980" },
  { lane: "Bristol → Glasgow", status: "In transit", bids: "Live tracking", price: "£1,840" },
];

function SupplierPortalDashboardMock() {
  return (
    <div className="relative w-full rounded-[1.6rem] bg-gradient-to-br from-white/40 via-white/22 to-white/10 p-1.5 shadow-[0_28px_70px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.75)] ring-1 ring-white/50 backdrop-blur-2xl sm:rounded-[1.75rem] sm:p-2">
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/30 via-transparent to-white/5" />
      <div className="relative overflow-hidden rounded-[1.25rem] border border-white/75 bg-white/94 shadow-[0_12px_40px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:rounded-[1.35rem]">
        <div className="flex min-h-[500px]">
          <aside className="hidden w-[210px] shrink-0 border-r border-slate-100/90 bg-gradient-to-b from-slate-50/40 to-white p-5 md:block">
            <div className="mb-8 flex items-center gap-2.5 px-1">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
                <Image src="/logo.png" alt="Alpha Freight" fill sizes="32px" className="object-contain p-1" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Supplier Hub</span>
            </div>
            <div className="space-y-1">
              {sidebarNav.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
                      item.active
                        ? "bg-slate-100/95 font-medium text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70"
                        : "font-medium text-slate-500"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        item.active ? "bg-white text-slate-700 shadow-sm ring-1 ring-slate-100" : "text-slate-400"
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

          <div className="min-w-0 flex-1 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Good morning, Sarah</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  Your supplier command center
                </h3>
              </div>
              <div className="rounded-full border border-[#BFFF07]/25 bg-[#BFFF07]/12 px-3.5 py-1.5 text-xs font-semibold text-slate-700">
                3 loads need action
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Active loads", value: "12" },
                { label: "Open bids", value: "8" },
                { label: "Assigned today", value: "4" },
                { label: "Awaiting POD", value: "2" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.15rem] border border-slate-100/90 bg-white/90 px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                >
                  <p className="text-[11px] font-medium text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.35rem] border border-slate-100/90 bg-white/85 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">Recent posts</h4>
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] text-slate-400">Live board</span>
                </div>
                <div className="space-y-2">
                  {demoLoads.map((row, index) => (
                    <div
                      key={row.lane}
                      className={`grid grid-cols-[1.3fr_0.7fr_0.5fr] items-center gap-3 rounded-2xl px-3.5 py-3 ${
                        index === 0 ? "bg-slate-900 text-white" : "bg-slate-50/80 text-slate-700"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{row.lane}</p>
                        <p className={`mt-0.5 text-xs ${index === 0 ? "text-white/55" : "text-slate-400"}`}>
                          {row.bids}
                        </p>
                      </div>
                      <span className="text-xs font-medium">{row.status}</span>
                      <span className="text-xs font-semibold">{row.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-slate-100/90 bg-white/85 p-4">
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <h4 className="text-sm font-semibold text-slate-800">Smart suggestions</h4>
                </div>
                <div className="space-y-2.5">
                  {[
                    "3 carriers match your London lane profile",
                    "Recommended rate band: £1,180 – £1,320",
                    "Review POD for Birmingham → Leeds load",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-slate-100/80 bg-slate-50/70 px-3.5 py-3 text-sm leading-relaxed text-slate-600"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SupplierPortalPage() {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".portal-hero-item", {
        y: 40,
        opacity: 0,
        duration: 0.95,
        stagger: 0.1,
        ease: "power4.out",
      });

      gsap.from(".portal-reveal", {
        scrollTrigger: { trigger: ".portal-reveal-grid", start: "top 80%" },
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
      className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black"
    >
      <Navbar variant="dark" />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-[#fafafa] pt-28 pb-8 sm:pb-12 lg:pb-16">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(191,255,7,0.14),transparent_70%)]" />

          <div className="relative z-10 mx-auto max-w-[920px] px-6 text-center lg:px-10">
            <p className="portal-hero-item text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-600">
              Supplier Portal
            </p>
            <h1 className="portal-hero-item mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
              Command center for shippers
            </h1>
            <p className="portal-hero-item mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
              Post freight, review bids, assign carriers, and manage POD and payments — all from one
              supplier workspace built for UK logistics teams.
            </p>
            <div className="portal-hero-item mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth/signup?role=supplier"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start as supplier
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/supplier/dashboard"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Open portal
              </Link>
            </div>
          </div>

          <div className="portal-hero-item relative z-10 mx-auto mt-12 max-w-[1180px] px-4 sm:px-6 lg:mt-14 lg:px-10">
            <div className="relative min-h-[580px] overflow-hidden rounded-[2.25rem] sm:min-h-[640px]">
              <div className="pointer-events-none absolute inset-0">
                <Image
                  src="/back 4.jpg"
                  alt=""
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 1180px) 100vw, 1180px"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.10),transparent_55%),radial-gradient(circle_at_80%_40%,rgba(168,85,247,0.08),transparent_50%)]" />
              </div>
              <div className="relative flex min-h-[580px] items-center justify-center px-4 py-16 sm:min-h-[640px] sm:px-8 sm:py-20">
                <SupplierPortalDashboardMock />
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

        <section className="portal-reveal-grid bg-white py-24">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                Portal workflow
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                From post to proof of delivery
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Everything a shipper team needs to move freight through the Alpha marketplace without
                spreadsheets, phone tag, or disconnected tools.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {workflow.map((step) => (
                <article
                  key={step.step}
                  className="portal-reveal rounded-[1.75rem] border border-slate-200 bg-slate-50 p-7"
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
                  Built for suppliers
                </p>
                <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                  Everything in one workspace
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-slate-600">
                The supplier portal connects posting, bidding, tracking, POD, and payments into a
                single operational layer.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="portal-reveal rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#BFFF07]/20 text-slate-900">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-slate-900">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.desc}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-white py-24">
          <div className="mx-auto grid max-w-[1400px] gap-10 px-6 lg:grid-cols-2 lg:items-center lg:px-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600">
                Trust & control
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight">
                Verified carriers. Clear decisions.
              </h2>
              <ul className="mt-6 space-y-4 text-sm text-slate-600">
                {[
                  "Only verified carriers can bid on your posted loads",
                  "Smart matching ranks fit before you review offers",
                  "POD review and payment flows stay tied to each shipment",
                  "Dashboard alerts surface loads that need action now",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7da600]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/products/smart-matching"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900"
              >
                See smart matching
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] bg-slate-900">
              <Image src="/service-2.avif" alt="Supplier operations" fill className="object-cover opacity-80" sizes="600px" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-[#BFFF07]" />
                  <div>
                    <p className="text-lg font-bold text-white">Live supplier analytics</p>
                    <p className="mt-1 text-sm text-white/60">Loads, bids, spend, and POD status in one view</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CinematicCTA
          title="Run freight from one portal"
          subtitle="Join Alpha Freight as a supplier and post your first load in minutes."
          buttonText="Create supplier account"
          buttonHref="/auth/signup?role=supplier"
        />
      </main>

      <Footer />
    </div>
  );
}
