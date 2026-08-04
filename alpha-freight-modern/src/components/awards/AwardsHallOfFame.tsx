"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";

import { AWARDS_EVENT, HALL_OF_FAME_BY_TAB, HALL_OF_FAME_TABS } from "@/lib/awards-content";
import { BlackGlassPanel, ScrollReveal, SectionShell, TiltCard } from "./awards-shared";

export function AwardsHallOfFame() {
  const [tab, setTab] = useState<(typeof HALL_OF_FAME_TABS)[number]>("Carrier");
  const finalists = HALL_OF_FAME_BY_TAB[tab];

  return (
    <section className="relative bg-[#0a0a0a] py-24 sm:py-32">
      <div className="relative z-[1] mx-auto max-w-[1320px] px-6 lg:px-10">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#93C5FD]">Hall of fame</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Top finalists</h2>
          <p className="mt-5 text-base leading-relaxed text-white/50">
            Luxury showcase — winners revealed live at the London ceremony on {AWARDS_EVENT.displayDate}.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {HALL_OF_FAME_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                tab === t
                  ? "bg-[#3B82F6] text-white shadow-[0_4px_20px_rgba(59,130,246,0.3)]"
                  : "border border-white/10 bg-white/[0.04] text-white/50 hover:border-white/20"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <ScrollReveal>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 16, rotateX: 8 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -16, rotateX: -8 }}
              transition={{ duration: 0.4 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              style={{ transformPerspective: 1000 }}
            >
              {finalists.map((finalist, index) => (
                <motion.div
                  key={finalist.company}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <TiltCard className="h-full">
                    <BlackGlassPanel className="flex h-full min-h-[220px] flex-col p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#3B82F6]/25 bg-[#3B82F6]/10">
                        <Trophy className="h-6 w-6 text-[#93C5FD]" />
                      </div>
                      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#93C5FD]">
                        {finalist.category}
                      </p>
                      <h3 className="mt-2 text-base font-semibold text-white">{finalist.company}</h3>
                      <p className="mt-auto pt-4 text-xs text-white/40">{finalist.name} · Revealed live 2027</p>
                    </BlackGlassPanel>
                  </TiltCard>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </ScrollReveal>
      </div>
    </section>
  );
}
