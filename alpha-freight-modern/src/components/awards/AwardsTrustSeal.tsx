"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";

import { TRUST_SEALS } from "@/lib/awards-content";
import { BlackGlassPanel, ScrollReveal, SectionShell, TiltCard } from "./awards-shared";

export function AwardsTrustSeal() {
  return (
    <SectionShell
      eyebrow="Trust seal"
      title="The Alpha Freight Trust Seal"
      subtitle="Every winner receives an official seal for website, email, LinkedIn, and business cards."
      centered
    >
      <ScrollReveal>
        <div className="grid gap-5 md:grid-cols-3">
          {TRUST_SEALS.map((seal, i) => (
            <motion.div
              key={seal.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <TiltCard className="h-full">
                <BlackGlassPanel className="flex h-full flex-col p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#3B82F6]/30 bg-[#3B82F6]/10">
                    <Shield className="h-8 w-8 text-[#93C5FD]" />
                  </div>
                  <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Alpha Freight</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{seal.title}</h3>
                  <p className="mt-1 text-sm text-[#93C5FD]">{seal.subtitle}</p>
                  <p className="mt-4 text-sm leading-relaxed text-white/45">{seal.desc}</p>
                  <div className="mt-6 inline-flex items-center justify-center gap-1 rounded-full border border-[#3B82F6]/25 bg-[#3B82F6]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#93C5FD]">
                    2027 Verified
                  </div>
                </BlackGlassPanel>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </ScrollReveal>
    </SectionShell>
  );
}
