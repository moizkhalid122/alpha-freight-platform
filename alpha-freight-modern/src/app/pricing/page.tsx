"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calculator,
  Check,
  CircleHelp,
  Package,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import JsonLd from "@/components/seo/JsonLd";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";

gsap.registerPlugin(ScrollTrigger);

const alwaysFree = [
  "Create supplier or carrier account",
  "Post unlimited freight loads",
  "Browse and bid on live UK loads",
  "Carrier directory & supplier profiles",
  "Digital POD & live GPS tracking",
  "In-platform messaging & notifications",
  "Free freight tools & lane calculators",
];

const pricingPlans = [
  {
    id: "supplier",
    badge: "For shippers",
    name: "Supplier",
    price: "£0",
    period: "to join",
    commission: "3–5%",
    commissionNote: "due before delivery",
    description:
      "Post loads, receive verified carrier bids, and pay load value plus commission when you assign a carrier — before delivery starts.",
    icon: Package,
    highlighted: false,
    cta: { label: "Post loads free", href: "/auth/signup?role=supplier" },
    features: [
      "Unlimited load posting",
      "Verified carrier bids",
      "Live shipment tracking",
      "Digital POD & compliance",
      "Pay Instant settlement option",
      "No monthly subscription",
    ],
  },
  {
    id: "carrier",
    badge: "Most popular",
    name: "Carrier",
    price: "£0",
    period: "forever",
    commission: "0%",
    commissionNote: "no platform fee on earnings",
    description:
      "Find loads, submit bids, and get paid through the marketplace with zero membership or bidding fees.",
    icon: Truck,
    highlighted: true,
    cta: { label: "Find loads free", href: "/auth/signup?role=carrier" },
    features: [
      "Free load board access",
      "Unlimited bidding",
      "7-day payout window",
      "Carrier wallet & history",
      "Route & margin tools",
      "Referral rewards programme",
    ],
  },
  {
    id: "enterprise",
    badge: "High volume",
    name: "Enterprise",
    price: "Custom",
    period: "volume pricing",
    commission: "From 3%",
    commissionNote: "negotiated by lane & volume",
    description:
      "Dedicated support, API access, and tailored commission for fleets, 3PLs, and high-volume shippers.",
    icon: Building2,
    highlighted: false,
    cta: { label: "Talk to sales", href: "/contact" },
    features: [
      "Volume-based commission rates",
      "Dedicated account manager",
      "API & webhook integration",
      "White-label options",
      "Priority carrier matching",
      "Custom reporting & SLAs",
    ],
  },
];

const commissionExamples = [
  { loadValue: 500, rate: 3, fee: 15 },
  { loadValue: 1000, rate: 4, fee: 40 },
  { loadValue: 2500, rate: 5, fee: 125 },
  { loadValue: 5000, rate: 3, fee: 150 },
];

const comparison = [
  { label: "Monthly subscription", alpha: "£0", traditional: "£99–£499/mo" },
  { label: "Load posting", alpha: "Free", traditional: "Per-seat or capped" },
  { label: "Carrier bidding", alpha: "Free", traditional: "Often extra" },
  { label: "Commission model", alpha: "3–5% per load", traditional: "Hidden margins" },
  { label: "When you pay", alpha: "Before delivery", traditional: "After delivery + fees" },
];

const faqs = [
  {
    q: "Is it really free to create an account?",
    a: "Yes. Suppliers and carriers can sign up, post loads, browse freight, and use core marketplace features at no monthly cost.",
  },
  {
    q: "When is the 3–5% commission charged?",
    a: "When you assign a carrier to your load, payment — including the 3–5% platform commission — is taken before delivery begins. No charge for posting loads or cancelled bookings before a carrier is confirmed.",
  },
  {
    q: "Do carriers pay any platform fee?",
    a: "No. Carriers join free, bid free, and keep their agreed load rate. Alpha Freight earns a supplier-side commission collected before delivery when a carrier is assigned.",
  },
  {
    q: "Why does commission vary between 3% and 5%?",
    a: "The rate depends on load value, lane, volume, and account tier. High-volume shippers may qualify for lower rates — contact us for enterprise pricing.",
  },
  {
    q: "Are there hidden fees?",
    a: "No setup fees, no per-bid charges, and no lock-in contracts on standard accounts. Optional add-ons like Pay Instant may carry separate payment processing costs.",
  },
];

