"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  ChevronDown,
  Globe2,
  Layers3,
  MapPinned,
  Radar,
  Rocket,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Counter from "@/components/Counter";
import { CinematicCTA, Footer } from "@/components/Footer";

type QuarterItem = {
  title: string;
  detail: string;
  tag: string;
  icon: typeof MapPinned;
};

type Quarter = {
  id: string;
  period: string;
  status: "Shipped" | "In Progress" | "Planned" | "Exploring";
  progress: number;
  headline: string;
  summary: string;
  image: string;
  items: QuarterItem[];
};

const quarters: Quarter[] = [
  {
    id: "q1-2026",
    period: "Q1 2026",
    status: "Shipped",
    progress: 100,
    headline: "Visibility layer goes live",
    summary:
      "We closed the gap between mobile GPS and supplier operations — giving shippers a live command view of every active movement.",
    image: "/service-detail-4.avif",
    items: [
      {
        title: "Supplier live GPS tracking",
        detail: "Realtime map, route context, and shipment status on web.",
        tag: "Tracking",
        icon: MapPinned,
      },
      {
        title: "Analytics reliability",
        detail: "Measurement alignment across platform and marketing surfaces.",
        tag: "Platform",
        icon: BarChart3,
      },
      {
        title: "Brand kit refresh",
        detail: "Premium documentation for logos, colors, and partner usage.",
        tag: "Brand",
        icon: Sparkles,
      },
      {
        title: "Carrier wallet polish",
        detail: "Cleaner payout setup and earnings visibility for fleets.",
        tag: "Payments",
        icon: Wallet,
      },
    ],
  },
  {
    id: "q2-2026",
    period: "Q2 2026",
    status: "In Progress",
    progress: 62,
    headline: "Scale the marketplace engine",
    summary:
      "The current sprint focuses on broker-ready workflows, smarter lane intelligence, and a complete academy enrollment experience.",
    image: "/service-detail-2.avif",
    items: [
      {
        title: "White-label broker flows",
        detail: "Partner-ready branding and operational handoff tooling.",
        tag: "Partners",
        icon: Layers3,
      },
      {
        title: "Advanced lane analytics",
        detail: "Deeper supplier insights across demand, timing, and coverage.",
        tag: "Intelligence",
        icon: Radar,
      },
      {
        title: "Verification automation",
        detail: "Faster carrier onboarding with stronger compliance signals.",
        tag: "Trust",
        icon: ShieldCheck,
      },
      {
        title: "Academy enrollment portal",
        detail: "Premium course enrollment and bundle reservation flows.",
        tag: "Academy",
        icon: Rocket,
      },
    ],
  },
  {
    id: "q3-2026",
    period: "Q3 2026",
    status: "Planned",
    progress: 28,
    headline: "Predictive operations arrive",
    summary:
      "Next phase brings sharper forecasting, partner APIs, and sustainability reporting for operators planning beyond single lanes.",
    image: "/service-detail-3.avif",
    items: [
      {
        title: "Cross-border lane intelligence",
        detail: "Better planning signals for international and multi-leg freight.",
        tag: "Network",
        icon: Globe2,
      },
      {
        title: "Predictive delay alerts",
        detail: "Proactive exception signals while loads are still in motion.",
        tag: "AI",
        icon: Bot,
      },
      {
        title: "Partner API marketplace",
        detail: "External integrations for TMS, finance, and compliance tools.",
        tag: "API",
        icon: Zap,
      },
      {
        title: "Sustainability reporting",
        detail: "Fleet efficiency and emissions visibility for modern operators.",
        tag: "Green",
        icon: Truck,
      },
    ],
  },
  {
    id: "q4-2026",
    period: "Q4 2026",
    status: "Exploring",
    progress: 12,
    headline: "Enterprise-grade expansion",
    summary:
      "Long-range bets around broker operations, insurance integrations, and enterprise identity for large shipper programs.",
    image: "/alpha-freight-hero.png",
    items: [
      {
        title: "Multi-tenant broker layer",
        detail: "Operational control for partners running branded freight networks.",
        tag: "Enterprise",
        icon: Layers3,
      },
      {
        title: "Insurance integrations",
        detail: "Compliance and cover workflows embedded into load lifecycle.",
        tag: "Compliance",
        icon: ShieldCheck,
      },
      {
        title: "AI dispatch recommendations",
        detail: "Smarter assignment suggestions based on live network performance.",
        tag: "AI",
        icon: Bot,
      },
      {
        title: "Enterprise SSO",
        detail: "Secure access for large supplier and logistics organizations.",
        tag: "Security",
        icon: ShieldCheck,
      },
    ],
  },
];

const pillars = [
  {
    title: "Visibility First",
    stat: "Live",
    description:
      "Tracking, POD, and shipment truth should never be optional. Every release strengthens operational clarity.",
    image: "/how-1.jpg",
  },
  {
    title: "AI With Purpose",
    stat: "Role-aware",
    description:
      "Intelligence is only valuable when it understands supplier, carrier, and admin workflows in the real world.",
    image: "/how-2.jpg",
  },
  {
    title: "Scale Without Friction",
    stat: "Faster",
    description:
      "Onboarding, payouts, verification, and partner growth must get easier as the network gets larger.",
    image: "/how-3.jpg",
  },
];

