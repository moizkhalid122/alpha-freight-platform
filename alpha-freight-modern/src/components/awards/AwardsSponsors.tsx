"use client";

import { motion } from "framer-motion";

import { SPONSOR_TIERS } from "@/lib/awards-content";
import { ScrollReveal, SectionShell } from "./awards-shared";

export function AwardsSponsors() {
  return (
    <section className="relative bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#3B82F6]">Sponsors</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl">Premium partner wall</h2>
          <p className="mt-5 text-base leading-relaxed text-slate-500">
            Partner brands supporting trophies, gifts, and industry recognition.
          </p>
        </div>

        <ScrollReveal>
          <div className="space-y-10">
            {SPONSOR_TIERS.map((group, gi) => (
              <div key={group.tier}>
                <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                  {group.tier}
                </p>
                <div
                  className={`grid gap-4 ${
                    group.names.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
                  }`}
                >
                  {group.names.map((name, i) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: gi * 0.1 + i * 0.06 }}
                      whileHover={{ y: -4 }}
                      className="flex h-24 items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-6 shadow-sm transition hover:border-[#3B82F6]/30 hover:shadow-[0_12px_40px_rgba(59,130,246,0.08)]"
                    >
                      <span className="text-center text-sm font-bold uppercase tracking-[0.12em] text-slate-700 transition group-hover:text-[#3B82F6]">
                        {name}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
