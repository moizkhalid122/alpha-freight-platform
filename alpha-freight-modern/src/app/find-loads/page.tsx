"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Counter from "@/components/Counter";
import { FindLoadsPlatformSection } from "@/components/marketing/find-loads-platform";
import { FindLoadsWorkflowSection } from "@/components/marketing/find-loads-workflow";
import JsonLd from "@/components/seo/JsonLd";
import { CinematicCTA, Footer } from "@/components/Footer";

const stats = [
  { label: "Live loads daily", value: 120, suffix: "+" },
  { label: "Carrier payout", value: 7, suffix: " days" },
  { label: "Verified shippers", value: 200, suffix: "+" },
  { label: "UK corridors", value: 50, suffix: "+" },
];

const sampleLoads = [
  { ref: "AF-482910", lane: "London → Manchester", rate: "£418", equip: "Curtain-side" },
  { ref: "AF-482876", lane: "Birmingham → Leeds", rate: "£312", equip: "General haulage" },
  { ref: "AF-482801", lane: "Glasgow → Edinburgh", rate: "£285", equip: "Refrigerated" },
];

const faqs = [
  {
    question: "How do I find loads in the UK?",
    answer:
      "Sign up as a carrier on Alpha Freight, browse the live load board, filter by route and equipment, and submit bids on lanes that fit your fleet.",
  },
  {
    question: "Is Alpha Freight free for carriers to find loads?",
    answer:
      "Yes — browsing loads and creating a carrier account is free. You only earn when you complete assigned freight.",
  },
  {
    question: "What types of loads can I find?",
    answer:
      "General haulage, pallet freight, express lanes, and equipment-specific jobs posted by verified UK suppliers.",
  },
];

export default function FindLoadsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroY = useTransform(scrollYProgress, [0, 0.18], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.14], [1, 0]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen overflow-x-hidden bg-black text-white selection:bg-[#BFFF07] selection:text-black"
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />

      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 z-0">
            <Image
              src="/alpha freight truck.jpg"
              alt=""
              fill
              priority
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/30" />
            <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-[#BFFF07]/10 blur-[120px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#BFFF0708_1px,transparent_1px),linear-gradient(to_bottom,#BFFF0708_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_55%,transparent_100%)]" />
          </div>

          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative z-20 mx-auto w-full max-w-[1800px] px-6 pb-16 md:pb-24 lg:px-12"
          >
            <div className="grid items-end gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#BFFF07]/20 bg-[#BFFF07]/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.35em] text-[#BFFF07]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  For carriers
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.08 }}
                  className="max-w-4xl text-[3rem] font-medium leading-[0.9] tracking-tighter sm:text-[4.5rem] md:text-[5.5rem] lg:text-[6rem] uppercase"
                >
                  Find Loads
                  <br />
                  <span className="text-[#BFFF07]">In The UK</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.16 }}
                  className="mt-8 max-w-xl text-lg leading-relaxed text-white/50 md:text-xl"
                >
                  Search live haulage and freight on Alpha Freight&apos;s UK load board. Verified shippers,
                  smart matching, GPS tracking, digital POD, and 7-day carrier payouts.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.22 }}
                  className="mt-10 flex flex-wrap gap-4"
                >
                  <Link
                    href="/available-loads"
                    className="inline-flex items-center gap-2 rounded-full bg-[#BFFF07] px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-white"
                  >
                    Browse live loads
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/auth/carrier-signup"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white/10"
                  >
                    Join as carrier
                  </Link>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="rounded-[2rem] border border-white/10 bg-black/40 p-6 backdrop-blur-2xl md:p-8"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">Live load board</p>
                  <span className="flex items-center gap-1.5 rounded-full border border-[#BFFF07]/20 bg-[#BFFF07]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#BFFF07]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#BFFF07]" />
                    Updated now
                  </span>
                </div>
                <ul className="mt-5 space-y-3">
                  {sampleLoads.map((load) => (
                    <li
                      key={load.ref}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{load.lane}</p>
                        <p className="mt-0.5 text-[11px] text-white/40">
                          {load.ref} · {load.equip}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[#BFFF07]">{load.rate}</p>
                        <p className="text-[10px] text-white/35">Open</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[11px] leading-relaxed text-white/35">
                  Sample loads on active UK corridors — sign in to bid on live marketplace freight.
                </p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-white/30"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Explore platform</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </motion.div>
        </section>

        {/* Stats */}
        <section className="border-b border-black/5 bg-white py-16 text-black md:py-20">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.55 }}
                  viewport={{ once: true }}
                >
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">{stat.label}</p>
                  <p className="text-4xl font-medium tracking-tighter md:text-5xl">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

                <FindLoadsPlatformSection />
        <FindLoadsWorkflowSection />

        {/* Load board preview + coverage */}
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -inset-4 rounded-[2.5rem] bg-[#BFFF07]/10 blur-2xl" />
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                  <Image
                    src="/carrier-card-1.png"
                    alt="Alpha Freight carrier load board interface"
                    width={1200}
                    height={900}
                    className="h-auto w-full"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#BFFF07]">UK coverage</p>
                <h2 className="mt-5 text-3xl font-medium uppercase leading-[0.95] tracking-tighter md:text-[2.75rem]">
                  Find freight loads
                  <br />
                  <span className="text-white/30">nationwide.</span>
                </h2>
                <p className="mt-6 max-w-lg leading-relaxed text-white/45">
                  From London and Midlands distribution to Scotland, Wales, and Northern Ireland — browse loads
                  posted daily by verified UK suppliers on Alpha Freight.
                </p>

                <ul className="mt-8 space-y-4">
                  {[
                    { icon: MapPin, text: "London, Midlands, North, Scotland, Wales & NI lanes" },
                    { icon: Truck, text: "General haulage, pallet, express & equipment-specific jobs" },
                    { icon: ShieldCheck, text: "Verified shippers with transparent load details" },
                    { icon: Clock3, text: "GPS tracking, digital POD, and 7-day carrier payouts" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <li
                        key={item.text}
                        className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5"
                      >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#BFFF07]" />
                        <span className="text-sm leading-relaxed text-white/60">{item.text}</span>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  href="/available-loads"
                  className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#BFFF07] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-white"
                >
                  Browse live loads
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-white/10 bg-[#f5f5f2] py-24 text-black md:py-32">
          <div className="mx-auto max-w-3xl px-6 lg:px-12">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/35">FAQ</p>
              <h2 className="mt-4 text-3xl font-medium uppercase tracking-tighter md:text-4xl">
                Finding loads in the UK
              </h2>
            </div>

            <div className="mt-10 space-y-3">
              {faqs.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={item.question}
                    className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <span className="font-semibold tracking-tight">{item.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-black/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <p className="border-t border-black/5 px-6 pb-5 pt-4 text-sm leading-relaxed text-black/55">
                            {item.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <CinematicCTA
        title="Ready to find your next load?"
        subtitle="Join verified carriers on Alpha Freight"
        buttonText="Browse Loads"
        buttonHref="/available-loads"
      />
      <Footer />
    </div>
  );
}