const momentumStats = [
  { label: "Roadmap phases", value: 4, suffix: "" },
  { label: "Features shipped Q1", value: 12, suffix: "+" },
  { label: "Active product streams", value: 8, suffix: "" },
  { label: "Platform uptime target", value: 99, suffix: ".9%" },
];

const statusStyles: Record<Quarter["status"], string> = {
  Shipped: "bg-[#BFFF07] text-black",
  "In Progress": "bg-white text-black",
  Planned: "bg-white/10 text-white border border-white/15",
  Exploring: "bg-white/5 text-white/60 border border-white/10",
};

export default function ProductRoadmapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeQuarter, setActiveQuarter] = useState(quarters[1].id);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroY = useTransform(scrollYProgress, [0, 0.18], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.16], [1, 0]);
  const selected = quarters.find((quarter) => quarter.id === activeQuarter) ?? quarters[0];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-black text-white selection:bg-[#BFFF07] selection:text-black overflow-x-hidden"
    >
      <Navbar />

      <main>
        {/* Cinematic Hero */}
        <section className="relative h-screen min-h-[720px] flex flex-col justify-end overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover opacity-50"
            >
              <source src="/alpha-video.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#BFFF0708_1px,transparent_1px),linear-gradient(to_bottom,#BFFF0708_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_55%,transparent_100%)]" />
          </div>

          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative z-20 max-w-[1800px] mx-auto w-full px-6 lg:px-12 pb-16 md:pb-24"
          >
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-end">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="inline-flex items-center gap-3 rounded-full border border-[#BFFF07]/20 bg-[#BFFF07]/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.35em] text-[#BFFF07] mb-8"
                >
                  <span className="h-2 w-2 rounded-full bg-[#BFFF07] animate-pulse" />
                  Product Roadmap 2026
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="text-[3.5rem] sm:text-[5.5rem] md:text-[7rem] lg:text-[8rem] font-medium leading-[0.88] tracking-tighter uppercase"
                >
                  The Future
                  <br />
                  <span className="text-white/20">We&apos;re Building.</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="mt-8 max-w-2xl text-white/45 text-lg md:text-xl leading-relaxed"
                >
                  A live view of what Alpha Freight has shipped, what is in motion right now, and the platform bets shaping the next era of UK freight.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.25 }}
                className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 md:p-10"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/35 mb-6">
                  Current focus
                </p>
                <p className="text-3xl md:text-4xl font-medium tracking-tight uppercase leading-none">
                  {quarters[1].headline}
                </p>
                <div className="mt-6 h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${quarters[1].progress}%` }}
                    transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                    className="h-full rounded-full bg-[#BFFF07]"
                  />
                </div>
                <p className="mt-4 text-sm text-white/45 leading-relaxed">{quarters[1].summary}</p>
                <Link
                  href="/products/releases"
                  className="mt-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#BFFF07] hover:text-white transition-colors"
                >
                  View release notes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/30"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Explore roadmap</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </motion.div>
        </section>

        {/* Momentum Stats */}
        <section className="py-20 md:py-24 bg-white text-black border-b border-black/5">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              {momentumStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="text-center lg:text-left"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/35 mb-4">
                    {stat.label}
                  </p>
                  <p className="text-5xl md:text-6xl font-medium tracking-tighter">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Timeline */}
        <section className="py-24 md:py-32 bg-[#f5f5f2] text-black">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
              <div className="max-w-3xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/35 mb-5">
                  Quarterly Timeline
                </p>
                <h2 className="text-4xl md:text-[5rem] font-medium leading-[0.92] tracking-tighter uppercase">
                  From shipped
                  <br />
                  to exploring.
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                {quarters.map((quarter) => {
                  const isActive = quarter.id === activeQuarter;

                  return (
                    <button
                      key={quarter.id}
                      type="button"
                      onClick={() => setActiveQuarter(quarter.id)}
                      className={`rounded-full px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-all ${
                        isActive
                          ? "bg-black text-white shadow-[0_15px_40px_rgba(0,0,0,0.18)]"
                          : "bg-white text-black/50 border border-black/10 hover:text-black"
                      }`}
                    >
                      {quarter.period}
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45 }}
                className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 md:gap-8"
              >
                <div className="relative min-h-[520px] overflow-hidden rounded-[2.5rem] bg-black text-white">
                  <Image src={selected.image} alt="" fill className="object-cover opacity-45" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />

                  <div className="relative z-10 flex h-full flex-col justify-between p-8 md:p-12">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                        {selected.period}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${statusStyles[selected.status]}`}
                      >
                        {selected.status}
                      </span>
                    </div>

                    <div className="max-w-xl">
                      <h3 className="text-4xl md:text-5xl font-medium tracking-tight uppercase leading-[0.95]">
                        {selected.headline}
                      </h3>
                      <p className="mt-5 text-white/50 text-base md:text-lg leading-relaxed">
                        {selected.summary}
                      </p>

                      <div className="mt-8">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 mb-3">
                          <span>Completion</span>
                          <span>{selected.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#BFFF07] transition-all duration-700"
                            style={{ width: `${selected.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                  {selected.items.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.45 }}
                      className="group rounded-[2rem] border border-black/10 bg-white p-6 md:p-7 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(0,0,0,0.08)] transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-4 mb-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-[#BFFF07] group-hover:scale-105 transition-transform">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <span className="rounded-full bg-[#f2f2ec] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">
                          {item.tag}
                        </span>
                      </div>
                      <h4 className="text-xl font-medium tracking-tight">{item.title}</h4>
                      <p className="mt-3 text-sm leading-relaxed text-black/50">{item.detail}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Vertical Roadmap Rail */}
        <section className="py-24 md:py-32 bg-black border-y border-white/10">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="mb-16 max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#BFFF07] mb-5">
                Full Year View
              </p>
              <h2 className="text-4xl md:text-[4.5rem] font-medium leading-[0.92] tracking-tighter uppercase">
                Every quarter,
                <br />
                <span className="text-white/25">one direction.</span>
              </h2>
            </div>

            <div className="relative">
              <div className="absolute left-[18px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#BFFF07] via-white/20 to-transparent md:-translate-x-1/2" />

              <div className="space-y-16 md:space-y-24">
                {quarters.map((quarter, index) => (
                  <motion.div
                    key={quarter.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, delay: index * 0.05 }}
                    viewport={{ once: true, margin: "-80px" }}
                    className={`relative grid md:grid-cols-2 gap-10 md:gap-16 items-center ${
                      index % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""
                    }`}
                  >
                    <div className={`pl-12 md:pl-0 ${index % 2 === 1 ? "md:pr-16" : "md:pr-16 md:text-right"}`}>
                      <div className={`inline-flex items-center gap-3 mb-5 ${index % 2 === 1 ? "" : "md:justify-end md:w-full"}`}>
                        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">
                          {quarter.period}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${statusStyles[quarter.status]}`}>
                          {quarter.status}
                        </span>
                      </div>
                      <h3 className="text-3xl md:text-4xl font-medium tracking-tight uppercase leading-tight">
                        {quarter.headline}
                      </h3>
                      <p className="mt-4 text-white/45 leading-relaxed max-w-lg md:ml-auto">
                        {quarter.summary}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveQuarter(quarter.id)}
                        className={`mt-6 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#BFFF07] hover:text-white transition-colors ${
                          index % 2 === 0 ? "md:float-right" : ""
                        }`}
                      >
                        Inspect phase
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="pl-12 md:pl-0">
                      <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8">
                        <div className="grid grid-cols-2 gap-4">
                          {quarter.items.map((item) => (
                            <div key={item.title} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                              <item.icon className="h-4 w-4 text-[#BFFF07] mb-3" />
                              <p className="text-sm font-medium leading-snug">{item.title}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="absolute left-0 md:left-1/2 top-8 md:-translate-x-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-[#BFFF07]/40 bg-black text-[10px] font-bold text-[#BFFF07]">
                      0{index + 1}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Vision Pillars */}
        <section className="py-24 md:py-32 bg-white text-black">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/35 mb-5">
                  Product Principles
                </p>
                <h2 className="text-4xl md:text-[4.5rem] font-medium leading-[0.92] tracking-tighter uppercase">
                  How we choose
                  <br />
                  what ships next.
                </h2>
              </div>
              <p className="max-w-md text-black/50 leading-relaxed">
                Every roadmap decision is filtered through visibility, intelligence, and frictionless scale — not feature count.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-5 md:gap-6">
              {pillars.map((pillar, index) => (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="group relative min-h-[420px] overflow-hidden rounded-[2.5rem] bg-black text-white"
                >
                  <Image
                    src={pillar.image}
                    alt={pillar.title}
                    fill
                    className="object-cover opacity-35 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/20" />
                  <div className="relative z-10 flex h-full flex-col justify-between p-8 md:p-10">
                    <span className="inline-flex w-fit rounded-full border border-[#BFFF07]/20 bg-[#BFFF07]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#BFFF07]">
                      {pillar.stat}
                    </span>
                    <div>
                      <h3 className="text-3xl font-medium tracking-tight uppercase">{pillar.title}</h3>
                      <p className="mt-4 text-white/50 leading-relaxed">{pillar.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-14 flex flex-wrap gap-4">
              <Link
                href="/products/releases"
                className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white hover:bg-[#BFFF07] hover:text-black transition-colors"
              >
                View release notes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-black/15 px-7 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-black/55 hover:text-black transition-colors"
              >
                Request a feature
              </Link>
            </div>
          </div>
        </section>
      </main>

      <CinematicCTA
        title="Want early access to what's next?"
        subtitle="Partner with Alpha Freight"
        buttonText="Contact Sales"
        buttonHref="/contact"
      />
      <Footer />
    </div>
  );
}
