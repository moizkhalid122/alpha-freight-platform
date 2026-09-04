"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowUpRight,
  Building2,
  Calculator,
  Check,
  Minus,
  Package,
  Plus,
  Truck,
  type LucideIcon,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import JsonLd from "@/components/seo/JsonLd";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";
import {
  CARRIER_COMMISSION_RATE,
  SUPPLIER_COMMISSION_RATE,
} from "@/lib/load-commission";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pricing-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pricing-sans",
  display: "swap",
});

gsap.registerPlugin(ScrollTrigger);

const supplierCommissionPercent = Math.round(SUPPLIER_COMMISSION_RATE * 100);
const carrierCommissionPercent = Math.round(CARRIER_COMMISSION_RATE * 100);

const heroStats = [
  { value: "£0", label: "Monthly subscription" },
  { value: `${supplierCommissionPercent}%`, label: "Supplier service fee" },
  { value: `${carrierCommissionPercent}%`, label: "Carrier platform fee" },
  { value: "7 days", label: "Carrier payout window" },
];

const pricingPlans = [
  {
    id: "supplier",
    badge: "Shippers",
    name: "Supplier",
    price: "£0",
    period: "to join",
    commission: `${supplierCommissionPercent}%`,
    commissionNote: "fixed fee before delivery",
    icon: Package,
    featured: false,
    image: "/images/pricing-card-supplier.png",
    cta: { label: "Post loads", href: "/auth/signup?role=supplier" },
    features: ["Unlimited posting", "Verified bids", "Live tracking", "Digital POD", "No subscription"],
  },
  {
    id: "carrier",
    badge: "Popular",
    name: "Carrier",
    price: "£0",
    period: "forever",
    commission: `${carrierCommissionPercent}%`,
    commissionNote: "deducted from load rate",
    icon: Truck,
    featured: true,
    image: "/images/pricing-card-carrier.jpg",
    cta: { label: "Find loads", href: "/auth/signup?role=carrier" },
    features: ["Free load board", "Unlimited bids", "7-day payout", "Carrier wallet", "Route tools"],
  },
  {
    id: "enterprise",
    badge: "Volume",
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    commission: `From ${carrierCommissionPercent}%`,
    commissionNote: "negotiated by volume",
    icon: Building2,
    featured: false,
    image: "/images/pricing-card-enterprise.png",
    cta: { label: "Contact sales", href: "/contact" },
    features: ["Volume rates", "Account manager", "API access", "White-label", "Custom SLAs"],
  },
] as const;

type PricingPlan = (typeof pricingPlans)[number];

const pricingAddOn = {
  name: "Live Tracking",
  badge: "Included",
  price: "£0",
  subtitle: "For every load on the platform",
  href: "/products/tracking",
  image: "/images/pricing-addon-pascal.jpg",
  intro: "Level up your operations with:",
  features: [
    "Real-time GPS tracking on every load",
    "Digital proof of delivery",
    "Live ETA alerts for suppliers & carriers",
    "Shareable tracking links for customers",
  ],
};

const pricingTestimonial = {
  quote:
    "The 7-day payout is a game changer for small carriers like us. No more chasing brokers for payments. Best platform in the UK.",
  author: "Sarah Jenkins",
  role: "Owner Operator, Jenkins Trucking",
  image: "/images/pricing-testimonial.png",
};

const platformStats = [
  { value: "500+", label: "Verified UK carriers on the network" },
  { value: "120+", label: "Loads posted across the platform daily" },
  { value: "60 sec", label: "Average time to match a carrier" },
  { value: "£0", label: "Monthly fee to join Alpha Freight" },
];

const included = [
  "Create account free",
  "Post unlimited loads",
  "Browse & bid on UK freight",
  "GPS tracking & digital POD",
  "Messaging & notifications",
  "Free freight tools",
];

const comparison = [
  { label: "Monthly subscription", alpha: "£0", traditional: "£99–£499/mo" },
  { label: "Load posting", alpha: "Free", traditional: "Per-seat or capped" },
  { label: "Carrier bidding", alpha: "Free", traditional: "Often extra" },
  { label: "Supplier fee", alpha: "4% fixed", traditional: "Hidden margins" },
  { label: "Carrier fee", alpha: "3% fixed", traditional: "Opaque cuts" },
  { label: "When you pay", alpha: "Before delivery", traditional: "After + extras" },
];

