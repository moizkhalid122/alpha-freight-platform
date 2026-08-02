"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { AWARDS_FAQ } from "@/lib/awards-content";
import { ScrollReveal, SectionShell } from "./awards-shared";

export function AwardsFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-[#0a0a0a] py-24 sm:py-32">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#93C5FD]">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Common questions</h2>
          <p className="mt-5 text-base leading-relaxed text-white/50">
            Everything you need to know about eligibility and the ceremony.
          </p>
        </div>

        <ScrollReveal>
          <div className="mx-auto max-w-3xl space-y-3">
            {AWARDS_FAQ.map((item, index) => {
              const isOpen = open === index;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-sm font-semibold text-white sm:text-base">{item.q}</span>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      <ChevronDown className="h-5 w-5 shrink-0 text-[#93C5FD]" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="border-t border-white/[0.08] px-6 pb-5 pt-4 text-sm leading-relaxed text-white/50">
                          {item.a}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
