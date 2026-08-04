"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Package, Sparkles, Zap } from "lucide-react";

import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";

const releases = [
  {
    version: "v2.8.0",
    date: "July 2026",
    tag: "Latest",
    highlights: [
      "Supplier live GPS tracking on web",
      "Realtime load map with route context",
      "Analytics measurement reliability improvements",
      "Premium brand kit and content surfaces",
    ],
  },
  {
    version: "v2.7.2",
    date: "June 2026",
    highlights: [
      "Carrier wallet payout setup refinements",
      "Instant book success flow polish",
      "Admin supplier and carrier management updates",
      "Support and docs navigation improvements",
    ],
  },
  {
    version: "v2.7.0",
    date: "May 2026",
    highlights: [
      "Smart matching and available loads UX refresh",
      "Digital POD product page and workflow messaging",
      "Directory and supplier discovery updates",
      "Mobile app parity improvements for tracking",
    ],
  },
  {
    version: "v2.6.4",
    date: "April 2026",
    highlights: [
      "Referral flows for suppliers and carriers",
      "Pay instant and pay later supplier journeys",
      "Carrier earnings and bid management updates",
      "System status and knowledge base expansion",
    ],
  },
];

const stats = [
  { icon: Zap, label: "Faster visibility", value: "Live tracking" },
  { icon: Package, label: "Core workflows", value: "Loads + POD" },
  { icon: Sparkles, label: "Intelligence", value: "AI assistant" },
];

export default function ProductReleasesPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f2] text-black overflow-x-hidden">
      <Navbar variant="dark" />

      <main className="pt-28 md:pt-32">
        <section className="pb-16 md:pb-24">
          <div className="max-w-[1200px] mx-auto px-5 md:px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 mb-5">
                Release Notes
              </p>
              <h1 className="text-[3rem] sm:text-[4.5rem] md:text-[5.5rem] font-medium leading-[0.92] tracking-tighter text-[#171717] uppercase">
                What we ship,
                <br />
                and when.
              </h1>
              <p className="mt-6 max-w-2xl text-[17px] md:text-[19px] leading-relaxed text-black/50">
                Product updates across the Alpha Freight marketplace, supplier portal, carrier tools, and platform infrastructure.
              </p>
            </motion.div>

            <div className="mt-12 grid sm:grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.08, duration: 0.5 }}
                  className="rounded-[1.5rem] border border-black/10 bg-white p-6"
                >
                  <stat.icon className="h-5 w-5 text-black/35 mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-medium tracking-tight">{stat.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-24 md:pb-32">
          <div className="max-w-[1200px] mx-auto px-5 md:px-6 lg:px-12 space-y-5">
            {releases.map((release, index) => (
              <motion.article
                key={release.version}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.55 }}
                viewport={{ once: true }}
                className="rounded-[2rem] border border-black/10 bg-white p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.04)]"
              >
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <h2 className="text-3xl md:text-4xl font-medium tracking-tight">{release.version}</h2>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/35">
                    {release.date}
                  </span>
                  {release.tag ? (
                    <span className="rounded-full bg-[#BFFF07] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                      {release.tag}
                    </span>
                  ) : null}
                </div>

                <ul className="grid md:grid-cols-2 gap-3">
                  {release.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-black/55">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-black/20 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>

          <div className="max-w-[1200px] mx-auto px-5 md:px-6 lg:px-12 mt-12">
            <Link
              href="/products/roadmap"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-black/45 hover:text-black transition-colors"
            >
              Explore the full roadmap
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <CinematicCTA
        title="Stay close to every platform update"
        subtitle="Build on Alpha Freight"
        buttonText="View Documentation"
        buttonHref="/docs"
      />
      <Footer />
    </div>
  );
}
