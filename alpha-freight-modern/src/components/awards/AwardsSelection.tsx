"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

import { SELECTION_CRITERIA } from "@/lib/awards-content";
import { AnimatedCounter, BlackGlassPanel, ScrollReveal, SectionShell } from "./awards-shared";

type CriteriaId = (typeof SELECTION_CRITERIA)[number]["id"];

const RING_RADIUS = 78;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function AwardsSelection() {
  const [active, setActive] = useState<CriteriaId>(SELECTION_CRITERIA[0].id);
  const activeItem = SELECTION_CRITERIA.find((c) => c.id === active) ?? SELECTION_CRITERIA[0];
  const total = SELECTION_CRITERIA.reduce((s, c) => s + c.value, 0);
  let offset = 0;

  return (
    <section className="relative bg-[#0a0a0a] py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(59,130,246,0.12),transparent_70%)]" />
      <div className="relative z-[1] mx-auto max-w-[1320px] px-6 lg:px-10">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#93C5FD]">Selection process</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">How winners are selected</h2>
          <p className="mt-5 text-base leading-relaxed text-white/50 sm:text-lg">
            Transparent scoring from verified Alpha Freight marketplace activity — no voting, no politics.
          </p>
        </div>

        <ScrollReveal>
          <BlackGlassPanel className="border-white/[0.06] p-6 sm:p-10 lg:p-12">
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-[#3B82F6]/20 bg-[#3B82F6]/10 px-5 py-4">
              <BarChart3 className="h-5 w-5 text-[#93C5FD]" />
              <p className="text-sm text-white/70">
                Scores calculated from <span className="font-semibold text-white">12,000+ verified reviews</span> and live marketplace data.
              </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="relative mx-auto aspect-square w-full max-w-[320px]">
                <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden>
                  <circle cx="100" cy="100" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="16" />
                  {SELECTION_CRITERIA.map((item) => {
                    const dash = (item.value / total) * RING_CIRCUMFERENCE;
                    const gap = RING_CIRCUMFERENCE - dash;
                    const el = (
                      <motion.circle
                        key={item.id}
                        cx="100"
                        cy="100"
                        r={RING_RADIUS}
                        fill="none"
                        stroke={active === item.id ? "#3B82F6" : "rgba(255,255,255,0.12)"}
                        strokeWidth={active === item.id ? 16 : 11}
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    );
                    offset += dash;
                    return el;
                  })}
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                  <p className="text-5xl font-semibold tabular-nums text-white sm:text-6xl">
                    <AnimatedCounter value={activeItem.value} />
                    <span className="text-white/80">%</span>
                  </p>
                  <p className="mt-3 max-w-[160px] text-sm font-medium leading-snug text-white/50">{activeItem.label}</p>
                </div>
              </div>

              <div className="space-y-3">
                {SELECTION_CRITERIA.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setActive(item.id)}
                    onFocus={() => setActive(item.id)}
                    className={`w-full rounded-2xl border px-5 py-4 text-left transition-all duration-300 ${
                      active === item.id
                        ? "border-[#3B82F6]/50 bg-[#3B82F6]/10 shadow-[0_0_40px_rgba(59,130,246,0.12)]"
                        : "border-white/[0.08] bg-white/[0.03] hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-white">{item.label}</span>
                      <span className="text-lg font-semibold tabular-nums text-[#93C5FD]">{item.value}%</span>
                    </div>
                    {active === item.id ? (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-2 text-sm leading-relaxed text-white/50"
                      >
                        {item.explanation}
                      </motion.p>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </BlackGlassPanel>
        </ScrollReveal>
      </div>
    </section>
  );
}
