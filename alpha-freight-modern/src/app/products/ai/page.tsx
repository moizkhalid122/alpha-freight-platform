"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Gauge,
  LineChart,
  Sparkles,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";

const intelligenceCards = [
  {
    title: "ETA Forecasting",
    copy:
      "Predict delivery windows with live traffic, route history, dwell-time patterns, and carrier behavior models.",
    icon: Clock3,
  },
  {
    title: "Delay Detection",
    copy:
      "Surface operational risk before it becomes customer-facing through anomaly tracking and exception scoring.",
    icon: AlertTriangle,
  },
  {
    title: "Demand Modeling",
    copy:
      "Understand shipment pressure, lane volatility, and recurring network behavior with cleaner predictive signal.",
    icon: LineChart,
  },
];

const workflow = [
  {
    step: "01",
    title: "Ingest Live Network Data",
    description:
      "We process fleet telemetry, operational timestamps, route history, and delivery events into one predictive layer.",
  },
  {
    step: "02",
    title: "Score Patterns In Real Time",
    description:
      "The AI engine evaluates lane movement, dwell behavior, and service reliability to detect the next likely shift.",
  },
  {
    step: "03",
    title: "Trigger Better Decisions",
    description:
      "Dispatch teams get earlier warnings, sharper ETAs, and cleaner interventions before delays impact execution.",
  },
];

const heroImages = [
  { src: "/hero-1.svg", className: "left-[17%] top-[6%] w-[228px] xl:w-[268px]" },
  { src: "/hero-2.svg", className: "left-[40%] top-[10%] w-[228px] xl:w-[268px]" },
  { src: "/hero-3.svg", className: "left-[63%] top-[15%] w-[228px] xl:w-[268px]" },
  { src: "/hero-4.svg", className: "left-[17%] top-[34%] w-[228px] xl:w-[268px]" },
  { src: "/hero-5.svg", className: "left-[40%] top-[39%] w-[228px] xl:w-[268px]" },
  { src: "/hero-6.svg", className: "left-[63%] top-[44%] w-[228px] xl:w-[268px]" },
];

