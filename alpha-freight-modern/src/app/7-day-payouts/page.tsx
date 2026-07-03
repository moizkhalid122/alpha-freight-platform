"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  PiggyBank,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";

gsap.registerPlugin(ScrollTrigger);

const comparison = [
  { label: "Alpha Freight", value: "7 days", highlight: true },
  { label: "Traditional broker", value: "30–90 days", highlight: false },
  { label: "Factoring typical", value: "Fees + delay", highlight: false },
];

const workflow = [
  {
    step: "01",
    title: "Delivery confirmed",
    desc: "Carrier completes the job and uploads digital proof of delivery through the platform or mobile app.",
    icon: CheckCircle2,
  },
  {
    step: "02",
    title: "POD verified",
    desc: "Alpha validates delivery compliance and triggers settlement in your carrier wallet.",
    icon: ShieldCheck,
  },
  {
    step: "03",
    title: "Funds released",
    desc: "Payment is scheduled for disbursement within our 7-day payout window after verification.",
    icon: Wallet,
  },
  {
    step: "04",
    title: "Bank transfer",
    desc: "Withdraw to your registered bank account with full visibility in the carrier wallet.",
    icon: Banknote,
  },
];

const settlementSteps = [
  {
    title: "Verification",
    desc: "AI-assisted validation of digital POD and delivery compliance.",
    icon: ShieldCheck,
  },
  {
    title: "Generation",
    desc: "Automated invoice creation aligned with the agreed contract rate.",
    icon: FileText,
  },
  {
    title: "Disbursement",
    desc: "Electronic transfer initiated to your registered payout account.",
    icon: CreditCard,
  },
];

const benefits = [
  "No factoring fees on standard 7-day settlement",
  "Automated invoicing tied to verified POD",
  "Carrier wallet with payout history and status",
  "Faster cash flow for fuel, maintenance, and fleet growth",
  "Finance support for settlement discrepancies within 24 hours",
  "Secure payout setup through verified bank details",
];

const faqs = [
  {
    q: "When does the 7-day window start?",
    a: "The payout clock starts after digital POD is verified and the load is marked complete in the Alpha platform.",
  },
  {
    q: "Do I need a factoring company?",
    a: "No. Alpha Freight's standard carrier payout model is designed to keep cash moving without third-party factoring fees.",
  },
  {
    q: "Where do I track my payout?",
    a: "Use the carrier wallet to see available balance, pending releases, and payout history in one place.",
  },
];

export default function SevenDayPayoutsPage() {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".payout-hero-item", {
        y: 36,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power4.out",
      });

      gsap.from(".payout-reveal", {
        scrollTrigger: { trigger: ".payout-reveal-grid", start: "top 82%" },
        y: 40,
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
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-[#fafafa] pt-28 pb-20 sm:pb-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(191,255,7,0.16),transparent_70%)]" />

          <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="payout-hero-item text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7da600]">
                  Carrier payments
                </p>
                <h1 className="payout-hero-item mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.06]">
                  7-Day Payout Guarantee
                </h1>
                <p className="payout-hero-item mt-5 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
                  Alpha Freight keeps carrier capital liquid. Get paid within 7 days of POD
                  verification — not 30, 60, or 90 days later.
                </p>
                <div className="payout-hero-item mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/auth/signup?role=carrier"
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Join as carrier
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/carrier/wallet"
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Open carrier wallet
                  </Link>
                </div>
              </div>

              <div className="payout-hero-item relative mx-auto w-full max-w-[380px]">
                <div className="overflow-hidden rounded-[2rem] bg-slate-900 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.2)]">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#BFFF07]/20 blur-3xl" />
                  <div className="relative flex items-center gap-6">
                    <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-[1.75rem] bg-[#BFFF07] text-slate-900">
                      <span className="text-5xl font-bold leading-none">7</span>
                      <span className="mt-1 text-center text-[10px] font-bold uppercase tracking-[0.16em]">
                        Day
                        <br />
                        Payout
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#BFFF07]">The Alpha financial edge</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/55">
                        Settlement starts after verified digital POD — built for UK carriers who need
                        faster cash flow.
                      </p>
                    </div>
                  </div>
                  <div className="relative mt-6 flex flex-wrap gap-2">
                    {["No factoring fees", "Automated invoicing", "Wallet visibility"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200/70 bg-white py-16">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="grid gap-4 md:grid-cols-3">
              {comparison.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-[1.35rem] border px-6 py-8 text-center ${
                    item.highlight
                      ? "border-[#BFFF07]/40 bg-[#BFFF07]/10 shadow-[0_12px_40px_rgba(191,255,7,0.12)]"
                      : "border-slate-200/80 bg-slate-50"
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="payout-reveal-grid bg-white py-24">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600">
                How it works
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                From POD to payout in days, not months
              </h2>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {workflow.map((step) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.step}
                    className="payout-reveal rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#7da600]">{step.step}</span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-800 shadow-sm ring-1 ring-slate-100">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="mt-5 text-xl font-bold tracking-tight">{step.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.desc}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#F8FAFC] py-24">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                  Settlement workflow
                </p>
                <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                  Built for speed and transparency
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-slate-600">
                Digital POD triggers automated settlement — so carriers spend less time chasing
                payments and more time moving freight.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {settlementSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.title}
                    className="payout-reveal rounded-[1.5rem] border border-slate-200 bg-white p-7 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-[#BFFF07]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-white py-24">
          <div className="mx-auto grid max-w-[1400px] gap-12 px-6 lg:grid-cols-2 lg:px-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-600">
                Carrier benefits
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight">
                Keep your fleet funded
              </h2>
              <ul className="mt-8 space-y-4">
                {benefits.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#7da600]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/products/pod"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900"
              >
                See digital POD
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {faqs.map((item) => (
                <article
                  key={item.q}
                  className="payout-reveal rounded-[1.35rem] border border-slate-200 bg-slate-50 p-6"
                >
                  <h3 className="text-base font-bold text-slate-900">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
                </article>
              ))}

              <article className="payout-reveal rounded-[1.35rem] border border-slate-200 bg-slate-900 p-6 text-white">
                <div className="flex items-start gap-4">
                  <PiggyBank className="h-8 w-8 shrink-0 text-[#BFFF07]" />
                  <div>
                    <h3 className="text-lg font-bold">Security & transparency</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">
                      Payouts route to your verified bank account with full transaction visibility in
                      the carrier dashboard. Our finance team resolves settlement issues within 24
                      hours when needed.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-[#fafafa] py-16">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-8 px-6 text-center lg:px-10">
            {[
              { icon: Clock, label: "7-day target window" },
              { icon: Wallet, label: "Carrier wallet built in" },
              { icon: Zap, label: "POD-triggered release" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 text-slate-700">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#BFFF07]/25 text-slate-900">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <CinematicCTA
          title="Get paid faster on Alpha Freight"
          subtitle="Join verified carriers and unlock 7-day payouts with digital POD and wallet visibility."
          buttonText="Create carrier account"
          buttonHref="/auth/signup?role=carrier"
        />
      </main>

      <Footer />
    </div>
  );
}