const faqs = [
  {
    q: "Is it free to create an account?",
    a: "Yes — suppliers and carriers sign up, post loads, and browse freight at no monthly cost.",
  },
  {
    q: "When is supplier commission charged?",
    a: "When you assign a carrier, payment including the 4% service fee is taken before delivery starts.",
  },
  {
    q: "Do carriers pay a fee?",
    a: "Carriers bid free. A fixed 3% fee is deducted from the load rate shown — you receive the net amount.",
  },
  {
    q: "Any hidden fees?",
    a: "No setup fees, no per-bid charges, and no lock-in on standard accounts.",
  },
];

function serif(className?: string) {
  return `${className ?? ""} font-[family-name:var(--font-pricing-serif),Georgia,serif]`.trim();
}

/** crisp bordered card — no shadow, no tint */
const card = "rounded-xl border border-neutral-200 bg-white";

function PricingFlipCard({ plan, flipped }: { plan: PricingPlan; flipped: boolean }) {
  const Icon = plan.icon as LucideIcon;

  return (
    <>
      {/* Mobile — price only, no image */}
      <article className="pr-fade overflow-hidden rounded-[1.75rem] border border-neutral-800 bg-white lg:hidden">
        <PricingCardBack plan={plan} Icon={Icon} compact />
      </article>

      {/* Desktop / laptop — image flip → price */}
      <div className="pr-fade hidden h-[min(580px,74vh)] min-h-[480px] [perspective:1400px] lg:block">
        <div
          className={`relative h-full w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.4,0,0.2,1)] [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* Front — freight image */}
          <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] [backface-visibility:hidden]">
            <Image
              src={plan.image}
              alt={plan.name}
              fill
              className="object-cover object-center"
              sizes="33vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-6 pb-6 pt-16">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">{plan.badge}</p>
              <p className={`mt-1 text-2xl font-medium text-white ${serif()}`}>{plan.name}</p>
            </div>
          </div>

          {/* Back — pricing (stays visible after scroll flip) */}
          <div className="absolute inset-0 [transform:rotateY(180deg)] overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white [backface-visibility:hidden]">
            <PricingCardBack plan={plan} Icon={Icon} className="h-full" />
          </div>
        </div>
      </div>
    </>
  );
}

function PricingCardBack({
  plan,
  Icon,
  compact = false,
  className = "",
}: {
  plan: PricingPlan;
  Icon: LucideIcon;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${compact ? "p-6" : "p-8"} ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">{plan.badge}</span>
        <Icon className="h-5 w-5 text-neutral-900" strokeWidth={1.25} />
      </div>

      <h3
        className={`mt-6 font-medium text-neutral-900 ${serif()} ${
          compact ? "text-[22px]" : "text-[26px]"
        }`}
      >
        {plan.name}
      </h3>
      <div className="mt-3 flex items-end gap-2">
        <span className={`text-[clamp(2rem,3.5vw,2.75rem)] font-medium leading-none text-neutral-900 ${serif()}`}>
          {plan.price}
        </span>
        <span className="pb-1 text-[13px] text-neutral-400">{plan.period}</span>
      </div>

      <div className="mt-6 border border-neutral-200 px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Commission</p>
        <p className={`mt-1 text-xl font-medium text-neutral-900 ${serif()}`}>{plan.commission}</p>
        <p className="mt-0.5 text-[12px] text-neutral-500">{plan.commissionNote}</p>
      </div>

      <ul className={`mt-5 flex-1 space-y-2 ${compact ? "text-[12px]" : "text-[13px]"}`}>
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-neutral-600">
            <Check className="h-3.5 w-3.5 shrink-0 text-neutral-900" strokeWidth={2} />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={plan.cta.href}
        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-neutral-900 bg-neutral-900 text-[13px] font-semibold text-white transition hover:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {plan.cta.label}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export default function PremiumPricingPage() {
  useMarketingSmoothScroll();
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const plansCardsRef = useRef<HTMLDivElement>(null);
  const plansFlipTriggeredRef = useRef(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [calcLoad, setCalcLoad] = useState(1000);
  const [flippedCards, setFlippedCards] = useState<boolean[]>(() =>
    pricingPlans.map(() => false),
  );

  const estimatedFee = Math.round(calcLoad * SUPPLIER_COMMISSION_RATE);
  const estimatedTotal = calcLoad + estimatedFee;

  useEffect(() => {
    const cards = plansCardsRef.current;
    if (!cards) return;

    let flipDelayTimer: number | undefined;

    const triggerFlip = () => {
      if (plansFlipTriggeredRef.current) return;
      plansFlipTriggeredRef.current = true;

      flipDelayTimer = window.setTimeout(() => {
        pricingPlans.forEach((_, index) => {
          window.setTimeout(() => {
            setFlippedCards((prev) => {
              const next = [...prev];
              next[index] = true;
              return next;
            });
          }, index * 220);
        });
      }, 450);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      triggerFlip();
      return () => {
        if (flipDelayTimer) window.clearTimeout(flipDelayTimer);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) triggerFlip();
      },
      { threshold: 0.58, rootMargin: "-12% 0px -18% 0px" },
    );

    observer.observe(cards);
    return () => {
      observer.disconnect();
      if (flipDelayTimer) window.clearTimeout(flipDelayTimer);
    };
  }, []);

  useEffect(() => {
    if (!pageRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".pr-in",
        { y: 32, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out", delay: 0.15 },
      );

      if (heroImageRef.current && heroRef.current) {
        gsap.fromTo(heroImageRef.current, { scale: 1.05 }, { scale: 1, duration: 2, ease: "power2.out" });
        gsap.to(heroImageRef.current, {
          y: 48,
          ease: "none",
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1.2 },
        });
      }

      gsap.utils.toArray<HTMLElement>(".pr-fade").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%" },
          },
        );
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pageRef}
      className={`${cormorant.variable} ${dmSans.variable} min-h-screen overflow-x-hidden bg-white font-[family-name:var(--font-pricing-sans)] text-neutral-900 selection:bg-neutral-900 selection:text-white`}
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Alpha Freight Pricing",
          description: "Free to join UK freight marketplace. Fixed 4% supplier / 3% carrier commission.",
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

      <Navbar variant="light" />

      <main>
        {/* ── FULL-SCREEN HERO ── */}
        <section ref={heroRef} className="relative min-h-[100svh] overflow-hidden">
          <div ref={heroImageRef} className="absolute inset-0 will-change-transform">
            <Image
              src="/images/pricing-hero.png"
              alt="Alpha Freight UK pricing"
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>
          {/* clean overlay — no colour tint */}
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1200px] flex-col justify-end px-6 pb-16 pt-28 lg:px-10 lg:pb-24 lg:pt-32">
            <p className="pr-in text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">
              Pricing
            </p>
            <h1
              className={`pr-in mt-4 max-w-[640px] text-[clamp(2.75rem,6vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.02em] text-white ${serif()}`}
            >
              Free to start.
              <br />
              Pay when freight moves.
            </h1>
            <p className="pr-in mt-5 max-w-[380px] text-[15px] leading-relaxed text-white/75">
              No monthly fee. Fixed commission when you assign a carrier.
            </p>
            <div className="pr-in mt-10 flex flex-wrap gap-3">
              <Link
                href="/auth/signup?role=supplier"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-8 text-[13px] font-semibold text-neutral-900 transition hover:bg-neutral-100"
              >
                Start as supplier
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/auth/signup?role=carrier"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white px-8 text-[13px] font-semibold text-white transition hover:bg-white hover:text-neutral-900"
              >
                Start as carrier
              </Link>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="border-b border-neutral-200 bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
            <div className="pr-fade mx-auto max-w-[560px] text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">
                Simple numbers
              </p>
              <h2 className={`mt-4 text-[clamp(1.875rem,3.5vw,2.75rem)] font-medium leading-[1.08] text-neutral-900 ${serif()}`}>
                Pricing that stays transparent
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-500">
                Fixed commission. No monthly retainers. No hidden broker margins.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 lg:grid-cols-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="pr-fade bg-white px-6 py-10 lg:px-8">
                  <p className={`text-[clamp(1.75rem,2.5vw,2.25rem)] font-medium leading-none text-neutral-900 ${serif()}`}>
                    {stat.value}
                  </p>
                  <p className="mt-3 text-[12px] leading-snug text-neutral-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PLANS — auto flip on scroll ── */}
        <section className="border-b border-neutral-800 bg-neutral-950 py-20 lg:py-28">
          <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
            <div className="pr-fade mb-4 text-center lg:mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
                Choose your role
              </p>
              <h2 className={`mt-3 text-[clamp(1.75rem,3vw,2.75rem)] font-medium text-white ${serif()}`}>
                You&apos;ve got freight. We&apos;ve got plans.
              </h2>
            </div>

            <div ref={plansCardsRef} className="grid gap-5 lg:grid-cols-3 lg:gap-4">
              {pricingPlans.map((plan, index) => (
                <PricingFlipCard key={plan.id} plan={plan} flipped={flippedCards[index] ?? false} />
              ))}
            </div>

            {/* But wait, there's more — add-on card */}
            <div className="pr-fade mt-20 lg:mt-28">
              <h2 className={`text-[clamp(1.75rem,3vw,2.5rem)] font-medium text-white ${serif()}`}>
                But wait, there&apos;s more
              </h2>

              <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-neutral-800 bg-neutral-900 lg:grid lg:grid-cols-2">
                <div className="relative aspect-[4/3] min-h-[280px] lg:aspect-auto lg:min-h-[440px]">
                  <Image
                    src={pricingAddOn.image}
                    alt={pricingAddOn.name}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>

                <div className="flex flex-col p-8 lg:p-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className={`text-[clamp(1.5rem,2vw,1.875rem)] font-medium text-white ${serif()}`}>
                        {pricingAddOn.name}
                      </h3>
                      <span className="rounded-full bg-[#BFFF07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-900">
                        {pricingAddOn.badge}
                      </span>
                    </div>
                    <span className={`shrink-0 text-[clamp(1.25rem,2vw,1.5rem)] font-medium text-white ${serif()}`}>
                      {pricingAddOn.price}
                    </span>
                  </div>

                  <p className="mt-2 text-[14px] text-neutral-500">{pricingAddOn.subtitle}</p>

                  <Link
                    href={pricingAddOn.href}
                    className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full border border-white/25 text-[13px] font-semibold text-white transition hover:border-white hover:bg-white hover:text-neutral-900"
                  >
                    Learn more
                  </Link>

                  <div className="mt-8 border-t border-neutral-800 pt-8">
                    <p className="text-[14px] text-neutral-500">{pricingAddOn.intro}</p>
                    <ul className="mt-5 divide-y divide-neutral-800">
                      {pricingAddOn.features.map((feature) => (
                        <li key={feature} className="py-4 text-[14px] leading-relaxed text-white/85 first:pt-0 last:pb-0">
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Word on the street — testimonial */}
            <div className="pr-fade mt-20 lg:mt-28">
              <h2 className={`text-[clamp(1.75rem,3vw,2.5rem)] font-medium text-white ${serif()}`}>
                Word on the street
              </h2>

              <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12">
                <div className="relative aspect-[4/3] min-h-[280px] overflow-hidden rounded-[1.75rem] lg:aspect-auto lg:min-h-[480px]">
                  <Image
                    src={pricingTestimonial.image}
                    alt={pricingTestimonial.author}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 45vw"
                  />
                </div>

                <div className="flex flex-col justify-center py-2 lg:py-8">
                  <blockquote
                    className={`text-[clamp(1.375rem,2.2vw,2rem)] font-medium leading-[1.35] text-white ${serif()}`}
                  >
                    &ldquo;{pricingTestimonial.quote}&rdquo;
                  </blockquote>
                  <p className="mt-8 text-[14px] text-neutral-500">
                    —{pricingTestimonial.author}, {pricingTestimonial.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Platform stats */}
            <div className="pr-fade mt-20 grid gap-4 sm:grid-cols-2 lg:mt-28 lg:grid-cols-4 lg:gap-4">
              {platformStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.75rem] border border-neutral-800 bg-neutral-900 px-6 py-10 lg:px-8 lg:py-12"
                >
                  <p className={`text-[clamp(2rem,3.5vw,2.75rem)] font-medium leading-none text-white ${serif()}`}>
                    {stat.value}
                  </p>
                  <p className="mt-4 text-[13px] leading-relaxed text-neutral-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── INCLUDED + CALCULATOR ── */}
        <section className="border-b border-neutral-200 bg-neutral-50 py-20 lg:py-28">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className={`pr-fade p-8 lg:p-10 ${card}`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
                  Always free
                </p>
                <h2 className={`mt-3 text-[clamp(1.5rem,2.5vw,2rem)] font-medium text-neutral-900 ${serif()}`}>
                  Until you assign a carrier
                </h2>
                <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                  {included.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[13px] text-neutral-600">
                      <Check className="h-3.5 w-3.5 shrink-0 text-neutral-900" strokeWidth={2} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`pr-fade p-8 lg:p-10 ${card}`}>
                <Calculator className="h-5 w-5 text-neutral-900" strokeWidth={1.25} />
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
                  Commission estimate
                </p>
                <p className={`mt-4 text-[clamp(1.5rem,2.5vw,2rem)] font-medium text-neutral-900 ${serif()}`}>
                  £{calcLoad.toLocaleString()} → £{estimatedFee}
                </p>
                <input
                  type="range"
                  min={200}
                  max={10000}
                  step={50}
                  value={calcLoad}
                  onChange={(e) => setCalcLoad(Number(e.target.value))}
                  className="mt-8 h-px w-full cursor-pointer appearance-none bg-neutral-300 accent-neutral-900"
                />
                <p className="mt-5 text-[13px] leading-relaxed text-neutral-500">
                  Total £{estimatedTotal.toLocaleString()} — paid before delivery at {supplierCommissionPercent}%.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPARISON ── */}
        <section className="border-b border-neutral-200 bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-[760px] px-6 lg:px-10">
            <h2 className={`pr-fade mb-10 text-center text-[clamp(1.5rem,2.5vw,2rem)] font-medium text-neutral-900 ${serif()}`}>
              Alpha Freight vs traditional brokers
            </h2>
            <div className={`pr-fade overflow-hidden ${card}`}>
              <div className="grid grid-cols-3 border-b border-neutral-200 bg-neutral-900 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                <span>Feature</span>
                <span className="text-center text-white">Alpha Freight</span>
                <span className="text-center">Traditional</span>
              </div>
              {comparison.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-3 px-5 py-4 text-[13px] ${
                    i < comparison.length - 1 ? "border-b border-neutral-200" : ""
                  }`}
                >
                  <span className="text-neutral-600">{row.label}</span>
                  <span className="text-center font-semibold text-neutral-900">{row.alpha}</span>
                  <span className="text-center text-neutral-400">{row.traditional}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-[680px] px-6 lg:px-10">
            <div className="pr-fade mb-10 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400">FAQ</p>
              <h2 className={`mt-2 text-[clamp(1.5rem,2.5vw,2rem)] font-medium text-neutral-900 ${serif()}`}>
                Common questions
              </h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <div key={faq.q} className={`pr-fade overflow-hidden ${card}`}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <span className={`text-[15px] font-medium text-neutral-900 ${open ? serif() : ""}`}>
                        {faq.q}
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-neutral-200">
                        {open ? (
                          <Minus className="h-3.5 w-3.5 text-neutral-900" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 text-neutral-900" />
                        )}
                      </span>
                    </button>
                    <div
                      className="grid transition-[grid-template-rows] duration-300 ease-out"
                      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <p className="border-t border-neutral-200 px-6 pb-6 pt-4 text-[13px] leading-relaxed text-neutral-500">
                          {faq.a}
                        </p>
                      </div>
                    </div>
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