export default function PredictiveAIPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main>
        <section className="relative min-h-screen overflow-hidden border-b border-black/5 bg-[#fbfbfa]">
          <div className="absolute inset-0 opacity-[0.06]">
            <div className="absolute inset-y-0 left-1/4 w-px bg-black/20" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-black/20" />
            <div className="absolute inset-y-0 left-3/4 w-px bg-black/20" />
          </div>
          <div className="absolute left-[-8%] top-24 h-72 w-72 rounded-full bg-[#BFFF07]/10 blur-[110px]" />
          <div className="absolute right-[-10%] top-16 h-[28rem] w-[28rem] rounded-full bg-slate-200/60 blur-[140px]" />

          <motion.div
            initial={{ opacity: 0.72, scale: 0.92, rotate: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0.72, 0.88, 1],
              scale: [0.92, 0.94, 1.24],
              rotate: [0, 0, -17],
              x: [0, 0, -170],
              y: [0, 0, 96],
            }}
            transition={{
              duration: 2.7,
              delay: 0.18,
              times: [0, 0.34, 1],
              ease: [0.16, 1, 0.3, 1],
            }}
            className="pointer-events-none absolute right-[-3%] top-[-2%] hidden h-[112%] w-[78%] origin-top-right lg:block"
          >
            {heroImages.map((panel, index) => (
              <motion.div
                key={panel.src}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 + index * 0.08, duration: 0.55 }}
                className={`absolute aspect-[340/330] ${panel.className}`}
              >
                <Image
                  src={panel.src}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 320px, 260px"
                  className="object-contain opacity-80"
                />
              </motion.div>
            ))}
          </motion.div>

          <div className="relative mx-auto flex min-h-screen max-w-[1800px] items-center px-6 py-24 lg:px-12 lg:py-28">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10 max-w-[35rem]"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.22)]">
                <Sparkles className="h-3.5 w-3.5" />
                Alpha Freight Predictive AI
              </div>

              <h1 className="mt-8 max-w-[11ch] text-[3.2rem] font-medium leading-[0.92] tracking-[-0.06em] text-black sm:text-[4.15rem] md:text-[4.9rem] lg:text-[5.4rem]">
                Turn freight data
                <br />
                into early
                <br />
                decisions.
              </h1>

              <p className="mt-6 max-w-[30rem] text-[15px] font-medium leading-7 text-slate-600 md:text-[17px]">
                Connect live shipment data, detect delay risk sooner, and let teams
                generate cleaner ETA decisions automatically across the network.
              </p>

              <div className="mt-8 max-w-[33rem] rounded-[24px] border border-slate-200 bg-white/90 p-3 shadow-[0_28px_70px_-44px_rgba(15,23,42,0.22)] backdrop-blur-md">
                <div className="rounded-[18px] border border-slate-100 bg-[#fbfbfa] px-4 py-4">
                  <p className="text-[13px] font-medium tracking-[-0.02em] text-slate-500">
                    Show me high-risk lanes from the last 14 days and forecast late-delivery probability.
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-[#fbfbfa]">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-[#fbfbfa]">
                      <LineChart className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    Generate
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 rounded-full bg-[#245BFF] px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.22em] text-white transition-transform hover:scale-[1.02]"
                >
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-900 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.18)] transition-colors hover:bg-slate-50"
                >
                  Book Demo
                </Link>
              </div>

              <p className="mt-4 text-[11px] font-bold tracking-[-0.01em] text-[#245BFF]">
                14 day trial, no card required
              </p>
            </motion.div>

            <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-full bg-gradient-to-r from-[#fbfbfa] via-[#fbfbfa]/92 via-[34%] to-transparent" />
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#fbfbfa]/14 via-transparent to-[#fbfbfa]/38" />
          </div>
        </section>

        <section className="bg-white py-28 text-slate-900">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="mb-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">
                  Predictive Capabilities
                </p>
                <h2 className="mt-5 text-4xl font-medium tracking-tight text-black md:text-6xl">
                  Earlier signal. Cleaner action.
                </h2>
              </div>
              <p className="max-w-xl text-sm font-medium leading-7 text-slate-500 md:text-base">
                The system is designed to help dispatch, operations, and customer teams move
                before disruption spreads through the shipment lifecycle.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {intelligenceCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  whileHover={{ y: -6 }}
                  className="rounded-[2rem] border border-slate-200 bg-[#f6f5f4] p-8 shadow-[0_24px_60px_-52px_rgba(15,23,42,0.2)]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <card.icon className="h-6 w-6 text-slate-900" />
                  </div>
                  <h3 className="mt-8 text-2xl font-black tracking-tight text-slate-900">
                    {card.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-500">{card.copy}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f8f9fa] py-28 text-slate-900">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="grid items-center gap-8 lg:grid-cols-[0.88fr_1.12fr]">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-[2.4rem] border border-slate-200 bg-white p-8 shadow-[0_26px_60px_-52px_rgba(15,23,42,0.24)]"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  How It Works
                </p>
                <div className="mt-8 space-y-5">
                  {workflow.map((item) => (
                    <div
                      key={item.step}
                      className="rounded-[1.6rem] border border-slate-200 bg-[#f6f5f4] p-6"
                    >
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                        Step {item.step}
                      </div>
                      <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 }}
                className="rounded-[2.6rem] border border-slate-200 bg-[#111] p-7 text-white shadow-[0_30px_80px_-56px_rgba(15,23,42,0.45)]"
              >
                <div className="grid gap-5 md:grid-cols-[0.95fr_1.05fr] md:items-center">
                  <div className="space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#BFFF07]">
                      <Gauge className="h-3.5 w-3.5" />
                      Forecast Output
                    </div>
                    <h3 className="text-3xl font-black tracking-tight">
                      Better dispatch starts before the problem appears.
                    </h3>
                    <p className="text-sm leading-7 text-white/45">
                      Predictive AI gives a cleaner operational read on what is likely to
                      happen next, so teams can re-route, communicate, and recover earlier.
                    </p>
                  </div>

                  <div className="relative h-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]">
                    <Image
                      src="/alpha-freight-mobile-app.png"
                      alt="Predictive AI dashboard"
                      fill
                      className="object-contain object-center scale-[0.92]"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <CinematicCTA
          title="Move With Better Forecasting"
          subtitle="PREDICT DELAYS, IMPROVE ETAS, AND GIVE OPERATIONS A STRONGER DECISION LAYER"
          buttonText="Book AI Walkthrough"
          buttonHref="/contact"
        />
      </main>

      <Footer />
    </div>
  );
}