export default function PricingPage() {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [calcLoad, setCalcLoad] = useState(1000);
  const [calcRate, setCalcRate] = useState(4);

  const estimatedFee = Math.round((calcLoad * calcRate) / 100);

  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".pricing-hero-item", {
        y: 36,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power4.out",
      });

      gsap.from(".pricing-reveal", {
        scrollTrigger: { trigger: ".pricing-cards-grid", start: "top 85%" },
        y: 44,
        opacity: 0,
        duration: 0.85,
        stagger: 0.12,
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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Alpha Freight Pricing",
          description:
            "Free to join, post loads, and find freight. Pay 3–5% commission before delivery when you assign a carrier.",
          url: "https://www.alphafreightuk.com/pricing",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />

      <Navbar variant="dark" />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white pt-28 pb-20 sm:pb-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(191,255,7,0.10),transparent_70%)]" />

          <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="pricing-hero-item text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7da600]">
                Transparent marketplace pricing
              </p>
              <h1 className="pricing-hero-item mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.06]">
                Free to start.
                <span className="block text-slate-500">Pay before delivery, not after.</span>
              </h1>
              <p className="pricing-hero-item mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
                Create an account, post loads, and find haulage — all free. When you assign a carrier, payment
                including a simple{" "}
                <strong className="font-semibold text-slate-800">3–5% commission</strong> is collected before
                delivery. No monthly subscriptions. No bidding fees for carriers.
              </p>

              <div className="pricing-hero-item mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/auth/signup?role=supplier"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Start as supplier
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/signup?role=carrier"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200/80 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:border-[#BFFF07]/50"
                >
                  Start as carrier
                </Link>
              </div>

              <div className="pricing-hero-item mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
                {[
                  { icon: BadgeCheck, text: "No setup fees" },
                  { icon: Wallet, text: "Pay before delivery" },
                  { icon: Sparkles, text: "Free tools included" },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#7da600]" />
                    {text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="border-b border-slate-200/70 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                Pricing plans
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Built for suppliers, carriers, and enterprise teams
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                Choose your role. Every plan starts at zero monthly cost — suppliers pay load value plus
                commission when a carrier is assigned, before delivery.
              </p>
            </div>

            <div className="pricing-cards-grid grid gap-6 lg:grid-cols-3 lg:gap-5">
              {pricingPlans.map((plan) => {
                const Icon = plan.icon;
                return (
                  <article
                    key={plan.id}
                    className={`pricing-reveal relative flex flex-col rounded-[1.75rem] border p-8 transition-shadow ${
                      plan.highlighted
                        ? "border-[#BFFF07]/60 bg-white shadow-[0_20px_60px_rgba(191,255,7,0.15)] ring-2 ring-[#BFFF07]/30 lg:scale-[1.02]"
                        : "border-slate-200/80 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.04)]"
                    }`}
                  >
                    {plan.highlighted ? (
                      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#BFFF07]/20 blur-3xl" />
                    ) : null}

                    <div className="relative flex items-start justify-between gap-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                          plan.highlighted
                            ? "bg-[#BFFF07] text-slate-900"
                            : "bg-[#BFFF07]/15 text-[#7da600]"
                        }`}
                      >
                        {plan.badge}
                      </span>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-[#BFFF07]">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="relative mt-8">
                      <h3 className="text-2xl font-bold tracking-tight">{plan.name}</h3>
                      <div className="mt-4 flex items-end gap-2">
                        <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
                        <span className="pb-2 text-sm font-medium text-slate-500">
                          {plan.period}
                        </span>
                      </div>
                    </div>

                    <div className="relative mt-6 rounded-2xl border border-[#BFFF07]/30 bg-[#BFFF07]/8 px-4 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7da600]">
                        Commission
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{plan.commission}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {plan.commissionNote}
                      </p>
                    </div>

                    <p className="relative mt-5 text-sm leading-relaxed text-slate-600">
                      {plan.description}
                    </p>

                    <ul className="relative mt-6 flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7da600]" />
                          <span className="text-slate-700">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={plan.cta.href}
                      className={`relative mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition ${
                        plan.highlighted
                          ? "bg-[#BFFF07] text-slate-900 hover:bg-[#d4ff4d]"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      {plan.cta.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Always free */}
        <section className="border-b border-slate-200/70 bg-white py-20">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                  Always included
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Everything free until you assign a carrier
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
                  We only charge when you confirm a carrier and payment is taken before delivery. That keeps
                  posting, bidding, and networking completely free until you are ready to move freight.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {alwaysFree.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7da600]" />
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Commission calculator */}
        <section className="border-b border-slate-200/70 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                  Commission calculator
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  See what 3–5% looks like in practice
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600">
                  Supplier commission is calculated on the agreed load value when you assign a carrier.
                  Payment — including commission — is collected before delivery. Adjust the sliders to
                  estimate your cost per shipment.
                </p>

                <div className="mt-8 space-y-6 rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div>
                    <label className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span className="inline-flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-[#7da600]" />
                        Load value
                      </span>
                      <span>£{calcLoad.toLocaleString()}</span>
                    </label>
                    <input
                      type="range"
                      min={200}
                      max={10000}
                      step={50}
                      value={calcLoad}
                      onChange={(e) => setCalcLoad(Number(e.target.value))}
                      className="mt-3 h-2 w-full cursor-pointer accent-[#7da600]"
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>Commission rate</span>
                      <span>{calcRate}%</span>
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={5}
                      step={0.5}
                      value={calcRate}
                      onChange={(e) => setCalcRate(Number(e.target.value))}
                      className="mt-3 h-2 w-full cursor-pointer accent-[#7da600]"
                    />
                  </div>
                  <div className="rounded-2xl border border-[#BFFF07]/30 bg-[#BFFF07]/8 px-5 py-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7da600]">
                      Estimated commission
                    </p>
                    <p className="mt-2 text-4xl font-bold text-slate-900">£{estimatedFee}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      On a £{calcLoad.toLocaleString()} load at {calcRate}% — paid before delivery when carrier is assigned.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {commissionExamples.map((example) => (
                  <div
                    key={`${example.loadValue}-${example.rate}`}
                    className="rounded-[1.35rem] border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      £{example.loadValue.toLocaleString()} load
                    </p>
                    <p className="mt-3 text-3xl font-bold text-slate-900">£{example.fee}</p>
                    <p className="mt-2 text-sm text-slate-500">at {example.rate}% commission</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="border-b border-slate-200/70 bg-white py-20">
          <div className="mx-auto max-w-[1000px] px-6 lg:px-10">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Alpha Freight vs traditional brokers</h2>
              <p className="mt-3 text-sm text-slate-600 sm:text-base">
                Modern marketplace pricing — no surprise retainers or opaque margins.
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-3 border-b border-slate-200/80 bg-white px-5 py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <span>Feature</span>
                <span className="text-center text-[#7da600]">Alpha Freight</span>
                <span className="text-center">Traditional</span>
              </div>
              {comparison.map((row, index) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-3 px-5 py-4 text-sm ${
                    index !== comparison.length - 1 ? "border-b border-slate-100" : ""
                  }`}
                >
                  <span className="font-medium text-slate-700">{row.label}</span>
                  <span className="text-center font-semibold text-slate-900">{row.alpha}</span>
                  <span className="text-center text-slate-500">{row.traditional}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-[800px] px-6 lg:px-10">
            <div className="mb-10 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7da600]">
                Pricing FAQ
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Common questions</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={item.q}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                    >
                      <span className="flex items-start gap-3 text-sm font-semibold text-slate-900 sm:text-base">
                        <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-[#7da600]" />
                        {item.q}
                      </span>
                      <span className="text-xl leading-none text-slate-400">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen ? (
                      <div className="border-t border-slate-200 px-5 pb-5 pt-1 text-sm leading-relaxed text-slate-600">
                        {item.a}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <CinematicCTA
          title="Ready to move freight without monthly fees?"
          subtitle="Free to start — fair commission on success"
          buttonText="Create free account"
          buttonHref="/auth/signup?role=supplier"
        />
      </main>

      <Footer />
    </div>
  );
}
